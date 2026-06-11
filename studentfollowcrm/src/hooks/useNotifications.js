// Polls /api/followups/notifications every 60 s.
// Returns { items, count, loading, refetch }.
import { useState, useEffect, useCallback } from "react";
import followupsApi from "../api/followups.api";

const POLL_MS = 60_000;

export function useNotifications() {
  const [items,   setItems]   = useState([]);
  const [count,   setCount]   = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await followupsApi.notifications();
      const d   = res.data.data;
      setItems(d.items  || []);
      setCount(d.count  || 0);
    } catch {
      // silent — don't break the UI if this call fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, POLL_MS);
    return () => clearInterval(id);
  }, [fetch]);

  return { items, count, loading, refetch: fetch };
}
