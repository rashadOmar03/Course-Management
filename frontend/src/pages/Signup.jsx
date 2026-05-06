import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupStudent, signupInstructor, homePathForRole } from '../services/authService.js';
import Alert from '../components/Alert.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Student');
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    bio: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      };
      let data;
      if (role === 'Student') {
        data = await signupStudent(payload);
      } else {
        data = await signupInstructor({ ...payload, bio: form.bio.trim() });
      }
      navigate(homePathForRole(data.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === 'string' ? err.response.data : null) ||
          'Signup failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h2>Create an account</h2>
        <p className="muted">Sign up as a student or an instructor.</p>

        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'Student' ? 'active' : ''}`}
            onClick={() => setRole('Student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'Instructor' ? 'active' : ''}`}
            onClick={() => setRole('Instructor')}
          >
            Instructor
          </button>
        </div>

        {role === 'Instructor' && (
          <Alert type="info">
            Instructor accounts must be approved by an admin before you can be
            assigned to courses. You can still log in while waiting.
          </Alert>
        )}

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              required
              maxLength={50}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              required
              minLength={4}
              autoComplete="new-password"
            />
          </div>
          {role === 'Instructor' && (
            <div className="form-group">
              <label htmlFor="bio">Short bio (optional)</label>
              <textarea
                id="bio"
                name="bio"
                className="form-control"
                value={form.bio}
                onChange={handleChange}
                rows={3}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Creating account...' : `Sign up as ${role}`}
          </button>
        </form>

        <p style={{ marginTop: '1rem' }}>
          Already have an account?{' '}
          <Link to="/login" className="btn-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
