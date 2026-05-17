import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMe } from '../../services/authService.js';
import { getCourses } from '../../services/courseService.js';
import { getInstructors } from '../../services/instructorService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function InstructorCourses() {
  const [me, setMe] = useState(null);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([fetchMe(), getCourses(), getInstructors()])
      .then(([profile, c, ins]) => {
        if (!active) return;
        setMe(profile);
        setCourses(c);
        setInstructors(ins);
      })
      .catch((err) =>
        setError(err.response?.data?.message || 'Failed to load courses.')
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const instructorById = useMemo(() => {
    const m = new Map();
    instructors.forEach((i) => m.set(i.id, i));
    return m;
  }, [instructors]);

  if (loading) return <Loader text="Loading catalog..." />;

  const myInstructorId = me?.instructorId;

  return (
    <div>
      <div className="page-header">
        <h1>Course catalog</h1>
        <Link to="/instructor" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <Alert type="error">{error}</Alert>

      {courses.length === 0 ? (
        <div className="card center muted">No courses available yet.</div>
      ) : (
        <div className="course-grid">
          {courses.map((c) => {
            const ins = instructorById.get(c.instructorId);
            const isMine = c.instructorId === myInstructorId;
            return (
              <div key={c.id} className="course-card">
                <h3>
                  {c.title}
                  {isMine && (
                    <span
                      className="badge badge-info"
                      style={{ marginLeft: '0.5rem' }}
                    >
                      yours
                    </span>
                  )}
                </h3>
                <div className="muted">
                  Instructor: <strong>{c.instructorName}</strong>
                </div>
                {ins?.bio && <p className="muted course-bio">{ins.bio}</p>}
                <div className="muted">
                  {c.enrollmentCount} student
                  {c.enrollmentCount === 1 ? '' : 's'} enrolled
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
