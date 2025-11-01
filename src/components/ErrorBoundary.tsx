import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Button } from './ui/button';

export default function ErrorBoundary() {
  const error = useRouteError();

  let status = 404;
  let statusText = 'Not Found';
  let message = "The page you're looking for doesn't exist.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    statusText = error.statusText;
    message = error.data?.message || error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 sm:px-6">
      <div className="text-center max-w-md">
        <h1 className="text-5xl sm:text-6xl font-bold mb-2">{status}</h1>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">{statusText}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">{message}</p>
        <Button asChild className="min-h-[44px]">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
