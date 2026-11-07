export function setMediaOverlay(id, active) {
  window.dispatchEvent(new CustomEvent('tianetflix:media-overlay', { detail: { id, active } }));
}
