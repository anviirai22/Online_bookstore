export function Field({ label, name, error, children, hint, ...props }) {
  return <label className="form-field" htmlFor={name}><span>{label}</span>{children || <input id={name} name={name} {...props} />}{hint && <small>{hint}</small>}{error && <em>{error}</em>}</label>;
}

export function SubmitButton({ children, busy, ...props }) {
  return <button className="primary-button" type="submit" disabled={busy || props.disabled} {...props}>{busy ? 'Working...' : children}</button>;
}
