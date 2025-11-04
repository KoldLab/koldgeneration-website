import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { createTournament } from '@/services/tournamentService';
import type { TournamentType } from '@/types/tournament';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function CreateTournament() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'single-elimination' as TournamentType,
    maxPlayers: 8,
    winScore: 3,
    loseScore: 0,
  });

  const tournamentTypes: { value: TournamentType; label: string; descriptionKey: string }[] = [
    { value: 'single-elimination', label: t('tournament.types.singleElimination'), descriptionKey: 'tournament.types.singleEliminationDescription' },
    { value: 'double-elimination', label: t('tournament.types.doubleElimination'), descriptionKey: 'tournament.types.doubleEliminationDescription' },
    { value: 'round-robin', label: t('tournament.types.roundRobin'), descriptionKey: 'tournament.types.roundRobinDescription' },
    { value: 'swiss', label: t('tournament.types.swiss'), descriptionKey: 'tournament.types.swissDescription' },
  ];

  const selectedTypeDescription = tournamentTypes.find((type) => type.value === formData.type)?.descriptionKey || '';

  if (!user) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">{t('tournament.create.loginRequired')}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to create a tournament');
      }

      const tournament = await createTournament(formData, user);
      navigate(`/tournament/${tournament.code}`);
    } catch (err: any) {
      if (err.message === 'BLOCKED_BY_EXTENSION') {
        setError(t('tournament.create.blockedByExtension'));
      } else {
        setError(err.message || t('tournament.create.error'));
      }
    } finally {
      setLoading(false);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('tournament.create.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('tournament.create.namePlaceholder')}
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('tournament.create.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('tournament.create.descriptionPlaceholder')}
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('tournament.create.type')}</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as TournamentType })}
            >
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
            {selectedTypeDescription && (
              <p className="text-xs text-muted-foreground">
                {t(selectedTypeDescription)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPlayers">{t('tournament.create.maxPlayers')}</Label>
            <Input
              id="maxPlayers"
              type="number"
              min="2"
              max="128"
              value={formData.maxPlayers}
              onChange={(e) =>
                setFormData({ ...formData, maxPlayers: parseInt(e.target.value) || 8 })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('tournament.create.maxPlayersHint')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="winScore">{t('tournament.create.winScore')}</Label>
              <Input
                id="winScore"
                type="number"
                min="0"
                value={formData.winScore}
                onChange={(e) =>
                  setFormData({ ...formData, winScore: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                {t('tournament.create.winScoreHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loseScore">{t('tournament.create.loseScore')}</Label>
              <Input
                id="loseScore"
                type="number"
                min="0"
                value={formData.loseScore}
                onChange={(e) =>
                  setFormData({ ...formData, loseScore: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                {t('tournament.create.loseScoreHint')}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('tournament.create.creating')}
              </>
            ) : (
              t('tournament.create.createButton')
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
