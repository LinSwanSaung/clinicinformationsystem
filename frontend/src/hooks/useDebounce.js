import { useEffect, useState } from 'react';

// Simple debounce hook: returns the debounced value after delay ms
export default function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
