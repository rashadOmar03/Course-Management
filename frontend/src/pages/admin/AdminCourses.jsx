import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, deleteCourse } from '../../services/courseService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setCourses(await getCourses());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this course? Enrolled students will be removed too.'))
      return;
    try {
      await deleteCourse(id);
      setInfo('Course deleted.');
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Courses</h1>
        <Link to="/admin/courses/new" className="btn btn-primary">
          + New Course
        </Link>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      {loading ? (
        <Loader text="Loading courses..." />
      ) : courses.length === 0 ? (
        <div className="card center muted">
          No courses yet. Create the first one!
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Title</th>
              <th>Instructor</th>
              <th style={{ width: 110 }}>Enrolled</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.title}</td>
                <td>{c.instructorName || <span className="muted">—</span>}</td>
                <td>{c.enrollmentCount}</td>
                <td>
                  <div className="btn-row">
                    <Link
                      to={`/admin/courses/${c.id}`}
                      className="btn btn-secondary"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
