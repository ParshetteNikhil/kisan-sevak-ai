import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-3xl font-bold tracking-tight mb-2">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        The page you are looking for could not be found.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
