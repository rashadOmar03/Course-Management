import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login, isAuthenticated, getCurrentUser, homePathForRole } from '../services/authService.js';
import Alert from '../components/Alert.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      navigate(homePathForRole(user?.role), { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form.username, form.password);
      const fallback = homePathForRole(data.role);
      const requested = location.state?.from?.pathname;
      navigate(requested || fallback, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h2>Welcome back</h2>
        <p className="muted">Sign in to continue.</p>

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              required
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
          Default admin: <code>omar / 1234</code>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="btn-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
