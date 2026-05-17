import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMe } from '../../services/authService.js';
import { getCourses } from '../../services/courseService.js';
import { getStudents } from '../../services/studentService.js';
import {
  getTeachingEnrollments,
  setGrade,
  instructorAddStudent,
  instructorRemoveStudent,
} from '../../services/enrollmentService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function InstructorDashboard() {
  const [me, setMe] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [addPicks, setAddPicks] = useState({});
  const [addingCourseId, setAddingCourseId] = useState(null);

  const loadData = async (instructorId) => {
    const [allCourses, allStudents, allEnrollments] = await Promise.all([
      getCourses(),
      getStudents(),
      getTeachingEnrollments(),
    ]);
    const myCourses = allCourses.filter((c) => c.instructorId === instructorId);
    setCourses(myCourses);
    setStudents(allStudents);
    setEnrollments(allEnrollments);
    const next = {};
    allEnrollments.forEach((e) => {
      next[`${e.studentId}-${e.courseId}`] = e.grade ?? '';
    });
    setDrafts(next);
  };

  useEffect(() => {
    let active = true;
    fetchMe()
      .then(async (profile) => {
        if (!active) return;
        setMe(profile);
        if (profile.isApprovedInstructor && profile.instructorId) {
          await loadData(profile.instructorId);
        }
      })
      .catch(() => active && setError('Failed to load profile.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const enrollmentsByCourse = useMemo(() => {
    const m = new Map();
    enrollments.forEach((e) => {
      if (!m.has(e.courseId)) m.set(e.courseId, []);
      m.get(e.courseId).push(e);
    });
    return m;
  }, [enrollments]);

  const handleDraftChange = (studentId, courseId, value) => {
    setDrafts((prev) => ({ ...prev, [`${studentId}-${courseId}`]: value }));
  };

  const handleSaveGrade = async (studentId, courseId) => {
    const key = `${studentId}-${courseId}`;
    setSavingKey(key);
    setError('');
    setInfo('');
    try {
      const grade = drafts[key]?.trim() || null;
      await setGrade(studentId, courseId, grade);
      setEnrollments((prev) =>
        prev.map((e) =>
          e.studentId === studentId && e.courseId === courseId
            ? { ...e, grade }
            : e
        )
      );
      setInfo('Grade saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save grade.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemove = async (studentId, courseId, studentName) => {
    if (!confirm(`Remove ${studentName} from this course?`)) return;
    setError('');
    setInfo('');
    try {
      await instructorRemoveStudent(studentId, courseId);
      setEnrollments((prev) =>
        prev.filter(
          (e) => !(e.studentId === studentId && e.courseId === courseId)
        )
      );
      setInfo('Student removed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove student.');
    }
  };

  const handlePickStudent = (courseId, value) => {
    setAddPicks((prev) => ({ ...prev, [courseId]: value }));
  };

  const handleAddStudent = async (courseId) => {
    const raw = addPicks[courseId];
    const studentId = raw ? parseInt(raw, 10) : NaN;
    if (!studentId) return setError('Pick a student to add.');

    setError('');
    setInfo('');
    setAddingCourseId(courseId);
    try {
      await instructorAddStudent(courseId, studentId);
      await loadData(me.instructorId);
      setAddPicks((prev) => ({ ...prev, [courseId]: '' }));
      setInfo('Student added to course.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setAddingCourseId(null);
    }
  };

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

  const totalStudents = enrollments.length;

  return (
    <div>
      <div className="hero">
        <h1>Welcome, {me?.instructorName || me?.username}</h1>
        <p className="muted">
          You&apos;re teaching <strong>{courses.length}</strong>{' '}
          course{courses.length === 1 ? '' : 's'} with{' '}
          <strong>{totalStudents}</strong> enrolled student
          {totalStudents === 1 ? '' : 's'}.
        </p>
      </div>

      <div className="feature-grid" style={{ marginBottom: '1.5rem' }}>
        <Link to="/instructor/courses" className="feature feature-link">
          <h3>Browse courses</h3>
          <p className="muted">See the full course catalog.</p>
        </Link>
        <Link to="/instructor/students" className="feature feature-link">
          <h3>Students</h3>
          <p className="muted">Look up student profiles.</p>
        </Link>
        <Link to="/instructor/profile" className="feature feature-link">
          <h3>My profile</h3>
          <p className="muted">View your account info.</p>
        </Link>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      <h2>My courses</h2>
      {courses.length === 0 ? (
        <div className="card center muted">
          You don&apos;t have any courses assigned yet. Ask an admin to assign
          you to a course.
        </div>
      ) : (
        courses.map((c) => {
          const courseEnrollments = enrollmentsByCourse.get(c.id) || [];
          const enrolledIds = new Set(
            courseEnrollments.map((e) => e.studentId)
          );
          const addable = students.filter((s) => !enrolledIds.has(s.id));
          const pickedId = addPicks[c.id] ?? '';
          const adding = addingCourseId === c.id;

          return (
            <div className="card" key={c.id} style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>{c.title}</h3>
              <p className="muted">
                {courseEnrollments.length} student
                {courseEnrollments.length === 1 ? '' : 's'} enrolled
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  marginBottom: '1rem',
                }}
              >
                <div className="form-group" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
                  <label htmlFor={`add-${c.id}`}>Add student</label>
                  <select
                    id={`add-${c.id}`}
                    className="form-control"
                    value={pickedId}
                    onChange={(e) => handlePickStudent(c.id, e.target.value)}
                    disabled={addable.length === 0}
                  >
                    <option value="">
                      {addable.length === 0
                        ? 'No more students to add'
                        : 'Pick a student...'}
                    </option>
                    {addable.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAddStudent(c.id)}
                  disabled={!pickedId || adding}
                >
                  {adding ? 'Adding...' : 'Add to course'}
                </button>
              </div>

              {courseEnrollments.length > 0 && (
                <table className="table" style={{ marginTop: '0.25rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th style={{ width: 220 }}>Grade</th>
                      <th style={{ width: 220 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseEnrollments.map((s) => {
                      const key = `${s.studentId}-${s.courseId}`;
                      const draft = drafts[key] ?? '';
                      const dirty = (draft || '') !== (s.grade || '');
                      return (
                        <tr key={key}>
                          <td>{s.studentId}</td>
                          <td>{s.studentName}</td>
                          <td>{s.studentEmail}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <input
                                type="text"
                                className="form-control"
                                value={draft}
                                onChange={(e) =>
                                  handleDraftChange(
                                    s.studentId,
                                    s.courseId,
                                    e.target.value
                                  )
                                }
                                placeholder="A, B+, ..."
                                maxLength={5}
                                style={{ maxWidth: 90 }}
                              />
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() =>
                                  handleSaveGrade(s.studentId, s.courseId)
                                }
                                disabled={!dirty || savingKey === key}
                              >
                                {savingKey === key ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="btn-row">
                              <Link
                                to={`/instructor/students/${s.studentId}`}
                                className="btn btn-secondary"
                              >
                                Profile
                              </Link>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() =>
                                  handleRemove(
                                    s.studentId,
                                    s.courseId,
                                    s.studentName
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
