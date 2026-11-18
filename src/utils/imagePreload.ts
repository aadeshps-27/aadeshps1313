const warmedUrls = new Set<string>();

export function warmImage(src: string): void {
  if (typeof window === 'undefined' || !src || warmedUrls.has(src)) return;
  warmedUrls.add(src);

  const img = new window.Image();
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.src = src;

  if (typeof img.decode === 'function') {
    img.decode().catch(() => {
      // Ignore decode interruptions; browser cache still retains fetched asset
    });
  }
}

export function warmImagesOnIdle(urls: string[]): () => void {
  if (typeof window === 'undefined' || urls.length === 0) {
    return () => {};
  }

  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    for (const url of urls) {
      warmImage(url);
    }
  };

  type IdleWin = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const win = window as IdleWin;

  if (typeof win.requestIdleCallback === 'function') {
    const id = win.requestIdleCallback(run, { timeout: 600 });
    return () => {
      cancelled = true;
      win.cancelIdleCallback?.(id);
    };
  }

  const timer = window.setTimeout(run, 180);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}
