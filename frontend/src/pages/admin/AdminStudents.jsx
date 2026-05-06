import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudents, deleteStudent } from '../../services/studentService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setStudents(await getStudents());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this student? Their enrollments will be removed too.'))
      return;
    try {
      await deleteStudent(id);
      setInfo('Student deleted.');
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Students</h1>
        <span className="muted">
          Students sign themselves up. You can edit or remove them here.
        </span>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      {loading ? (
        <Loader text="Loading students..." />
      ) : students.length === 0 ? (
        <div className="card center muted">No students yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.email || <span className="muted">—</span>}</td>
                <td>
                  <div className="btn-row">
                    <Link
                      to={`/admin/students/${s.id}`}
                      className="btn btn-secondary"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(s.id)}
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
