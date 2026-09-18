import { useCallback, useMemo, useRef, useState } from 'react';
import { ToastContext } from './toast-context.js';
import { Icon } from '../../components/ui/Icon.jsx';
import './toast.css';

const DURATION = 3200;

/**
 * Replaces the original `alert()` calls — those block the main thread and look
 * like a bug report. Toasts are announced politely to screen readers instead.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = 'info', icon = 'check' } = {}) => {
      const id = crypto.randomUUID?.() ?? String(Date.now() + Math.random());
      setToasts((list) => [...list.slice(-2), { id, message, tone, icon }]);
      timers.current.set(id, setTimeout(() => dismiss(id), DURATION));
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      toast: push,
      success: (m) => push(m, { tone: 'success', icon: 'check' }),
      error: (m) => push(m, { tone: 'error', icon: 'close' }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <span className="toast__icon">
              <Icon name={t.icon} size={15} strokeWidth={2.4} />
            </span>
            <span className="toast__message">{t.message}</span>
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <Icon name="close" size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
