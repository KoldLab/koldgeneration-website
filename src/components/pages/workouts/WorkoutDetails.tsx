import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Item } from '@/components/ui/item';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { CalendarIcon, Expand, Shrink } from 'lucide-react';
import { parseDate } from 'chrono-node';

interface WorkoutDetailsProps {
  workoutDate: Date | undefined;
  workoutDateValue: string;
  workoutDateMonth: Date | undefined;
  workoutDateOpen: boolean;
  workoutDuration: string;
  workoutNotes: string;
  workoutDetailsOpen: boolean;
  onWorkoutDateChange: (date: Date | undefined) => void;
  onWorkoutDateValueChange: (value: string) => void;
  onWorkoutDateMonthChange: (date: Date | undefined) => void;
  onWorkoutDateOpenChange: (open: boolean) => void;
  onWorkoutDurationChange: (value: string) => void;
  onWorkoutNotesChange: (value: string) => void;
  onWorkoutDetailsOpenChange: (open: boolean) => void;
}

interface WorkoutDetailsFormValues {
  workoutDateValue: string;
  workoutDuration: string;
  workoutNotes: string;
}

export default function WorkoutDetails({
  workoutDate,
  workoutDateValue,
  workoutDateMonth,
  workoutDateOpen,
  workoutDuration,
  workoutNotes,
  workoutDetailsOpen,
  onWorkoutDateChange,
  onWorkoutDateValueChange,
  onWorkoutDateMonthChange,
  onWorkoutDateOpenChange,
  onWorkoutDurationChange,
  onWorkoutNotesChange,
  onWorkoutDetailsOpenChange,
}: WorkoutDetailsProps) {
  const { t } = useTranslation();

  const form = useForm<WorkoutDetailsFormValues>({
    defaultValues: {
      workoutDateValue,
      workoutDuration,
      workoutNotes,
    },
  });

  // Sync form with props
  useEffect(() => {
    form.reset({
      workoutDateValue,
      workoutDuration,
      workoutNotes,
    });
  }, [workoutDateValue, workoutDuration, workoutNotes, form]);

  const handleDateSelect = (date: Date | null | undefined) => {
    const selectedDate = date || undefined;
    onWorkoutDateChange(selectedDate);
    if (selectedDate) {
      const dateString = selectedDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      form.setValue('workoutDateValue', dateString);
      onWorkoutDateValueChange(dateString);
    }
    onWorkoutDateOpenChange(false);
  };

  return (
    <Item variant="outline" className="w-full relative ">
      {/* Toggle button to show/hide the details */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onWorkoutDetailsOpenChange(!workoutDetailsOpen)}
        className="absolute top-1 right-1"
        aria-label={t(
          'workouts.logWorkout.showLessDetails',
          'Show less details'
        )}
      >
        {workoutDetailsOpen ? (
          <Shrink className="h-4 w-4" />
        ) : (
          <Expand className="h-4 w-4" />
        )}
        <span className="sr-only">
          {workoutDetailsOpen
            ? t('workouts.logWorkout.showLessDetails', 'Show less details')
            : t('workouts.logWorkout.showMoreDetails', 'Show more details')}
        </span>
      </Button>
      {/* Details */}
      <Form {...form}>
        <div className="space-y-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="workoutDateValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workouts.logWorkout.date')}</FormLabel>
                  <FormControl>
                    <div className="relative flex gap-2">
                      <Input
                        {...field}
                        placeholder="Today, Tomorrow, or next week"
                        className="bg-background pr-10"
                        onChange={(e) => {
                          field.onChange(e);
                          const value = e.target.value;
                          onWorkoutDateValueChange(value);
                          const parsedDate = parseDate(value);
                          if (parsedDate) {
                            onWorkoutDateChange(parsedDate);
                            onWorkoutDateMonthChange(parsedDate);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            onWorkoutDateOpenChange(true);
                          }
                        }}
                      />
                      <Popover
                        open={workoutDateOpen}
                        onOpenChange={onWorkoutDateOpenChange}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            id="date-picker"
                            variant="ghost"
                            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                          >
                            <CalendarIcon className="size-3.5" />
                            <span className="sr-only">Select date</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="end"
                        >
                          <Calendar
                            mode="single"
                            selected={workoutDate ?? undefined}
                            captionLayout="dropdown"
                            month={workoutDateMonth ?? undefined}
                            onMonthChange={(date) =>
                              onWorkoutDateMonthChange(date ?? undefined)
                            }
                            onSelect={handleDateSelect}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {workoutDetailsOpen && (
              <FormField
                control={form.control}
                name="workoutDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('workouts.logWorkout.duration')} (minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        placeholder="Optional"
                        onChange={(e) => {
                          field.onChange(e);
                          onWorkoutDurationChange(e.target.value);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>

          {workoutDetailsOpen && (
            <FormField
              control={form.control}
              name="workoutNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('workouts.logWorkout.overallNotes')}{' '}
                    {t('common.optional')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('workouts.logWorkout.notesPlaceholder')}
                      rows={3}
                      onChange={(e) => {
                        field.onChange(e);
                        onWorkoutNotesChange(e.target.value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
      </Form>
    </Item>
  );
}
