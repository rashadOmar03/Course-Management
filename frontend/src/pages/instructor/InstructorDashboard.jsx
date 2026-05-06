import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMe } from '../../services/authService.js';
import { getTeachingEnrollments } from '../../services/enrollmentService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function InstructorDashboard() {
  const [me, setMe] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchMe()
      .then(async (profile) => {
        if (!active) return;
        setMe(profile);
        if (profile.isApprovedInstructor) {
          try {
            setEnrollments(await getTeachingEnrollments());
          } catch (err) {
            setError(err.response?.data?.message || 'Failed to load courses.');
          }
        }
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader text="Loading..." />;

  if (!me?.isApprovedInstructor) {
    return (
      <div className="auth-shell">
        <div className="card auth-card center">
          <h2>Awaiting approval</h2>
          <p className="muted">
            Hi <strong>{me?.instructorName || me?.username}</strong>, your
            instructor account is pending admin approval.
          </p>
          <p className="muted">
            Once an admin approves you, you&apos;ll be able to see the courses
            you teach and the students enrolled in them.
          </p>
        </div>
      </div>
    );
  }

  // Group enrollments by course
  const byCourse = new Map();
  enrollments.forEach((e) => {
    if (!byCourse.has(e.courseId)) {
      byCourse.set(e.courseId, {
        courseId: e.courseId,
        courseTitle: e.courseTitle,
        students: [],
      });
    }
    byCourse.get(e.courseId).students.push(e);
  });
  const courses = Array.from(byCourse.values());

  return (
    <div>
      <div className="hero">
        <h1>Welcome, {me?.instructorName || me?.username}</h1>
        <p className="muted">
          You&apos;re teaching <strong>{courses.length}</strong>{' '}
          course{courses.length === 1 ? '' : 's'}.
        </p>
      </div>

      <Alert type="error">{error}</Alert>

      {courses.length === 0 ? (
        <div className="card center muted">
          You aren&apos;t assigned to any courses yet. An admin can assign you
          to a course from the admin dashboard.
        </div>
      ) : (
        <div>
          <h2>My courses</h2>
          {courses.map((c) => (
            <div className="card" key={c.courseId} style={{ marginBottom: '1rem' }}>
              <h3>{c.courseTitle}</h3>
              <p className="muted">
                {c.students.length} student{c.students.length === 1 ? '' : 's'} enrolled
              </p>
              {c.students.length > 0 && (
                <table className="table" style={{ marginTop: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.students.map((s) => (
                      <tr key={s.studentId}>
                        <td>{s.studentId}</td>
                        <td>{s.studentName}</td>
                        <td>{s.studentEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: '1rem' }}>
        <Link to="/instructor/profile" className="btn-link">
          View my profile
        </Link>
      </p>
    </div>
  );
}
