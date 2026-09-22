import { useEffect, useMemo, useState } from 'react';

export const SIGN_PSBT_LIST_INITIAL_COUNT = 10;
export const SIGN_PSBT_LIST_BATCH_SIZE = 50;

export function getIncrementalListResetKey(value: string) {
  let h1 = 2166136261;
  let h2 = 0x811c9dc5 ^ value.length;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);

    h1 ^= code;
    h1 = Math.imul(h1, 16777619);

    h2 ^= code + i;
    h2 = Math.imul(h2, 2246822507);
  }

  return `${(h1 >>> 0).toString(16)}-${(h2 >>> 0).toString(16)}-${value.length}`;
}

export function useIncrementalList<T>(
  items: T[],
  resetKey: string,
  initialCount = SIGN_PSBT_LIST_INITIAL_COUNT,
  batchSize = SIGN_PSBT_LIST_BATCH_SIZE
) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [initialCount, resetKey]);

  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  const hasMore = visibleCount < items.length;
  const loadMore = () => {
    setVisibleCount((count) => Math.min(count + batchSize, items.length));
  };

  return {
    visibleItems,
    visibleCount: Math.min(visibleCount, items.length),
    nextLoadCount: Math.min(batchSize, Math.max(items.length - visibleCount, 0)),
    hasMore,
    loadMore
  };
}
