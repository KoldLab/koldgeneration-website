import packageJson from '../../package.json';

// These are injected at build time by Vite
declare const __GIT_COMMIT_HASH__: string;

export function Footer() {
  const commitHash =
    typeof __GIT_COMMIT_HASH__ !== 'undefined' ? __GIT_COMMIT_HASH__ : 'dev';

  return (
    <footer className="w-full mt-auto py-2 border-t border-border">
      <div className="w-full sm:min-w-[80vw] sm:w-[80vw] mx-auto px-4 sm:px-6 md:px-8">
        <p className="text-center text-xs text-muted-foreground">
          v{packageJson.version} • {commitHash}
        </p>
      </div>
    </footer>
  );
}
