
"use client";

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Sprout, BarChart3, Calendar, FileText } from 'lucide-react';
import { useRecords } from '@/context/records-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/use-i18n';

export default function RecordsClient() {
  const { records, addRecord, isLoading } = useRecords();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useI18n();

  const handleAddRecord = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newRecord = {
      crop: formData.get('crop') as string,
      yield: Number(formData.get('yield')),
      date: formData.get('date') as string,
      notes: formData.get('notes') as string,
    };
    addRecord(newRecord);
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('all_records')}</CardTitle>
          <CardDescription>
            {t('all_records_description')}
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> {t('add_record')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddRecord}>
              <DialogHeader>
                <DialogTitle>{t('add_new_record')}</DialogTitle>
                <DialogDescription>
                  {t('enter_new_record_details')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="crop" className="text-right">{t('crop')}</Label>
                  <Input id="crop" name="crop" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="yield" className="text-right">{t('yield_kg')}</Label>
                  <Input id="yield" name="yield" type="number" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">{t('date')}</Label>
                  <Input id="date" name="date" type="date" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">{t('notes')}</Label>
                  <Textarea id="notes" name="notes" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit">{t('save_record')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Sprout className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('crop')}</TableHead>
              <TableHead><BarChart3 className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('yield_kg')}</TableHead>
              <TableHead><Calendar className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('date')}</TableHead>
              <TableHead><FileText className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('notes')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    </TableRow>
                ))
            ) : records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.crop}</TableCell>
                <TableCell>{record.yield.toLocaleString()}</TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{record.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
