import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getCourse,
  updateCourse,
  deleteCourse,
  getInstructors
} from '../services/courseService.js';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

export default function CourseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', instructorId: '' });
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [course, instr] = await Promise.all([
          getCourse(id),
          getInstructors()
        ]);
        if (!active) return;
        setForm({
          title: course.title,
          instructorId: String(course.instructorId ?? '')
        });
        setInstructors(instr);
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 404) {
          setError('Course not found.');
        } else {
          setError(err.message || 'Failed to load course.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
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

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSubmitting(true);
    try {
      await updateCourse(id, {
        title: form.title.trim(),
        instructorId: Number(form.instructorId)
      });
      setSuccess('Course updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          'Failed to update course.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await deleteCourse(id);
      navigate('/courses');
    } catch (err) {
      setError(err.message || 'Failed to delete course.');
    }
  };

  if (loading) return <Loader text="Loading course..." />;

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>Edit Course</h1>
        <Link to="/courses" className="btn btn-secondary">
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
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-control"
              value={form.title}
              onChange={handleChange}
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
