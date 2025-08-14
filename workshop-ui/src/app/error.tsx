'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{process.env.NODE_ENV === 'development' ? error.message : 'Please try again.'}</p>
      <button onClick={() => reset()}>Retry</button>
    </div>
  );
}
