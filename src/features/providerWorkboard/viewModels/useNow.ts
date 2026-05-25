// A single source of "now" for the feature. Updates every minute so
// scope filters and overdue checks stay fresh without re-render storms.

import { useEffect, useState } from "react";

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
