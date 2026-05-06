import { useEffect, useState } from 'react';
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

  const handleUnenroll = async (courseId) => {
    if (!confirm('Unenroll from this course?')) return;
    try {
      await selfUnenroll(courseId);
      setInfo('Unenrolled.');
      setEnrollments((prev) => prev.filter((e) => e.courseId !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unenroll.');
    }
  };

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

      {enrollments.length === 0 ? (
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
              <th style={{ width: 80 }}>ID</th>
              <th>Course</th>
              <th>Instructor</th>
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
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleUnenroll(e.courseId)}
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
