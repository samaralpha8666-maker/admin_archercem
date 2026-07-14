import { lazy, FC, Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import { useAuth } from '../modules/auth'

const PrivateRoutes = () => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <Routes>
      <Route element={<MasterLayout />}>
        {/* Redirect to dashboard after login */}
        <Route path='auth/*' element={<Navigate to='/dashboard' />} />

        <Route
          path='dashboard'
          element={<DashboardWrapper />}
        />

        {/* Page Not Found Fallback */}
        <Route path='*' element={<Navigate to='/error/404' />} />
      </Route>
    </Routes>
  )
}

const SuspensedView: FC<WithChildren> = ({ children }) => {
  const baseColor = getCSSVariableValue('--bs-primary')
  TopBarProgress.config({
    barColors: {
      '0': baseColor,
    },
    barThickness: 1,
    shadowBlur: 5,
  })
  return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
}

export { PrivateRoutes }
