import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../../services/courseService.js';
import {
  getMyEnrollments,
  selfEnroll,
  selfUnenroll,
} from '../../services/enrollmentService.js';
import { getInstructors } from '../../services/instructorService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function StudentBrowseCourses() {
  const [courses, setCourses] = useState([]);
  const [mine, setMine] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [c, m, ins] = await Promise.all([
        getCourses(),
        getMyEnrollments(),
        getInstructors(),
      ]);
      setCourses(c);
      setMine(m);
      setInstructors(ins);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const enrolledIds = useMemo(
    () => new Set(mine.map((e) => e.courseId)),
    [mine]
  );

  const instructorById = useMemo(() => {
    const m = new Map();
    instructors.forEach((i) => m.set(i.id, i));
    return m;
  }, [instructors]);

  const handleEnroll = async (courseId) => {
    setBusyId(courseId);
    setError('');
    setInfo('');
    try {
      await selfEnroll(courseId);
      setInfo('Enrolled.');
      const fresh = await getMyEnrollments();
      setMine(fresh);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!confirm('Unenroll from this course?')) return;
    setBusyId(courseId);
    setError('');
    setInfo('');
    try {
      await selfUnenroll(courseId);
      setInfo('Unenrolled.');
      setMine((prev) => prev.filter((e) => e.courseId !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unenroll.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader text="Loading catalog..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Course catalog</h1>
        <Link to="/student" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      {courses.length === 0 ? (
        <div className="card center muted">No courses available yet.</div>
      ) : (
        <div className="course-grid">
          {courses.map((c) => {
            const enrolled = enrolledIds.has(c.id);
            const ins = instructorById.get(c.instructorId);
            return (
              <div key={c.id} className="course-card">
                <h3>{c.title}</h3>
                <div className="muted">
                  Instructor: <strong>{c.instructorName}</strong>
                </div>
                {ins?.bio && (
                  <p className="muted course-bio">{ins.bio}</p>
                )}
                <div className="muted">
                  {c.enrollmentCount} student{c.enrollmentCount === 1 ? '' : 's'} enrolled
                </div>
                <div style={{ marginTop: 'auto' }}>
                  {enrolled ? (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleUnenroll(c.id)}
                      disabled={busyId === c.id}
                    >
                      {busyId === c.id ? 'Working...' : 'Unenroll'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleEnroll(c.id)}
                      disabled={busyId === c.id}
                    >
                      {busyId === c.id ? 'Working...' : 'Enroll'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
