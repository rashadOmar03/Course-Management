import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getStudent, updateStudent, deleteStudent } from '../../services/studentService.js';
import { getEnrollmentsByStudent, unenroll } from '../../services/enrollmentService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminStudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '' });
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getStudent(id), getEnrollmentsByStudent(id)])
      .then(([s, e]) => {
        if (!active) return;
        setForm({ name: s.name || '', email: s.email || '' });
        setEnrollments(e);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.status === 404
            ? 'Student not found.'
            : err.response?.data?.message || 'Failed to load student.'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) return setError('Name is required.');

    setSubmitting(true);
    try {
      await updateStudent(id, {
        name: form.name.trim(),
        email: form.email.trim(),
      });
      setSuccess('Student updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this student?')) return;
    try {
      await deleteStudent(id);
      navigate('/admin/students');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  const handleRemoveEnrollment = async (courseId) => {
    if (!confirm('Remove this enrollment?')) return;
    try {
      await unenroll(Number(id), courseId);
      setEnrollments((prev) => prev.filter((x) => x.courseId !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove enrollment.');
    }
  };

  if (loading) return <Loader text="Loading student..." />;

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1>Edit Student</h1>
        <Link to="/admin/students" className="btn btn-secondary">
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

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete Student
            </button>
          </div>
        </form>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Enrollments</h2>
      {enrollments.length === 0 ? (
        <div className="card center muted">Not enrolled in any course.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Course</th>
              <th>Instructor</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 80 }}>Grade</th>
              <th style={{ width: 140 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.courseId}>
                <td>{e.courseId}</td>
                <td>{e.courseTitle}</td>
                <td>{e.instructorName}</td>
                <td>
                  {e.isApproved ? (
                    <span className="badge badge-info">Enrolled</span>
                  ) : (
                    <span className="badge badge-warn">Pending</span>
                  )}
                </td>
                <td>
                  {e.grade ? (
                    <strong>{e.grade}</strong>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleRemoveEnrollment(e.courseId)}
                  >
                    {e.isApproved ? 'Unenroll' : 'Cancel'}
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
