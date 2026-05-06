import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdmins,
  createAdmin,
  deleteAdmin,
} from '../../services/adminService.js';
import { getCurrentUser } from '../../services/authService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminAdmins() {
  const me = getCurrentUser();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setAdmins(await getAdmins());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admins.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (form.password.length < 4)
      return setError('Password must be at least 4 characters.');

    setSubmitting(true);
    try {
      await createAdmin({
        username: form.username.trim(),
        password: form.password,
      });
      setInfo('Admin created.');
      setForm({ username: '', password: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this admin account?')) return;
    try {
      await deleteAdmin(id);
      setInfo('Admin deleted.');
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete admin.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Admins</h1>
        <Link to="/admin" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      <div className="card">
        <h3>Create new admin</h3>
        <form onSubmit={handleCreate}>
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
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Existing admins</h2>
      {loading ? (
        <Loader text="Loading..." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Username</th>
              <th style={{ width: 200 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>
                  {a.username}
                  {a.id === me?.userId && (
                    <span className="badge badge-info" style={{ marginLeft: 8 }}>
                      you
                    </span>
                  )}
                </td>
                <td>
                  {a.id !== me?.userId ? (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
