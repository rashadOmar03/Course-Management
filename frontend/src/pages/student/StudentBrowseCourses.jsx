import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../../services/courseService.js';
import {
  getMyEnrollments,
  requestEnrollment,
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

  const myByCourseId = useMemo(() => {
    const m = new Map();
    mine.forEach((e) => m.set(e.courseId, e));
    return m;
  }, [mine]);

  const instructorById = useMemo(() => {
    const m = new Map();
    instructors.forEach((i) => m.set(i.id, i));
    return m;
  }, [instructors]);

  const handleRequest = async (courseId) => {
    setBusyId(courseId);
    setError('');
    setInfo('');
    try {
      await requestEnrollment(courseId);
      setInfo('Enrollment request sent. Waiting for admin approval.');
      setMine(await getMyEnrollments());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (courseId, isApproved) => {
    const msg = isApproved
      ? 'Unenroll from this course?'
      : 'Cancel your enrollment request?';
    if (!confirm(msg)) return;
    setBusyId(courseId);
    setError('');
    setInfo('');
    try {
      await selfUnenroll(courseId);
      setInfo(isApproved ? 'Unenrolled.' : 'Request cancelled.');
      setMine((prev) => prev.filter((e) => e.courseId !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update enrollment.');
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
            const enrollment = myByCourseId.get(c.id);
            const ins = instructorById.get(c.instructorId);
            const busy = busyId === c.id;
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
                  {c.enrollmentCount} student
                  {c.enrollmentCount === 1 ? '' : 's'} enrolled
                </div>

                {enrollment && (
                  <div>
                    {enrollment.isApproved ? (
                      <span className="badge badge-info">Enrolled</span>
                    ) : (
                      <span className="badge badge-warn">Pending approval</span>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 'auto' }}>
                  {!enrollment && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleRequest(c.id)}
                      disabled={busy}
                    >
                      {busy ? 'Sending...' : 'Request enrollment'}
                    </button>
                  )}
                  {enrollment && !enrollment.isApproved && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleCancel(c.id, false)}
                      disabled={busy}
                    >
                      {busy ? 'Working...' : 'Cancel request'}
                    </button>
                  )}
                  {enrollment && enrollment.isApproved && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleCancel(c.id, true)}
                      disabled={busy}
                    >
                      {busy ? 'Working...' : 'Unenroll'}
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
