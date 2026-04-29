import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BrowseMovies from '@/components/pages/marathons/sections/BrowseMovies';
import MyMovieList from '@/components/pages/marathons/sections/MyMovieList';

type Section = 'browse' | 'my-list';

function NavItem({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        active
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

export default function Movies() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('browse');

  const navItems: { id: Section; icon: React.ReactNode; label: string; authRequired?: boolean }[] = [
    { id: 'browse', icon: <Search className="h-4 w-4" />, label: 'Browse Movies' },
    { id: 'my-list', icon: <Eye className="h-4 w-4" />, label: 'My List', authRequired: true },
  ];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Movies</h1>
      </div>

      <div className="flex gap-6">
        {/* Side nav — desktop */}
        <aside className="hidden sm:flex flex-col w-48 shrink-0 space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Movies
          </p>
          {navItems.map((item) => {
            if (item.authRequired && !user) return null;
            return (
              <NavItem
                key={item.id}
                active={section === item.id}
                onClick={() => setSection(item.id)}
                icon={item.icon}
                label={item.label}
              />
            );
          })}
        </aside>

        {/* Mobile nav */}
        <div className="sm:hidden w-full mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              if (item.authRequired && !user) return null;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                    section === item.id
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {section === 'browse' && <BrowseMovies />}
          {section === 'my-list' && <MyMovieList />}
        </main>
      </div>
    </div>
  );
}
