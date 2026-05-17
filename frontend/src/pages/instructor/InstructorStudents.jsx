import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudents } from '../../services/studentService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function InstructorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    getStudents()
      .then((s) => active && setStudents(s))
      .catch((err) =>
        active &&
        setError(err.response?.data?.message || 'Failed to load students.')
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  if (loading) return <Loader text="Loading students..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Students</h1>
        <Link to="/instructor" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="search">Search by name or email</label>
          <input
            id="search"
            type="text"
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to filter..."
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card center muted" style={{ marginTop: '1rem' }}>
          No students match.
        </div>
      ) : (
        <table className="table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: 160 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>
                  <Link
                    to={`/instructor/students/${s.id}`}
                    className="btn btn-secondary"
                  >
                    View profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
