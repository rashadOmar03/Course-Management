import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createCourse, getInstructors } from '../services/courseService.js';
import Alert from '../components/Alert.jsx';

export default function CourseCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', instructorId: '' });
  const [instructors, setInstructors] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getInstructors()
      .then((data) => {
        setInstructors(data);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, instructorId: String(data[0].id) }));
        }
      })
      .catch((err) => setError(err.message || 'Failed to load instructors.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.instructorId) {
      setError('Please select an instructor.');
      return;
    }

    setSubmitting(true);
    try {
      await createCourse({
        title: form.title.trim(),
        instructorId: Number(form.instructorId)
      });
      setSuccess('Course created successfully! Redirecting...');
      setTimeout(() => navigate('/courses'), 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          'Failed to create course.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>New Course</h1>
        <Link to="/courses" className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      <div className="card">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-control"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Introduction to React"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructorId">Instructor *</label>
            <select
              id="instructorId"
              name="instructorId"
              className="form-control"
              value={form.instructorId}
              onChange={handleChange}
              required
            >
              <option value="">-- Select instructor --</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
}
