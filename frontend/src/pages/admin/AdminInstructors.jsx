import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllInstructors,
  approveInstructor,
  deleteInstructor,
} from '../../services/instructorService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setInstructors(await getAllInstructors());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load instructors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveInstructor(id);
      setInfo('Instructor approved.');
      setInstructors((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isApproved: true } : i))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this instructor?')) return;
    try {
      await deleteInstructor(id);
      setInfo('Instructor deleted.');
      setInstructors((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const pending = instructors.filter((i) => !i.isApproved);
  const approved = instructors.filter((i) => i.isApproved);

  return (
    <div>
      <div className="page-header">
        <h1>Instructors</h1>
        <Link to="/admin/instructors/new" className="btn btn-primary">
          + New Instructor
        </Link>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      {loading ? (
        <Loader text="Loading..." />
      ) : (
        <>
          <h2>
            Pending approval{' '}
            {pending.length > 0 && (
              <span className="badge badge-warn">{pending.length}</span>
            )}
          </h2>
          {pending.length === 0 ? (
            <div className="card center muted">No pending instructors.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Bio</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((i) => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>{i.name}</td>
                    <td>{i.email}</td>
                    <td>
                      {i.bio ? (
                        i.bio
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleApprove(i.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDelete(i.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ marginTop: '2rem' }}>Approved instructors</h2>
          {approved.length === 0 ? (
            <div className="card center muted">No approved instructors yet.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Login</th>
                  <th>Bio</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((i) => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>{i.name}</td>
                    <td>{i.email}</td>
                    <td>
                      {i.username ? (
                        <code>{i.username}</code>
                      ) : (
                        <span className="badge badge-warn">no login</span>
                      )}
                    </td>
                    <td>
                      {i.bio ? (
                        i.bio
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-row">
                        <Link
                          to={`/admin/instructors/${i.id}`}
                          className="btn btn-secondary"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDelete(i.id)}
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
        </>
      )}
    </div>
  );
}
