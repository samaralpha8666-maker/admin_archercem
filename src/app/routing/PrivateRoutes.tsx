import { lazy, FC, Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import { useAuth } from '../modules/auth'
import { TenantsPageWrapper } from '../modules/tenants/TenantsPage'
import { DocumentsPageWrapper } from '../modules/documents/DocumentsPage'
import { ProfilePageWrapper } from '../modules/settings/ProfilePage'

import { UserManagementPageWrapper } from '../modules/settings/UserManagementPage'

const BrandsPage = lazy(() => import('../modules/archerchem/BrandsPage'))
const OIFPage = lazy(() => import('../modules/archerchem/OIFPage'))
const ElectronicsPage = lazy(() => import('../modules/archerchem/ElectronicsPage'))
const QCPage = lazy(() => import('../modules/archerchem/QCPage'))
const CalibrationPage = lazy(() => import('../modules/archerchem/CalibrationPage'))
const AMCPage = lazy(() => import('../modules/archerchem/AMCPage'))
const PurchasePage = lazy(() => import('../modules/archerchem/PurchasePage'))
const StorePage = lazy(() => import('../modules/archerchem/StorePage'))
const ReportsPage = lazy(() => import('../modules/archerchem/ReportsPage'))
const OIMLPage = lazy(() => import('../modules/archerchem/OIMLPage'))
const StampingPage = lazy(() => import('../modules/archerchem/StampingPage'))
const NotificationsPage = lazy(() => import('../modules/archerchem/NotificationsPage'))

const PermissionGuard: FC<{ moduleKey: string; children: React.ReactNode }> = ({ moduleKey, children }) => {
  const { currentUser } = useAuth()
  if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') {
    return <>{children}</>
  }
  if (!currentUser?.permissions || currentUser.permissions.includes(moduleKey) || ['reports', 'oiml', 'stamping', 'notifications'].includes(moduleKey)) {
    return <>{children}</>
  }
  return <Navigate to='/dashboard' replace />
}

const PrivateRoutes = () => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <Routes>
      <Route element={<MasterLayout />}>
        {/* Redirect to dashboard or tenants after login */}
        <Route path='auth/*' element={<Navigate to={isSuperAdmin ? '/tenants' : '/dashboard'} />} />

        <Route
          path='dashboard'
          element={<DashboardWrapper />}
        />

        {isSuperAdmin ? (
          <Route path='tenants' element={<TenantsPageWrapper />} />
        ) : (
          <>
            <Route path='documents' element={<DocumentsPageWrapper />} />
            
            {/* Archerchem ERP Modules */}
            <Route
              path='brands'
              element={
                <PermissionGuard moduleKey='brands'>
                  <SuspensedView>
                    <BrandsPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='oif/*'
              element={
                <PermissionGuard moduleKey='oif'>
                  <SuspensedView>
                    <OIFPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='electronics'
              element={
                <PermissionGuard moduleKey='electronics'>
                  <SuspensedView>
                    <ElectronicsPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='qc/*'
              element={
                <PermissionGuard moduleKey='qc'>
                  <SuspensedView>
                    <QCPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='calibration/*'
              element={
                <PermissionGuard moduleKey='calibration'>
                  <SuspensedView>
                    <CalibrationPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='amc/*'
              element={
                <PermissionGuard moduleKey='amc'>
                  <SuspensedView>
                    <AMCPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='purchase/*'
              element={
                <PermissionGuard moduleKey='purchase'>
                  <SuspensedView>
                    <PurchasePage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='store/*'
              element={
                <PermissionGuard moduleKey='store'>
                  <SuspensedView>
                    <StorePage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='users'
              element={
                <PermissionGuard moduleKey='users'>
                  <UserManagementPageWrapper />
                </PermissionGuard>
              }
            />
            <Route
              path='reports'
              element={
                <PermissionGuard moduleKey='reports'>
                  <SuspensedView>
                    <ReportsPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='oiml'
              element={
                <PermissionGuard moduleKey='oiml'>
                  <SuspensedView>
                    <OIMLPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='stamping'
              element={
                <PermissionGuard moduleKey='stamping'>
                  <SuspensedView>
                    <StampingPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
            <Route
              path='notifications'
              element={
                <PermissionGuard moduleKey='notifications'>
                  <SuspensedView>
                    <NotificationsPage />
                  </SuspensedView>
                </PermissionGuard>
              }
            />
          </>
        )}

        <Route path='settings/profile' element={<ProfilePageWrapper />} />

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
