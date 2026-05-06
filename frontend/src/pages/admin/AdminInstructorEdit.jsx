import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getInstructor,
  updateInstructor,
  deleteInstructor,
} from '../../services/instructorService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminInstructorEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    getInstructor(id)
      .then((i) => {
        if (!active) return;
        setForm({ name: i.name, email: i.email, bio: i.bio || '' });
      })
      .catch((err) =>
        setError(
          err.response?.status === 404
            ? 'Instructor not found.'
            : err.response?.data?.message || 'Failed to load.'
        )
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    </div>
  );
}
