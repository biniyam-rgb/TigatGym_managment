import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value.
 * @param {any} value - Value to debounce (e.g. search string)
 * @param {number} delay - Delay in milliseconds (default 250ms)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
