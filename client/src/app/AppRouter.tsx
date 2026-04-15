import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import AuthLayout from '../components/layout/AuthLayout'
import FieldLayout from '../components/layout/FieldLayout'
import RoleGate from '../components/routing/RoleGate'
import DashboardPage from '../routes/DashboardPage'
import LoginPage from '../routes/LoginPage'
import NotFoundPage from '../routes/NotFoundPage'
import SurveyDataPage from '../routes/SurveyDataPage'
import SurveyFormPage from '../routes/SurveyFormPage'
import SurveyHistoryPage from '../routes/SurveyHistoryPage'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RoleGate />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route element={<RoleGate allowedRoles={['ADMIN']} redirectTo="/dashboard" />}>
        <Route element={<AdminLayout />}>
          <Route path="/surveys/data" element={<SurveyDataPage />} />
        </Route>
      </Route>

      <Route element={<RoleGate allowedRoles={['EMPLOYEE']} redirectTo="/dashboard" />}>
        <Route element={<FieldLayout />}>
          <Route path="/surveys/new" element={<SurveyFormPage />} />
          <Route path="/surveys/new/:templateId" element={<SurveyFormPage />} />
          <Route path="/surveys/history" element={<SurveyHistoryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
