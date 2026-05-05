import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAuthenticated, logout } from '../services/authService.js';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const onStorage = () => setUser(getCurrentUser());
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-change', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-change', onStorage);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          Course Management
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end className="nav-link">
            Home
          </NavLink>
          <NavLink to="/courses" className="nav-link">
            Courses
          </NavLink>
          <NavLink to="/students" className="nav-link">
            Students
          </NavLink>
          {isAuthenticated() ? (
            <>
              {user?.username && (
                <span className="user-pill">{user.username}</span>
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
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
