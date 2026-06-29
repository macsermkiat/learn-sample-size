import { useEffect, useState } from "react";

// Debounce a rapidly-changing value. Used so the screen-reader live region
// announces a SETTLED result (~300ms after a slider stops) rather than a flood
// of intermediate values while dragging.
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
