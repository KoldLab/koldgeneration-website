import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 sm:px-6">
      <div className="text-center max-w-md">
        <h1 className="text-5xl sm:text-6xl font-bold mb-2">404</h1>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Button asChild className="min-h-[44px]">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}

