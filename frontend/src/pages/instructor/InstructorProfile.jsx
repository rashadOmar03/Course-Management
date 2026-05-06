import { useEffect, useState } from 'react';
import { fetchMe } from '../../services/authService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function InstructorProfile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch((err) =>
        setError(err.response?.data?.message || 'Failed to load profile.')
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading..." />;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>My profile</h1>
      <Alert type="error">{error}</Alert>

      {me && (
        <div className="card">
          <div className="form-group">
            <label>Name</label>
            <input
              className="form-control"
              value={me.instructorName || ''}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-control"
              value={me.instructorEmail || ''}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input className="form-control" value={me.username} disabled />
          </div>
          <div className="form-group">
            <label>Status</label>
            <input
              className="form-control"
              value={me.isApprovedInstructor ? 'Approved' : 'Pending approval'}
              disabled
            />
          </div>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            To change your details, contact an admin.
          </p>
        </div>
      )}
    </div>
  );
}
