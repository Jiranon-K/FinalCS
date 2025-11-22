import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Returns `true` only after the component has hydrated on the client.
 * Using `useSyncExternalStore` avoids the "cascading renders" warning that
 * occurs when calling `setState` directly inside a `useEffect`.
 *
 * @see https://react.dev/reference/react/useSyncExternalStore
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,   // client snapshot  → mounted
    () => false,  // server snapshot  → not yet mounted
  );
}
