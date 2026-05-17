import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudent } from '../../services/studentService.js';
import { getEnrollmentsByStudent } from '../../services/enrollmentService.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function InstructorStudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getStudent(id), getEnrollmentsByStudent(id)])
      .then(([s, e]) => {
        if (!active) return;
        setStudent(s);
        setEnrollments(e);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.status === 404
            ? 'Student not found.'
            : err.response?.data?.message || 'Failed to load profile.'
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Loader text="Loading profile..." />;

  if (!student) {
    return (
      <div>
        <Alert type="error">{error || 'Student not found.'}</Alert>
        <Link to="/instructor/students" className="btn btn-secondary">
          Back to students
        </Link>
      </div>
    );
  }

  const approved = enrollments.filter((e) => e.isApproved);
  const pending = enrollments.filter((e) => !e.isApproved);

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1>Student profile</h1>
        <Link to="/instructor/students" className="btn btn-secondary">
          Back
        </Link>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="card">
        <div className="form-group">
          <label>Name</label>
          <input className="form-control" value={student.name} disabled />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" value={student.email} disabled />
        </div>
        <div className="form-group">
          <label>Student ID</label>
          <input className="form-control" value={student.id} disabled />
        </div>
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>
        Enrolled courses ({approved.length})
      </h2>
      {approved.length === 0 ? (
        <div className="card center muted">
          This student is not enrolled in any course.
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Course</th>
              <th>Instructor</th>
              <th style={{ width: 100 }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {approved.map((e) => (
              <tr key={`${e.studentId}-${e.courseId}`}>
                <td>{e.courseId}</td>
                <td>{e.courseTitle}</td>
                <td>{e.instructorName}</td>
                <td>
                  {e.grade ? (
                    <strong>{e.grade}</strong>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pending.length > 0 && (
        <>
          <h2 style={{ marginTop: '1.5rem' }}>
            Pending requests ({pending.length})
          </h2>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Course</th>
                <th>Instructor</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((e) => (
                <tr key={`p-${e.studentId}-${e.courseId}`}>
                  <td>{e.courseId}</td>
                  <td>{e.courseTitle}</td>
                  <td>{e.instructorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
