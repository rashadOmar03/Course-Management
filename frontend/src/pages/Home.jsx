import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>Welcome to Course Management</h1>
        <p className="muted">
          A simple React + ASP.NET Core app to manage courses, instructors, and students.
        </p>
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <Link to="/courses" className="btn btn-primary">
            Browse Courses
          </Link>
          <Link to="/students" className="btn btn-secondary">
            Manage Students
          </Link>
        </div>
      </section>

      <div className="feature-grid">
        <div className="feature">
          <h3>Courses</h3>
          <p className="muted">
            Create, view, edit, and delete courses. Public access — no login required.
          </p>
        </div>
        <div className="feature">
          <h3>Students</h3>
          <p className="muted">
            Full student management. Requires logging in (JWT-protected endpoints).
          </p>
        </div>
        <div className="feature">
          <h3>Instructors</h3>
          <p className="muted">
            Each course is linked to an instructor — pick one when creating a course.
          </p>
        </div>
      </div>
    </div>
  );
}
