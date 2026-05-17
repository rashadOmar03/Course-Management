import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  getCurrentUser,
  isAuthenticated,
  logout,
  homePathForRole,
} from '../services/authService.js';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const onChange = () => setUser(getCurrentUser());
    window.addEventListener('storage', onChange);
    window.addEventListener('auth-change', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('auth-change', onChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const authed = isAuthenticated();
  const role = user?.role;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink
          to={authed ? homePathForRole(role) : '/login'}
          className="brand"
        >
          Course Management
        </NavLink>
        <div className="nav-links">
          {authed && role === 'Admin' && (
            <>
              <NavLink to="/admin" end className="nav-link">
                Dashboard
              </NavLink>
              <NavLink to="/admin/courses" className="nav-link">
                Courses
              </NavLink>
              <NavLink to="/admin/students" className="nav-link">
                Students
              </NavLink>
              <NavLink to="/admin/instructors" className="nav-link">
                Instructors
              </NavLink>
              <NavLink to="/admin/enrollments" className="nav-link">
                Enrollments
              </NavLink>
              <NavLink to="/admin/admins" className="nav-link">
                Admins
              </NavLink>
            </>
          )}

          {authed && role === 'Student' && (
            <>
              <NavLink to="/student" end className="nav-link">
                Dashboard
              </NavLink>
              <NavLink to="/student/courses" className="nav-link">
                Browse
              </NavLink>
              <NavLink to="/student/my-courses" className="nav-link">
                My courses
              </NavLink>
              <NavLink to="/student/profile" className="nav-link">
                Profile
              </NavLink>
            </>
          )}

          {authed && role === 'Instructor' && (
            <>
              <NavLink to="/instructor" end className="nav-link">
                Dashboard
              </NavLink>
              <NavLink to="/instructor/courses" className="nav-link">
                Courses
              </NavLink>
              <NavLink to="/instructor/students" className="nav-link">
                Students
              </NavLink>
              <NavLink to="/instructor/profile" className="nav-link">
                Profile
              </NavLink>
            </>
          )}

          {authed ? (
            <>
              {user?.username && (
                <span className="user-pill">
                  {user.username}{' '}
                  <span className="user-pill-role">{role}</span>
                </span>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Login
              </NavLink>
              <NavLink to="/signup" className="nav-link">
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
