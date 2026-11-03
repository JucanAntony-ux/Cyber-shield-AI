import { useCallback, useEffect, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: boolean;
  loading: boolean;
}

export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: false, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: false }));
    load()
      .then((data) => {
        if (active) setState({ data, error: false, loading: false });
      })
      .catch((err: unknown) => {
        console.error(err);
        if (active) setState({ data: null, error: true, loading: false });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
