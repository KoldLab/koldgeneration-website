import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}

