
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Package, Trash2, AlertTriangle, Wheat, FlaskConical, SprayCan, Blocks, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-provider';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';

type Category = 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Other';
type Unit = 'kg' | 'litres' | 'packets' | 'tonnes';

type InventoryItem = {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  lowStockThreshold: number;
};

const categoryIcons: Record<Category, React.ReactNode> = {
    Seeds: <Wheat className="h-4 w-4 text-amber-600" />,
    Fertilizers: <FlaskConical className="h-4 w-4 text-sky-600" />,
    Pesticides: <SprayCan className="h-4 w-4 text-red-600" />,
    Other: <Blocks className="h-4 w-4 text-slate-600" />,
};

export default function InventoryClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Each farmer's inventory lives in users/{uid}/inventory in Firestore.
  useEffect(() => {
    if (!user) {
      setInventory([]);
      return;
    }
    const col = collection(db, 'users', user.uid, 'inventory');
    const unsubscribe = onSnapshot(
      col,
      (snap) => setInventory(snap.docs.map((d) => d.data() as InventoryItem).sort((x, y) => x.name.localeCompare(y.name))),
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/inventory`)
    );
    return () => unsubscribe();
  }, [user]);

  const saveItem = async (item: InventoryItem) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'inventory', item.id), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/inventory/${item.id}`);
      toast({ variant: 'destructive', title: 'Could not save the item. Please try again.' });
    }
  };
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [addCategory, setAddCategory] = useState<Category | ''>('');
  const [addUnit, setAddUnit] = useState<Unit | ''>('');

  const [editCategory, setEditCategory] = useState<Category | ''>('');
  const [editUnit, setEditUnit] = useState<Unit | ''>('');
  const { t } = useI18n();

  const handleAddItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newItem: InventoryItem = {
      id: user ? doc(collection(db, 'users', user.uid, 'inventory')).id : `INV${Date.now()}`,
      name: formData.get('name') as string,
      category: addCategory as Category,
      quantity: Number(formData.get('quantity')),
      unit: addUnit as Unit,
      lowStockThreshold: Number(formData.get('lowStockThreshold')),
    };
    if (!newItem.category || !newItem.unit) {
      toast({ variant: 'destructive', title: 'Please choose a category and unit.' });
      return;
    }
    void saveItem(newItem);
    setIsAddDialogOpen(false);
    event.currentTarget.reset();
    setAddCategory('');
    setAddUnit('');
  };

  const handleEditItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(event.currentTarget);
    const updatedItem: InventoryItem = {
      ...editingItem,
      name: formData.get('name') as string,
      category: editCategory as Category,
      quantity: Number(formData.get('quantity')),
      unit: editUnit as Unit,
      lowStockThreshold: Number(formData.get('lowStockThreshold')),
    };

    void saveItem(updatedItem);
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };
  
  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'inventory', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/inventory/${id}`);
      toast({ variant: 'destructive', title: 'Could not delete the item.' });
    }
  };
  
  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditCategory(item.category);
    setEditUnit(item.unit);
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('current_inventory')}</CardTitle>
          <CardDescription>
            {t('all_supplies_in_one_place')}
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> {t('add_item')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddItem}>
              <DialogHeader>
                <DialogTitle>{t('add_new_inventory_item')}</DialogTitle>
                <DialogDescription>
                  {t('enter_new_supply_details')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="name" className="sm:text-right">{t('item_name')}</Label>
                  <Input id="name" name="name" className="sm:col-span-3" required placeholder={t('eg_urea_fertilizer')} />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="category" className="sm:text-right">{t('category')}</Label>
                    <Select required onValueChange={(value) => setAddCategory(value as Category)} value={addCategory}>
                      <SelectTrigger id="category" className="sm:col-span-3">
                        <SelectValue placeholder={t('select_a_category')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Seeds">{t('seeds')}</SelectItem>
                        <SelectItem value="Fertilizers">{t('fertilizers')}</SelectItem>
                        <SelectItem value="Pesticides">{t('pesticides')}</SelectItem>
                        <SelectItem value="Other">{t('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="quantity" className="sm:text-right">{t('quantity')}</Label>
                    <Input id="quantity" name="quantity" type="number" className="sm:col-span-3" required />
                  </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="unit" className="sm:text-right">{t('unit')}</Label>
                    <Select required onValueChange={(value) => setAddUnit(value as Unit)} value={addUnit}>
                      <SelectTrigger id="unit" className="sm:col-span-3">
                        <SelectValue placeholder={t('select_a_unit')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">{t('kilograms')}</SelectItem>
                        <SelectItem value="litres">{t('litres')}</SelectItem>
                        <SelectItem value="packets">{t('packets')}</SelectItem>
                        <SelectItem value="tonnes">{t('tonnes')}</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="lowStockThreshold" className="sm:text-right">{t('low_stock_at')}</Label>
                  <Input id="lowStockThreshold" name="lowStockThreshold" type="number" className="sm:col-span-3" required placeholder={t('eg_100')} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit">{t('add_to_inventory')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Package className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('item_name')}</TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead className="text-right">{t('quantity')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.length > 0 ? inventory.map((item) => {
              const isLowStock = item.quantity <= item.lowStockThreshold;
              return (
              <TableRow key={item.id} className={cn(isLowStock && 'bg-destructive/10')}>
                <TableCell className="font-medium flex items-center gap-2">
                    {categoryIcons[item.category]}
                    {item.name}
                </TableCell>
                <TableCell>{t(item.category.toLowerCase())}</TableCell>
                <TableCell className={cn("text-right font-mono", isLowStock && 'text-destructive font-bold')}>
                    <div className="flex items-center justify-end gap-2">
                      {isLowStock && <AlertTriangle className="h-4 w-4" />}
                      <span>{item.quantity.toLocaleString()} {t(item.unit)}</span>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t('edit')}</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('delete')}</span>
                    </Button>
                  </TableCell>
              </TableRow>
            )}) : (
               <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {t('no_inventory_items_added')}
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleEditItem}>
              <DialogHeader>
                <DialogTitle>{t('edit_inventory_item')}</DialogTitle>
                <DialogDescription>{t('update_supply_details')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="edit-name" className="sm:text-right">{t('item_name')}</Label>
                  <Input id="edit-name" name="name" className="sm:col-span-3" required defaultValue={editingItem.name} />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="edit-category" className="sm:text-right">{t('category')}</Label>
                    <Select required onValueChange={(value) => setEditCategory(value as Category)} value={editCategory}>
                      <SelectTrigger id="edit-category" className="sm:col-span-3">
                        <SelectValue placeholder={t('select_a_category')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Seeds">{t('seeds')}</SelectItem>
                        <SelectItem value="Fertilizers">{t('fertilizers')}</SelectItem>
                        <SelectItem value="Pesticides">{t('pesticides')}</SelectItem>
                        <SelectItem value="Other">{t('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="edit-quantity" className="sm:text-right">{t('quantity')}</Label>
                    <Input id="edit-quantity" name="quantity" type="number" className="sm:col-span-3" required defaultValue={editingItem.quantity} />
                  </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                    <Label htmlFor="edit-unit" className="sm:text-right">{t('unit')}</Label>
                    <Select required onValueChange={(value) => setEditUnit(value as Unit)} value={editUnit}>
                      <SelectTrigger id="edit-unit" className="sm:col-span-3">
                        <SelectValue placeholder={t('select_a_unit')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">{t('kilograms')}</SelectItem>
                        <SelectItem value="litres">{t('litres')}</SelectItem>
                        <SelectItem value="packets">{t('packets')}</SelectItem>
                        <SelectItem value="tonnes">{t('tonnes')}</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="edit-lowStockThreshold" className="sm:text-right">{t('low_stock_at')}</Label>
                  <Input id="edit-lowStockThreshold" name="lowStockThreshold" type="number" className="sm:col-span-3" required defaultValue={editingItem.lowStockThreshold} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit">{t('save_changes')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

    </Card>
  );
}
