/**
 * Liquid glass for the floating navigation bar (src/components/BottomNav.astro), after
 * iOS 26's material:
 *
 * - Lens: for each glass shape (the bar and the search button) a displacement map is drawn
 *   for its exact size. Inside a bezel along the rounded edge the surface curves like a convex
 *   lens, so the backdrop there is sampled from further in (compressed and bent); the middle
 *   is flat glass with no shift. The map is regenerated whenever the shape resizes. Only
 *   Chromium applies SVG filters to backdrops; the CSS enables the filter there alone, and
 *   only once a map exists (`.has-lens`).
 * - Light: the rim's highlight follows the phone's tilt where the browser reports it without
 *   asking (Android); elsewhere it stays lit from above.
 * - Motion: the bar shrinks to its icons (still tappable) while the reader scrolls down, and
 *   returns on scroll up.
 *
 * Everything respects prefers-reduced-motion (no tilt, no shrinking).
 */

/** Width of the curved rim, in CSS px, and the largest shift it produces at the very edge. */
const BEZEL = 20;
const MAX_SHIFT = 14;

/** Signed distance from a point to a rounded rectangle centred on the origin (negative inside). */
function roundedRectDistance(x: number, y: number, halfW: number, halfH: number, radius: number): number {
  const qx = Math.abs(x) - halfW + radius;
  const qy = Math.abs(y) - halfH + radius;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - radius;
}

/**
 * The displacement map for a w×h shape with corner radius r, as a PNG data URL.
 * Red is the horizontal shift and green the vertical one, 128 meaning none; the filter's
 * scale is 2 × MAX_SHIFT, so a channel at 0 or 255 shifts by MAX_SHIFT px.
 */
export function lensMap(w: number, h: number, r: number, bezel = BEZEL): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(w, h);
  const halfW = w / 2;
  const halfH = h / 2;
  const radius = Math.min(r, halfW, halfH);
  const depth = Math.min(bezel, halfH);

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const x = px + 0.5 - halfW;
      const y = py + 0.5 - halfH;
      const d = roundedRectDistance(x, y, halfW, halfH, radius);
      let dx = 0;
      let dy = 0;
      const inward = -d; // distance in from the edge
      if (inward >= 0 && inward < depth) {
        // Outward normal: the gradient of the distance field.
        const nx = roundedRectDistance(x + 0.5, y, halfW, halfH, radius) - roundedRectDistance(x - 0.5, y, halfW, halfH, radius);
        const ny = roundedRectDistance(x, y + 0.5, halfW, halfH, radius) - roundedRectDistance(x, y - 0.5, halfW, halfH, radius);
        const length = Math.hypot(nx, ny) || 1;
        // A convex (squircle-like) bezel: the slope, and so the bend, is steepest at the rim.
        const t = 1 - inward / depth;
        const strength = t * t * t;
        // Sample from further in: shift against the outward normal.
        dx = (-nx / length) * strength;
        dy = (-ny / length) * strength;
      }
      const i = (py * w + px) * 4;
      image.data[i] = Math.round(128 + dx * 127);
      image.data[i + 1] = Math.round(128 + dy * 127);
      image.data[i + 2] = 128;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Keeps one filter's map, region and image in step with its element's size. Returns the
 * update, so a morph can run it once at its end (sizes seen mid-morph are skipped).
 */
function fitLens(element: HTMLElement, filter: SVGFilterElement, morphing: () => boolean): (() => void) | undefined {
  const image = filter.querySelector('feImage');
  if (!image) return undefined;
  let last = '';
  const update = () => {
    if (morphing()) return;
    const w = Math.round(element.offsetWidth);
    const h = Math.round(element.offsetHeight);
    const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || h / 2;
    const key = `${w}x${h}x${radius}`;
    if (w < 2 || h < 2 || key === last) return;
    last = key;
    for (const [attr, value] of [['x', 0], ['y', 0], ['width', w], ['height', h]] as const) {
      filter.setAttribute(attr, String(value));
      image.setAttribute(attr, String(value));
    }
    image.setAttribute('href', lensMap(w, h, radius));
    filter.querySelector('feDisplacementMap')?.setAttribute('scale', String(MAX_SHIFT * 2));
    element.classList.add('has-lens');
  };
  update();
  new ResizeObserver(update).observe(element);
  return update;
}

