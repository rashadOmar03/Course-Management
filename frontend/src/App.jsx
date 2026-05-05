import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import CoursesList from './pages/CoursesList.jsx';
import CourseCreate from './pages/CourseCreate.jsx';
import CourseEdit from './pages/CourseEdit.jsx';
import StudentsList from './pages/StudentsList.jsx';
import StudentCreate from './pages/StudentCreate.jsx';
import StudentEdit from './pages/StudentEdit.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route path="/courses" element={<CoursesList />} />
          <Route path="/courses/new" element={<CourseCreate />} />
          <Route path="/courses/:id" element={<CourseEdit />} />

          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/new"
            element={
              <ProtectedRoute>
                <StudentCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <StudentEdit />
              </ProtectedRoute>
            }
          />

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <small>Course Management &copy; {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
}
