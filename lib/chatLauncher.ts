// Lightweight pub/sub so a hero CTA (or anything else) can open the chat —
// optionally straight into its expanded view — without prop-drilling through
// the tree. ChatButton subscribes; callers just import openChat().
type OpenOptions = { expanded?: boolean };
type Listener = (options: OpenOptions) => void;

const listeners = new Set<Listener>();

export function openChat(options: OpenOptions = {}) {
  listeners.forEach((listener) => listener(options));
}

export function subscribeOpenChat(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
