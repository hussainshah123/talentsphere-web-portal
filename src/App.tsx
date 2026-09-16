import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute, homeFor } from './components/ProtectedRoute';
import { useAuth } from './lib/auth';

import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import VerifyEmail from './pages/public/VerifyEmail';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';

import CandidateDashboard from './pages/candidate/Dashboard';
import Onboarding from './pages/candidate/Onboarding';
import Profile from './pages/candidate/Profile';
import CvAts from './pages/candidate/CvAts';
import VerificationCenter from './pages/candidate/VerificationCenter';
import ProfilePreview from './pages/candidate/ProfilePreview';
import CandidateJobs from './pages/candidate/Jobs';
import CandidateApplications from './pages/candidate/Applications';
import PrivacySettings from './pages/candidate/Privacy';
import Messages from './pages/shared/Messages';
import Notifications from './pages/shared/Notifications';
import AccountSettings from './pages/shared/AccountSettings';

import RecruiterDashboard from './pages/recruiter/Dashboard';
import CompanyOnboarding from './pages/recruiter/CompanyOnboarding';
import CompanyProfile from './pages/recruiter/CompanyProfile';
import CandidateSearch from './pages/recruiter/CandidateSearch';
import CandidateDetail from './pages/recruiter/CandidateDetail';
import SavedCandidates from './pages/recruiter/SavedCandidates';
import RecruiterJobs from './pages/recruiter/Jobs';
import JobDetail from './pages/recruiter/JobDetail';
import Team from './pages/recruiter/Team';

import AdminDashboard from './pages/admin/Dashboard';
import AdminAnalytics from './pages/admin/Analytics';
import VerificationQueue from './pages/admin/VerificationQueue';
import VerificationCaseDetail from './pages/admin/VerificationCaseDetail';
import AdminUsers from './pages/admin/Users';
import AdminCompanies from './pages/admin/Companies';
import AdminReports from './pages/admin/Reports';
import AdminCvs from './pages/admin/Cvs';
import AdminRules from './pages/admin/Rules';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute roles={['CANDIDATE']}>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/onboarding"
        element={
          <ProtectedRoute roles={['RECRUITER']}>
            <CompanyOnboarding />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Candidate */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv"
          element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <CvAts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <VerificationCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preview"
          element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <ProfilePreview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <CandidateJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <PrivacySettings />
            </ProtectedRoute>
          }
        />
        <Route path="/messages" element={<Messages />} />
        <Route
          path="/applications"
          element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <CandidateApplications />
            </ProtectedRoute>
          }
        />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<AccountSettings />} />

        {/* Recruiter */}
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/search"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <CandidateSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/candidates/:id"
          element={
            <ProtectedRoute roles={['RECRUITER', 'ADMIN']}>
              <CandidateDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/saved"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <SavedCandidates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <RecruiterJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs/:id"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <JobDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/company"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <CompanyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/team"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/messages"
          element={
            <ProtectedRoute roles={['RECRUITER']}>
              <Messages />
            </ProtectedRoute>
          }
        />

        {/* Admin / verification officer */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN', 'VERIFICATION_OFFICER']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verification"
          element={
            <ProtectedRoute roles={['ADMIN', 'VERIFICATION_OFFICER']}>
              <VerificationQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verification/:id"
          element={
            <ProtectedRoute roles={['ADMIN', 'VERIFICATION_OFFICER']}>
              <VerificationCaseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute roles={['ADMIN', 'VERIFICATION_OFFICER']}>
              <AdminCompanies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={['ADMIN', 'VERIFICATION_OFFICER']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cvs"
          element={
            <ProtectedRoute roles={['ADMIN', 'VERIFICATION_OFFICER']}>
              <AdminCvs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rules"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminRules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
