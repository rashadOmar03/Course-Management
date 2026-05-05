import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '../services/authService.js';
import Alert from '../components/Alert.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/students';

  const [form, setForm] = useState({ username: 'omar', password: '1234' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      localStorage.setItem('token', data.token);
      localStorage.setItem(
        'user',
        JSON.stringify({ username: data.username, role: data.role })
      );
      window.dispatchEvent(new Event('auth-change'));
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="card">
        <h2>Login</h2>
        <p className="muted">Use the seeded admin account to log in.</p>

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
          Default credentials: <code>omar / 1234</code>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <Link to="/" className="btn-link">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
