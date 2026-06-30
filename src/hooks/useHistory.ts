import { useState, useCallback } from 'react';

export function useHistory<T>(initialPresent: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture([present, ...future]);
    setPresent(previous);
  }, [canUndo, past, present, future]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast([...past, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [canRedo, future, past, present]);

  const set = useCallback(
    (newPresent: T | ((prev: T) => T), overwrite = false) => {
      setPresent((prevPresent) => {
        const resolved = typeof newPresent === 'function' 
          ? (newPresent as (prev: T) => T)(prevPresent) 
          : newPresent;
        
        if (JSON.stringify(resolved) === JSON.stringify(prevPresent)) {
          return prevPresent;
        }
        
        if (overwrite) {
          return resolved;
        }
        
        setPast((prevPast) => [...prevPast, prevPresent]);
        setFuture([]);
        return resolved;
      });
    },
    []
  );

  const reset = useCallback((newInitialPresent: T) => {
    setPast([]);
    setPresent(newInitialPresent);
    setFuture([]);
  }, []);

  return { state: present, set, undo, redo, canUndo, canRedo, reset };
}
export default useHistory;
