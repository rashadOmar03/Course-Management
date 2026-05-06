import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import {
  isAuthenticated,
  getCurrentUser,
  homePathForRole,
} from './services/authService.js';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminCourses from './pages/admin/AdminCourses.jsx';
import AdminCourseCreate from './pages/admin/AdminCourseCreate.jsx';
import AdminCourseEdit from './pages/admin/AdminCourseEdit.jsx';
import AdminStudents from './pages/admin/AdminStudents.jsx';
import AdminStudentEdit from './pages/admin/AdminStudentEdit.jsx';
import AdminInstructors from './pages/admin/AdminInstructors.jsx';
import AdminInstructorCreate from './pages/admin/AdminInstructorCreate.jsx';
import AdminInstructorEdit from './pages/admin/AdminInstructorEdit.jsx';
import AdminEnrollments from './pages/admin/AdminEnrollments.jsx';
import AdminAdmins from './pages/admin/AdminAdmins.jsx';

import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentBrowseCourses from './pages/student/StudentBrowseCourses.jsx';
import StudentMyCourses from './pages/student/StudentMyCourses.jsx';
import StudentProfile from './pages/student/StudentProfile.jsx';

import InstructorDashboard from './pages/instructor/InstructorDashboard.jsx';
import InstructorProfile from './pages/instructor/InstructorProfile.jsx';

function RootRedirect() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(getCurrentUser()?.role)} replace />;
}

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/new"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminCourseCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:id"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminCourseEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminStudentEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/instructors"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminInstructors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/instructors/new"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminInstructorCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/instructors/:id"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminInstructorEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enrollments"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminEnrollments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminAdmins />
              </ProtectedRoute>
            }
          />

          {/* Student */}
          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['Student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute roles={['Student']}>
                <StudentBrowseCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-courses"
            element={
              <ProtectedRoute roles={['Student']}>
                <StudentMyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute roles={['Student']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* Instructor */}
          <Route
            path="/instructor"
            element={
              <ProtectedRoute roles={['Instructor']}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/profile"
            element={
              <ProtectedRoute roles={['Instructor']}>
                <InstructorProfile />
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
