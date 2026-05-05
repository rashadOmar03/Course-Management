import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getStudent,
  updateStudent,
  deleteStudent
} from '../services/studentService.js';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

export default function StudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getStudent(id)
      .then((s) => {
        if (!active) return;
        setForm({ name: s.name || '', email: s.email || '' });
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 404) {
          setError('Student not found.');
        } else {
          setError(err.message || 'Failed to load student.');
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await updateStudent(id, {
        name: form.name.trim(),
        email: form.email.trim()
      });
      setSuccess('Student updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          'Failed to update student.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this student?')) return;
    try {
      await deleteStudent(id);
      navigate('/students');
    } catch (err) {
      setError(err.message || 'Failed to delete student.');
    }
  };

  if (loading) return <Loader text="Loading student..." />;

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>Edit Student</h1>
        <Link to="/students" className="btn btn-secondary">
          Back
        </Link>
      </div>

      <div className="card">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ID</label>
            <input
              type="text"
              className="form-control"
              value={id}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="btn-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
