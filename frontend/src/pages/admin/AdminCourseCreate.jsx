import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createCourse } from '../../services/courseService.js';
import { getInstructors } from '../../services/instructorService.js';
import Alert from '../../components/Alert.jsx';

export default function AdminCourseCreate() {
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
      .catch(() => setError('Failed to load instructors.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) return setError('Title is required.');
    if (!form.instructorId) return setError('Please pick an instructor.');

    setSubmitting(true);
    try {
      await createCourse({
        title: form.title.trim(),
        instructorId: Number(form.instructorId),
      });
      setSuccess('Course created. Redirecting...');
      setTimeout(() => navigate('/admin/courses'), 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>New Course</h1>
        <Link to="/admin/courses" className="btn btn-secondary">
          Cancel
        </Link>
      </div>

      <div className="card">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        {instructors.length === 0 && (
          <Alert type="info">
            No approved instructors yet. Approve one first under{' '}
            <Link to="/admin/instructors" className="btn-link">
              Instructors
            </Link>
            .
          </Alert>
        )}

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
              required
              placeholder="e.g. Intro to React"
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
              disabled={instructors.length === 0}
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
            disabled={submitting || instructors.length === 0}
          >
            {submitting ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
}
