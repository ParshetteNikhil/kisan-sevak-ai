
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateAISchedule } from './actions';
import { getIdTokenOrThrow } from '@/lib/firebase';
import { PlusCircle, Tractor, Scissors, Wand2, Loader2, Bug, FlaskConical, Waves, Grab } from 'lucide-react';
import { isToday, isTomorrow, parseISO } from 'date-fns';
import { useTasks } from '@/context/tasks-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/use-i18n';

type Task = {
  id: string;
  activity: 'Planting' | 'Fertilizing' | 'Harvesting' | 'Weeding' | 'Pest Control' | 'Irrigation';
  crop: string;
  date: string;
  status: 'Upcoming' | 'Done' | 'Delayed';
};

const activityIcons: Record<Task['activity'], React.ReactNode> = {
  Planting: <Tractor className="h-4 w-4 text-green-500" />,
  Fertilizing: <FlaskConical className="h-4 w-4 text-sky-500" />,
  Harvesting: <Scissors className="h-4 w-4 text-amber-500" />,
  Weeding: <Grab className="h-4 w-4 text-orange-500" />,
  'Pest Control': <Bug className="h-4 w-4 text-red-500" />,
  Irrigation: <Waves className="h-4 w-4 text-blue-500" />,
};

const statusColors = {
  Upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
  Done: 'bg-green-100 text-green-800 border-green-200',
  Delayed: 'bg-red-100 text-red-800 border-red-200',
};

export default function ScheduleClient() {
  const { tasks, addTask, addGeneratedTasks, isLoading } = useTasks();
  const [activity, setActivity] = useState<Task['activity'] | ''>('');
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<string[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    if (isLoading) return;

    const tasksToNotify = tasks.filter(task => {
      if (task.status !== 'Upcoming' || notifiedTaskIds.includes(task.id)) {
        return false;
      }
      const taskDate = parseISO(task.date);
      return isToday(taskDate) || isTomorrow(taskDate);
    });

    if (tasksToNotify.length > 0) {
      tasksToNotify.forEach(task => {
        const taskDate = parseISO(task.date);
        const when = isToday(taskDate) ? t('today') : t('tomorrow');
        toast({
          title: `${t('task_reminder')}: ${t(task.activity.toLowerCase().replace(' ', '_'))}`,
          description: t('task_due_description', { crop: task.crop, when }),
        });
      });
      setNotifiedTaskIds(prev => [...prev, ...tasksToNotify.map(t => t.id)]);
    }
  }, [tasks, notifiedTaskIds, toast, isLoading, t]);


  const handleAddTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newTask = {
      activity: activity as Task['activity'],
      crop: formData.get('crop') as string,
      date: formData.get('date') as string,
    };
    addTask(newTask);
    event.currentTarget.reset();
    setActivity('');
  };

  const handleGenerateSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsGenerating(true);

      const formData = new FormData(event.currentTarget);
      const input = {
        cropName: formData.get('ai-crop') as string,
        plantingDate: formData.get('ai-date') as string,
        fieldName: formData.get('ai-field') as string,
      };

      try {
        const newTasks = await generateAISchedule(await getIdTokenOrThrow(), input);
        
        const mappedTasks = newTasks.map(task => ({
            ...task,
            crop: `${input.cropName} (${input.fieldName})`,
        }));

        addGeneratedTasks(mappedTasks);
        
        toast({
            title: t('schedule_generated'),
            description: t('schedule_generated_desc', { count: newTasks.length })
        });
        setIsAIDialogOpen(false);

      } catch (error) {
         console.error('Error generating AI schedule:', error);
         toast({
            variant: "destructive",
            title: t('generation_failed'),
            description:
              error instanceof Error && error.message.startsWith('Please sign in')
                ? error.message
                : t('generation_failed_desc'),
         });
      } finally {
        setIsGenerating(false);
      }
  }
  
  const statusTranslations: Record<Task['status'], string> = {
    Upcoming: t('upcoming'),
    Done: t('done'),
    Delayed: t('delayed'),
  };

  const activityTranslations: Record<Task['activity'], string> = {
    Planting: t('planting'),
    Fertilizing: t('fertilizing'),
    Harvesting: t('harvesting'),
    Weeding: t('weeding'),
    'Pest Control': t('pest_control'),
    Irrigation: t('irrigation'),
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('upcoming_tasks')}</CardTitle>
            <CardDescription>
              {t('your_schedule_of_activities')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('activity')}</TableHead>
                  <TableHead>{t('crop')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        </TableRow>
                    ))
                ) : tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {activityIcons[task.activity]}
                      {activityTranslations[task.activity]}
                    </TableCell>
                    <TableCell>{task.crop}</TableCell>
                    <TableCell>{new Date(task.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[task.status]}>
                        {statusTranslations[task.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>{t('add_new_task')}</CardTitle>
            <CardDescription>
              {t('add_new_activity_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <Wand2 className="mr-2 h-4 w-4" /> {t('generate_with_ai')}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('generate_schedule_with_ai')}</DialogTitle>
                        <DialogDescription>
                            {t('generate_schedule_with_ai_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGenerateSchedule}>
                        <div className="grid gap-4 py-4">
                            <div>
                                <Label htmlFor="ai-crop">{t('crop_name')}</Label>
                                <Input id="ai-crop" name="ai-crop" placeholder={t('eg_basmati_rice')} required />
                            </div>
                            <div>
                                <Label htmlFor="ai-field">{t('field_plot_name')}</Label>
                                <Input id="ai-field" name="ai-field" placeholder={t('eg_north_field')} required />
                            </div>
                            <div>
                                <Label htmlFor="ai-date">{t('planting_date')}</Label>
                                <Input id="ai-date" name="ai-date" type="date" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isGenerating}>{t('cancel')}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isGenerating}>
                               {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               {t('generate_schedule')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
             </Dialog>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('or_add_manually')}
                </span>
              </div>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <Label htmlFor="activity">{t('activity')}</Label>
                <Select required onValueChange={(value) => setActivity(value as Task['activity'])} value={activity}>
                  <SelectTrigger id="activity">
                    <SelectValue placeholder={t('select_an_activity')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planting">{t('planting')}</SelectItem>
                    <SelectItem value="Fertilizing">{t('fertilizing')}</SelectItem>
                    <SelectItem value="Irrigation">{t('irrigation')}</SelectItem>
                    <SelectItem value="Weeding">{t('weeding')}</SelectItem>
                    <SelectItem value="Pest Control">{t('pest_control')}</SelectItem>
                    <SelectItem value="Harvesting">{t('harvesting')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="crop">{t('crop_field')}</Label>
                <Input id="crop" name="crop" placeholder={t('eg_corn_field_b')} required />
              </div>
              <div>
                <Label htmlFor="date">{t('date')}</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <Button type="submit" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> {t('add_task')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
