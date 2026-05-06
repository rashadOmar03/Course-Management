import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchMe } from '../../services/authService.js';
import { getMyEnrollments } from '../../services/enrollmentService.js';
import Loader from '../../components/Loader.jsx';

export default function StudentDashboard() {
  const [me, setMe] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchMe().catch(() => null),
      getMyEnrollments().catch(() => []),
    ]).then(([profile, enrolled]) => {
      if (!active) return;
      setMe(profile);
      setEnrollments(enrolled);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader text="Loading your dashboard..." />;

  return (
    <div>
      <div className="hero">
        <h1>Welcome, {me?.studentName || me?.username}</h1>
        <p className="muted">
          You&apos;re enrolled in <strong>{enrollments.length}</strong>{' '}
          course{enrollments.length === 1 ? '' : 's'}.
        </p>
      </div>

      <div className="feature-grid">
        <Link to="/student/courses" className="feature feature-link">
          <h3>Browse courses</h3>
          <p className="muted">See the full catalog and enroll yourself.</p>
        </Link>
        <Link to="/student/my-courses" className="feature feature-link">
          <h3>My courses</h3>
          <p className="muted">Courses you&apos;re enrolled in.</p>
          <p className="stat">{enrollments.length}</p>
        </Link>
        <Link to="/student/profile" className="feature feature-link">
          <h3>My profile</h3>
          <p className="muted">View and update your details.</p>
        </Link>
      </div>
    </div>
  );
}
