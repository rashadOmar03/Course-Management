import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyEnrollments, selfUnenroll } from '../../services/enrollmentService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function StudentMyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setEnrollments(await getMyEnrollments());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (courseId, isApproved) => {
    const msg = isApproved
      ? 'Unenroll from this course?'
      : 'Cancel your enrollment request?';
    if (!confirm(msg)) return;
    try {
      await selfUnenroll(courseId);
      setInfo(isApproved ? 'Unenrolled.' : 'Request cancelled.');
      setEnrollments((prev) => prev.filter((e) => e.courseId !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update enrollment.');
    }
  };

  const { approved, pending } = useMemo(() => {
    const a = [];
    const p = [];
    enrollments.forEach((e) => (e.isApproved ? a.push(e) : p.push(e)));
    return { approved: a, pending: p };
  }, [enrollments]);

  if (loading) return <Loader text="Loading your courses..." />;

  return (
    <div>
      <div className="page-header">
        <h1>My courses</h1>
        <Link to="/student/courses" className="btn btn-primary">
          Browse catalog
        </Link>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      {pending.length > 0 && (
        <>
          <h2>
            Pending requests{' '}
            <span className="badge badge-warn">{pending.length}</span>
          </h2>
          <table className="table" style={{ marginBottom: '1.5rem' }}>
            <thead>
              <tr>
                <th>Course</th>
                <th>Instructor</th>
                <th style={{ width: 160 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((e) => (
                <tr key={e.courseId}>
                  <td>{e.courseTitle}</td>
                  <td>{e.instructorName}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleCancel(e.courseId, false)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Enrolled</h2>
      {approved.length === 0 ? (
        <div className="card center muted">
          You aren&apos;t enrolled in anything yet.{' '}
          <Link to="/student/courses" className="btn-link">
            Browse the catalog
          </Link>
          .
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Instructor</th>
              <th style={{ width: 100 }}>Grade</th>
              <th style={{ width: 140 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {approved.map((e) => (
              <tr key={e.courseId}>
                <td>{e.courseTitle}</td>
                <td>{e.instructorName}</td>
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
                    onClick={() => handleCancel(e.courseId, true)}
                  >
                    Unenroll
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
