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

const BrandsPage = lazy(() => import('../modules/archerchem/BrandsPage'))
const OIFPage = lazy(() => import('../modules/archerchem/OIFPage'))
const ElectronicsPage = lazy(() => import('../modules/archerchem/ElectronicsPage'))
const QCPage = lazy(() => import('../modules/archerchem/QCPage'))
const CalibrationPage = lazy(() => import('../modules/archerchem/CalibrationPage'))
const AMCPage = lazy(() => import('../modules/archerchem/AMCPage'))
const PurchasePage = lazy(() => import('../modules/archerchem/PurchasePage'))
const StorePage = lazy(() => import('../modules/archerchem/StorePage'))

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
                <SuspensedView>
                  <BrandsPage />
                </SuspensedView>
              }
            />
            <Route
              path='oif/*'
              element={
                <SuspensedView>
                  <OIFPage />
                </SuspensedView>
              }
            />
            <Route
              path='electronics'
              element={
                <SuspensedView>
                  <ElectronicsPage />
                </SuspensedView>
              }
            />
            <Route
              path='qc/*'
              element={
                <SuspensedView>
                  <QCPage />
                </SuspensedView>
              }
            />
            <Route
              path='calibration/*'
              element={
                <SuspensedView>
                  <CalibrationPage />
                </SuspensedView>
              }
            />
            <Route
              path='amc/*'
              element={
                <SuspensedView>
                  <AMCPage />
                </SuspensedView>
              }
            />
            <Route
              path='purchase/*'
              element={
                <SuspensedView>
                  <PurchasePage />
                </SuspensedView>
              }
            />
            <Route
              path='store/*'
              element={
                <SuspensedView>
                  <StorePage />
                </SuspensedView>
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
