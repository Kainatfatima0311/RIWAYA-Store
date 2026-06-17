// Cursor-following "spotlight" helper for hover light effects on cards.
//
// Attach as onMouseMove. It writes --spot-x / --spot-y (percent) on the hovered
// element, which the `.spotlight` overlay reads by inheritance. Updates are
// rAF-throttled to at most one per frame and the layout read + style writes are
// batched together, so it stays smooth (no layout thrashing) even across a full
// product grid. Pure DOM writes — never triggers a React re-render.
let frame = 0;
let el = null;
let cx = 0;
let cy = 0;

function flush() {
  frame = 0;
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.width && r.height) {
    el.style.setProperty('--spot-x', `${((cx - r.left) / r.width) * 100}%`);
    el.style.setProperty('--spot-y', `${((cy - r.top) / r.height) * 100}%`);
  }
  el = null;
}

export function spotlightMove(e) {
  el = e.currentTarget;
  cx = e.clientX;
  cy = e.clientY;
  if (!frame) frame = requestAnimationFrame(flush);
}