/** iOS-like ease: a quick start that settles without overshoot. */
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const MORPH_MS = 420;

export function initLiquidGlass(): void {
  const nav = document.querySelector<HTMLElement>('.bottom-nav');
  if (!nav) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const morphing = () => nav.classList.contains('is-morphing');
  const refits: (() => void)[] = [];

  // Lenses, only where the browser can use them (the CSS asks the same question).
  if (CSS.supports('backdrop-filter', 'url(#a)') && CSS.supports('interpolate-size', 'allow-keywords')) {
    for (const element of nav.querySelectorAll<HTMLElement>('[data-lens]')) {
      const filter = document.getElementById(element.dataset.lens ?? '') as SVGFilterElement | null;
      const refit = filter && fitLens(element, filter, morphing);
      if (refit) refits.push(refit);
    }
  }

  if (reduced) return;

  // Light follows tilt (Android reports it without a permission prompt; iOS does not, so it stays still).
  let frame = 0;
  addEventListener('deviceorientation', (event) => {
    if (event.gamma === null || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const tilt = Math.max(-35, Math.min(35, event.gamma ?? 0));
      nav.style.setProperty('--light-angle', `${170 + tilt}deg`);
    });
  });

  const bar = nav.querySelector<HTMLElement>('.bottom-nav__bar');
  if (!bar) return;
  const items = [...nav.querySelectorAll<HTMLElement>('.bottom-nav__item')];
  const labels = [...nav.querySelectorAll<HTMLElement>('.bottom-nav__label')];

  /**
   * Shrinks or expands the bar in one measured animation (FLIP): the end layout is applied at
   * once, then the bar's width runs from the old size to the new one while each tab slides
   * from where it was. Labels fade out before the shrink and fade in after the expand.
   * Works the same in every browser (no animating to fit-content).
   */
  let compact = false;
  let running: Promise<void> | undefined;
  let wanted = false;

  const morph = async (to: boolean) => {
    const rect = (el: HTMLElement) => el.getBoundingClientRect();
    if (to) await Promise.all(labels.map((l) => l.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-out', fill: 'forwards' }).finished));

    const fromBar = rect(bar);
    const fromX = items.map((item) => rect(item).left - fromBar.left);
    nav.classList.add('is-morphing');
    nav.classList.toggle('is-compact', to);
    const toBar = rect(bar);
    const toX = items.map((item) => rect(item).left - toBar.left);

    const animations = [
      bar.animate([{ width: `${fromBar.width}px` }, { width: `${toBar.width}px` }], { duration: MORPH_MS, easing: EASE }),
      ...items.map((item, i) =>
        item.animate([{ transform: `translateX(${fromX[i]! - toX[i]!}px)` }, { transform: 'none' }], { duration: MORPH_MS, easing: EASE }),
      ),
    ];
    for (const label of labels) label.getAnimations().forEach((a) => a.cancel());
    if (!to) for (const label of labels) label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: MORPH_MS * 0.45, easing: 'ease-out', fill: 'backwards' });

    await Promise.all(animations.map((a) => a.finished.catch(() => {})));
    nav.classList.remove('is-morphing');
    refits.forEach((refit) => refit());
    compact = to;
  };

  const setCompact = (to: boolean) => {
    wanted = to;
    if (running || to === compact) return;
    running = morph(to).finally(() => {
      running = undefined;
      if (wanted !== compact) setCompact(wanted); // the reader changed direction meanwhile
    });
  };

  // Shrink after a clear scroll down; expand after a scroll up or near the top. Small
  // reversals (a finger settling, momentum) do nothing.
  const DOWN = 48;
  const UP = 28;
  let anchor = scrollY;
  let ticking = false;
  addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = scrollY;
        if (y < 120) {
          setCompact(false);
          anchor = y;
        } else if (y - anchor > DOWN) {
          setCompact(true);
          anchor = y;
        } else if (anchor - y > UP) {
          setCompact(false);
          anchor = y;
        } else if (compact ? y > anchor : y < anchor) {
          anchor = y; // keep the anchor at the turning point
        }
      });
    },
    { passive: true },
  );
}
