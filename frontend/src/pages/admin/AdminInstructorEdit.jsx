import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getInstructor,
  updateInstructor,
  deleteInstructor,
  setInstructorCredentials,
} from '../../services/instructorService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminInstructorEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', bio: '' });
  const [currentUsername, setCurrentUsername] = useState(null);
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [credsError, setCredsError] = useState('');
  const [credsSuccess, setCredsSuccess] = useState('');

  const loadInstructor = async () => {
    const i = await getInstructor(id);
    setForm({ name: i.name, email: i.email, bio: i.bio || '' });
    setCurrentUsername(i.username || null);
    setCreds({ username: i.username || '', password: '' });
  };

  useEffect(() => {
    let active = true;
    loadInstructor()
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.status === 404
            ? 'Instructor not found.'
            : err.response?.data?.message || 'Failed to load.'
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCredsChange = (e) => {
    const { name, value } = e.target;
    setCreds((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSubmitting(true);
    try {
      await updateInstructor(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        bio: form.bio.trim(),
      });
      setSuccess('Instructor updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setCredsError('');
    setCredsSuccess('');

    const username = creds.username.trim();
    if (username.length === 0) return setCredsError('Username is required.');
    if (creds.password.length < 4)
      return setCredsError('Password must be at least 4 characters.');

    setSavingCreds(true);
    try {
      await setInstructorCredentials(id, {
        username,
        password: creds.password,
      });
      setCredsSuccess(
        currentUsername
          ? 'Login credentials updated.'
          : 'Login created. The instructor can now sign in.'
      );
      setCurrentUsername(username);
      setCreds({ username, password: '' });
    } catch (err) {
      setCredsError(
        err.response?.data?.message || 'Failed to save credentials.'
      );
    } finally {
      setSavingCreds(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this instructor?')) return;
    try {
      await deleteInstructor(id);
      navigate('/admin/instructors');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  if (loading) return <Loader text="Loading..." />;

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>Edit Instructor</h1>
        <Link to="/admin/instructors" className="btn btn-secondary">
          Back
        </Link>
      </div>

      <div className="card">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
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
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              className="form-control"
              value={form.bio}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Login credentials</h3>
        {currentUsername ? (
          <Alert type="info">
            This instructor can sign in as <strong>{currentUsername}</strong>.
            Use the form below to change their username or reset their password.
          </Alert>
        ) : (
          <Alert type="info">
            This instructor has no login account yet and cannot sign in. Set a
            username and password below to create one.
          </Alert>
        )}

        <Alert type="error">{credsError}</Alert>
        <Alert type="success">{credsSuccess}</Alert>

        <form onSubmit={handleSaveCredentials}>
          <div className="form-group">
            <label htmlFor="creds-username">Username *</label>
            <input
              id="creds-username"
              name="username"
              type="text"
              className="form-control"
              value={creds.username}
              onChange={handleCredsChange}
              required
              maxLength={50}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="creds-password">
              {currentUsername ? 'New password *' : 'Password *'}
            </label>
            <input
              id="creds-password"
              name="password"
              type="password"
              className="form-control"
              value={creds.password}
              onChange={handleCredsChange}
              required
              minLength={4}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingCreds}>
            {savingCreds
              ? 'Saving...'
              : currentUsername
                ? 'Update credentials'
                : 'Create login'}
          </button>
        </form>
      </div>
    </div>
  );
}
