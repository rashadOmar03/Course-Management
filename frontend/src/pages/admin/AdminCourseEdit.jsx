import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getCourse, updateCourse, deleteCourse } from '../../services/courseService.js';
import { getInstructors } from '../../services/instructorService.js';
import { getEnrollmentsByCourse, unenroll } from '../../services/enrollmentService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminCourseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', instructorId: '' });
  const [instructors, setInstructors] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadEnrollments = async () => {
    try {
      setEnrollments(await getEnrollmentsByCourse(id));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getCourse(id), getInstructors()])
      .then(([course, instr]) => {
        if (!active) return;
        setForm({
          title: course.title,
          instructorId: String(course.instructorId ?? ''),
        });
        setInstructors(instr);
        return loadEnrollments();
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.status === 404
            ? 'Course not found.'
            : err.response?.data?.message || 'Failed to load course.'
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.title.trim()) return setError('Title is required.');

    setSubmitting(true);
    try {
      await updateCourse(id, {
        title: form.title.trim(),
        instructorId: Number(form.instructorId),
      });
      setSuccess('Course updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await deleteCourse(id);
      navigate('/admin/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course.');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm('Remove this student from the course?')) return;
    try {
      await unenroll(studentId, Number(id));
      setEnrollments((prev) => prev.filter((e) => e.studentId !== studentId));
      setSuccess('Student removed from course.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove student.');
    }
  };

  if (loading) return <Loader text="Loading course..." />;

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1>Edit Course</h1>
        <Link to="/admin/courses" className="btn btn-secondary">
          Back
        </Link>
      </div>

      <div className="card">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ID</label>
            <input type="text" className="form-control" value={id} disabled />
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
              <option value="">-- Select --</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete Course
            </button>
          </div>
        </form>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Enrolled students</h2>
      {enrollments.length === 0 ? (
        <div className="card center muted">No students enrolled yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: 140 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.studentId}>
                <td>{e.studentId}</td>
                <td>{e.studentName}</td>
                <td>{e.studentEmail}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleRemoveStudent(e.studentId)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
