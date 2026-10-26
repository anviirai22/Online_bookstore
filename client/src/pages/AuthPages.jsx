import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../components/Feedback';
import { Field, SubmitButton } from '../components/Forms';
import { useAuth } from '../contexts/AuthContext';

function AuthFrame({ title, intro, children, footer }) {
  return <section className="auth-section"><div className="auth-card"><p className="eyebrow">Leaf &amp; Line account</p><h1>{title}</h1><p className="auth-intro">{intro}</p>{children}<p className="auth-footer">{footer}</p></div><div className="auth-aside"><span className="aside-quote">“A room without books is like a body without a soul.”</span><small>Cicero, in a room full of possibilities</small></div></section>;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { await login(form); navigate(location.state?.from || '/', { replace: true }); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  return <AuthFrame title="Welcome back." intro="Your shelf is waiting." footer={<>New here? <Link to="/register">Create an account</Link></>}><ErrorBanner message={error} /><form onSubmit={submit}><Field label="Email address" name="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /><Field label="Password" name="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" required /><SubmitButton busy={busy}>Sign in</SubmitButton></form></AuthFrame>;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { await register(form); navigate('/'); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  return <AuthFrame title="Make a little room." intro="Create a shelf that feels like yours." footer={<>Already have an account? <Link to="/login">Sign in</Link></>}><ErrorBanner message={error} /><form onSubmit={submit}><Field label="Your name" name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" required /><Field label="Email address" name="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /><Field label="Password" name="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" hint="At least 8 characters, including a letter and a number." required /><SubmitButton busy={busy}>Create account</SubmitButton></form></AuthFrame>;
}
