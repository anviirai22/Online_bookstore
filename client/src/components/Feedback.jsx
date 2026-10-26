export function LoadingState({ label = 'Loading' }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}...</div>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="feedback error-feedback" role="alert">{message}</div>;
}

export function Notice({ message }) {
  if (!message) return null;
  return <div className="feedback notice-feedback" role="status">{message}</div>;
}

export function EmptyState({ title, children, action }) {
  return <div className="empty-state"><span className="empty-mark">✦</span><h2>{title}</h2><p>{children}</p>{action}</div>;
}

export function PageIntro({ eyebrow, title, children }) {
  return <div className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="intro-copy">{children}</p>}</div>;
}
