interface LoadStateProps {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export default function LoadState({ loading, error, onRetry }: LoadStateProps) {
  if (loading) {
    return (
      <p className="muted" role="status">
        Loading...
      </p>
    );
  }

  if (error) {
    return (
      <div className="notice error" role="alert">
        <p>We could not load this page. Check your connection and try again.</p>
        <button type="button" className="btn secondary small" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  return null;
}
