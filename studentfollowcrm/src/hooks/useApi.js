// src/hooks/useApi.js
import { useState, useEffect, useCallback } from "react";

/**
 * useApi(apiFn, deps)
 *
 * Generic data-fetching hook.
 *
 * @param {Function} apiFn   - () => apiCall(...)  — called on mount and on refetch()
 * @param {Array}    deps    - re-fetch when these change (like useEffect deps)
 *
 * Returns { data, loading, error, refetch }
 *
 * Usage:
 *   const { data, loading, error } = useApi(() => studentsApi.list({ page }), [page]);
 */
export function useApi(apiFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn();
      setData(res.data.data);  // unwrap our { status, message, data } envelope
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}

/**
 * useMutation(apiFn)
 *
 * For POST / PATCH / DELETE calls triggered by user action.
 *
 * Returns { mutate, loading, error, success }
 *
 * Usage:
 *   const { mutate, loading } = useMutation((data) => studentsApi.create(data));
 *   await mutate(formData);
 */
export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await apiFn(payload);
      setSuccess(true);
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { mutate, loading, error, success };
}
