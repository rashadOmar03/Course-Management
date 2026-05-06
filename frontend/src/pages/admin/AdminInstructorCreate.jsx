import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createInstructor } from '../../services/instructorService.js';
import Alert from '../../components/Alert.jsx';

export default function AdminInstructorCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', bio: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim())
      return setError('Name and email are required.');

    setSubmitting(true);
    try {
      await createInstructor({
        name: form.name.trim(),
        email: form.email.trim(),
        bio: form.bio.trim(),
      });
      navigate('/admin/instructors');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create instructor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>New Instructor</h1>
        <Link to="/admin/instructors" className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      <div className="card">
        <Alert type="info">
          Admin-created instructors are automatically approved.
        </Alert>
        <Alert type="error">{error}</Alert>

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

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Instructor'}
          </button>
        </form>
      </div>
    </div>
  );
}
