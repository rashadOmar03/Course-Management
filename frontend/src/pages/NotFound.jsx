import { Link } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, homePathForRole } from '../services/authService.js';

export default function NotFound() {
  const home = isAuthenticated() ? homePathForRole(getCurrentUser()?.role) : '/login';
  return (
    <div className="card center">
      <h1>404</h1>
      <p className="muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to={home} className="btn btn-primary">
        Go Home
      </Link>
    </div>
  );
}
