import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { createTournament } from '@/services/tournamentService';
import type { TournamentType, CreateTournamentData } from '@/types/tournament';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

const tournamentTypeValues = ['single-elimination', 'double-elimination', 'round-robin', 'swiss'] as const;

const formSchema = z.object({
  name: z.string().min(3).max(100),
  description: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),
  type: z.enum(tournamentTypeValues),
  maxPlayers: z.coerce.number().int().min(2).max(128),
  requireScores: z.boolean(),
});

type CreateTournamentFormValues = z.infer<typeof formSchema>;

export default function CreateTournament() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  const form = useForm<CreateTournamentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'single-elimination',
      maxPlayers: 8,
      requireScores: true,
    },
  });

  const tournamentTypes: { value: TournamentType; label: string; descriptionKey: string }[] = [
    { value: 'single-elimination', label: t('tournament.types.singleElimination'), descriptionKey: 'tournament.types.singleEliminationDescription' },
    { value: 'double-elimination', label: t('tournament.types.doubleElimination'), descriptionKey: 'tournament.types.doubleEliminationDescription' },
    { value: 'round-robin', label: t('tournament.types.roundRobin'), descriptionKey: 'tournament.types.roundRobinDescription' },
    { value: 'swiss', label: t('tournament.types.swiss'), descriptionKey: 'tournament.types.swissDescription' },
  ];

  const selectedTypeDescription =
    tournamentTypes.find((type) => type.value === form.watch('type'))?.descriptionKey || '';

  if (!user) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">{t('tournament.create.loginRequired')}</p>
      </div>
    );
  }

  const onSubmit = async (values: CreateTournamentFormValues) => {
    setError('');

    try {
      if (!user) {
        throw new Error('You must be logged in to create a tournament');
      }

      const payload: CreateTournamentData = {
        name: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : undefined,
        type: values.type,
        maxPlayers: values.maxPlayers,
        requireScores: values.requireScores,
      };

      const tournament = await createTournament(payload, user);
      navigate(`/tournament/${tournament.code}`);
    } catch (err: any) {
      if (err.message === 'BLOCKED_BY_EXTENSION') {
        setError(t('tournament.create.blockedByExtension'));
      } else {
        setError(err.message || t('tournament.create.error'));
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {t('tournament.create.title')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('tournament.create.description')}
        </p>
      </div>

      <Card className="p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tournament.create.name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('tournament.create.namePlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tournament.create.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder={t('tournament.create.descriptionPlaceholder')}
                      rows={4}
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tournament.create.type')}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tournamentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {selectedTypeDescription && (
                    <FormDescription>{t(selectedTypeDescription)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxPlayers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tournament.create.maxPlayers')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2}
                      max={128}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormDescription>{t('tournament.create.maxPlayersHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requireScores"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <FormLabel>{t('tournament.create.requireScores.title')}</FormLabel>
                    <FormDescription>
                      {t('tournament.create.requireScores.description')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('tournament.create.creating')}
                </>
              ) : (
                t('tournament.create.createButton')
              )}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
