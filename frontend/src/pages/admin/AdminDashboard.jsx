import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/authService.js';
import { getCourses } from '../../services/courseService.js';
import { getStudents } from '../../services/studentService.js';
import { getAllInstructors, getPendingInstructors } from '../../services/instructorService.js';
import { getPendingEnrollments } from '../../services/enrollmentService.js';

export default function AdminDashboard() {
  const user = getCurrentUser();
  const [stats, setStats] = useState({
    courses: '—',
    students: '—',
    instructors: '—',
    pending: '—',
    pendingEnrollments: '—',
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      getCourses().catch(() => []),
      getStudents().catch(() => []),
      getAllInstructors().catch(() => []),
      getPendingInstructors().catch(() => []),
      getPendingEnrollments().catch(() => []),
    ]).then(([courses, students, instructors, pending, pendingEnrollments]) => {
      if (!active) return;
      setStats({
        courses: courses.length,
        students: students.length,
        instructors: instructors.length,
        pending: pending.length,
        pendingEnrollments: pendingEnrollments.length,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="hero">
        <h1>Admin dashboard</h1>
        <p className="muted">
          Welcome back, <strong>{user?.username}</strong>. Manage everything
          from one place.
        </p>
      </div>

      <div className="feature-grid">
        <Link to="/admin/courses" className="feature feature-link">
          <h3>Courses</h3>
          <p className="muted">Create, edit and delete courses.</p>
          <p className="stat">{stats.courses}</p>
        </Link>
        <Link to="/admin/students" className="feature feature-link">
          <h3>Students</h3>
          <p className="muted">View, edit, and remove students.</p>
          <p className="stat">{stats.students}</p>
        </Link>
        <Link to="/admin/instructors" className="feature feature-link">
          <h3>Instructors</h3>
          <p className="muted">
            Approve sign-ups, edit, or remove instructors.
          </p>
          <p className="stat">
            {stats.instructors}
            {stats.pending > 0 && (
              <span className="badge badge-warn">
                {stats.pending} pending
              </span>
            )}
          </p>
        </Link>
        <Link to="/admin/enrollments" className="feature feature-link">
          <h3>Enrollments</h3>
          <p className="muted">
            Approve student requests, add or remove enrollments.
          </p>
          <p className="stat">
            {stats.pendingEnrollments > 0 && (
              <span className="badge badge-warn">
                {stats.pendingEnrollments} pending
              </span>
            )}
          </p>
        </Link>
        <Link to="/admin/admins" className="feature feature-link">
          <h3>Admins</h3>
          <p className="muted">Create or remove other admin accounts.</p>
        </Link>
      </div>
    </div>
  );
}
