import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getEnrollments,
  approveEnrollment,
  enroll,
  unenroll,
} from '../../services/enrollmentService.js';
import { getStudents } from '../../services/studentService.js';
import { getCourses } from '../../services/courseService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCourse, setFilterCourse] = useState('');
  const [picker, setPicker] = useState({ studentId: '', courseId: '' });

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [enr, st, co] = await Promise.all([
        getEnrollments(),
        getStudents(),
        getCourses(),
      ]);
      setEnrollments(enr);
      setStudents(st);
      setCourses(co);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pending = useMemo(
    () => enrollments.filter((e) => !e.isApproved),
    [enrollments]
  );

  const approvedFiltered = useMemo(() => {
    const approved = enrollments.filter((e) => e.isApproved);
    if (!filterCourse) return approved;
    const cid = Number(filterCourse);
    return approved.filter((e) => e.courseId === cid);
  }, [enrollments, filterCourse]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!picker.studentId || !picker.courseId)
      return setError('Pick both a student and a course.');

    try {
      await enroll(Number(picker.studentId), Number(picker.courseId));
      setInfo('Enrolled.');
      setPicker({ studentId: '', courseId: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll.');
    }
  };

  const handleApprove = async (studentId, courseId) => {
    setError('');
    setInfo('');
    try {
      await approveEnrollment(studentId, courseId);
      setInfo('Request approved.');
      setEnrollments((prev) =>
        prev.map((e) =>
          e.studentId === studentId && e.courseId === courseId
            ? { ...e, isApproved: true }
            : e
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve.');
    }
  };

  const handleReject = async (studentId, courseId) => {
    if (!confirm('Reject this enrollment request?')) return;
    try {
      await unenroll(studentId, courseId);
      setEnrollments((prev) =>
        prev.filter(
          (e) => !(e.studentId === studentId && e.courseId === courseId)
        )
      );
      setInfo('Request rejected.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject.');
    }
  };

  const handleUnenroll = async (studentId, courseId) => {
    if (!confirm('Remove this enrollment?')) return;
    try {
      await unenroll(studentId, courseId);
      setEnrollments((prev) =>
        prev.filter(
          (e) => !(e.studentId === studentId && e.courseId === courseId)
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove.');
    }
  };

  if (loading) return <Loader text="Loading enrollments..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Enrollments</h1>
        <Link to="/admin" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      <h2>
        Pending requests{' '}
        {pending.length > 0 && (
          <span className="badge badge-warn">{pending.length}</span>
        )}
      </h2>
      {pending.length === 0 ? (
        <div className="card center muted">No pending requests.</div>
      ) : (
        <table className="table" style={{ marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Course</th>
              <th>Instructor</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((e) => (
              <tr key={`${e.studentId}-${e.courseId}`}>
                <td>{e.studentName}</td>
                <td>{e.studentEmail}</td>
                <td>{e.courseTitle}</td>
                <td>{e.instructorName}</td>
                <td>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleApprove(e.studentId, e.courseId)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleReject(e.studentId, e.courseId)}
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

      <div className="card">
        <h3>Enroll a student directly</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Skips the request flow — the student is enrolled immediately.
        </p>
        <form onSubmit={handleEnroll} className="row-form">
          <select
            className="form-control"
            value={picker.studentId}
            onChange={(e) =>
              setPicker((p) => ({ ...p, studentId: e.target.value }))
            }
          >
            <option value="">-- Pick student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={picker.courseId}
            onChange={(e) =>
              setPicker((p) => ({ ...p, courseId: e.target.value }))
            }
          >
            <option value="">-- Pick course --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <button type="submit" className="btn btn-primary">
            Enroll
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Approved enrollments</h3>
        <div className="form-group">
          <label htmlFor="filter">Filter by course</label>
          <select
            id="filter"
            className="form-control"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {approvedFiltered.length === 0 ? (
          <div className="center muted">No enrollments to show.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Instructor</th>
                <th style={{ width: 80 }}>Grade</th>
                <th style={{ width: 140 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvedFiltered.map((e) => (
                <tr key={`${e.studentId}-${e.courseId}`}>
                  <td>{e.studentName}</td>
                  <td>{e.studentEmail}</td>
                  <td>{e.courseTitle}</td>
                  <td>{e.instructorName}</td>
                  <td>
                    {e.grade ? (
                      <strong>{e.grade}</strong>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleUnenroll(e.studentId, e.courseId)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
