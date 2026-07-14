import { FC } from 'react'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../../modules/auth'

const DashboardPage: FC = () => {
  const { currentUser } = useAuth()

  return (
    <div className='row g-5 g-xl-10'>
      {/* Welcome Card */}
      <div className='col-md-12 col-lg-12 col-xl-12 mb-md-5 mb-xl-10'>
        <div className='card card-flush h-md-100' style={{ background: 'linear-gradient(90deg, #1a237e 0%, #128c7e 100%)' }}>
          <div className='card-body d-flex flex-column justify-content-between mt-9 bgi-no-repeat bgi-size-cover bgi-position-y-bottom' style={{ position: 'relative' }}>
            <div className='mb-10'>
              <h3 className='fs-2hx fw-bold text-white mb-2lh-xxl'>
                Welcome Back, {currentUser?.name || 'Administrator'}!
              </h3>
              <p className='text-white opacity-75 fw-semibold fs-5'>
                This is your clean, production-ready Multi-Tenant Admin Dashboard. 
                Use this boilerplate to start building your custom modules, charts, and system settings.
              </p>
            </div>
            
            <div className='d-flex align-items-center gap-3'>
              <span className='badge badge-light-primary fw-bold px-4 py-3 fs-7'>
                Role: {currentUser?.role || 'Admin'}
              </span>
              <span className='badge badge-light-success fw-bold px-4 py-3 fs-7'>
                Status: Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Generic KPI Cards */}
      <div className='col-md-4 mb-5'>
        <div className='card card-flush h-100 border-0 bg-body shadow-sm'>
          <div className='card-header pt-5 px-6 border-0'>
            <div className='card-title d-flex flex-column'>
              <div className='d-flex align-items-center mb-1 gap-2'>
                <span className='fs-2hx fw-bold text-gray-900 lh-1 ls-n2'>Active</span>
              </div>
              <span className='text-gray-500 pt-1 fw-semibold fs-7'>System Status</span>
            </div>
          </div>
          <div className='card-body d-flex align-items-end pt-0 pb-5 px-6'>
            <div className='d-flex flex-column flex-grow-1'>
              <span className='text-gray-400 fw-semibold fs-8'>All database schemas are online.</span>
            </div>
            <div className='symbol symbol-40px'>
              <div className='symbol-label bg-light-success'>
                <i className='bi bi-cpu fs-2 text-success'></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-md-4 mb-5'>
        <div className='card card-flush h-100 border-0 bg-body shadow-sm'>
          <div className='card-header pt-5 px-6 border-0'>
            <div className='card-title d-flex flex-column'>
              <div className='d-flex align-items-center mb-1 gap-2'>
                <span className='fs-2hx fw-bold text-gray-900 lh-1 ls-n2'>Schema-Isolation</span>
              </div>
              <span className='text-gray-500 pt-1 fw-semibold fs-7'>Database Pattern</span>
            </div>
          </div>
          <div className='card-body d-flex align-items-end pt-0 pb-5 px-6'>
            <div className='d-flex flex-column flex-grow-1'>
              <span className='text-gray-400 fw-semibold fs-8'>Using separate schema-per-tenant.</span>
            </div>
            <div className='symbol symbol-40px'>
              <div className='symbol-label bg-light-primary'>
                <i className='bi bi-database fs-2 text-primary'></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-md-4 mb-5'>
        <div className='card card-flush h-100 border-0 bg-body shadow-sm'>
          <div className='card-header pt-5 px-6 border-0'>
            <div className='card-title d-flex flex-column'>
              <div className='d-flex align-items-center mb-1 gap-2'>
                <span className='fs-2hx fw-bold text-gray-900 lh-1 ls-n2'>JWT</span>
              </div>
              <span className='text-gray-500 pt-1 fw-semibold fs-7'>Authentication</span>
            </div>
          </div>
          <div className='card-body d-flex align-items-end pt-0 pb-5 px-6'>
            <div className='d-flex flex-column flex-grow-1'>
              <span className='text-gray-400 fw-semibold fs-8'>Stateless secure user sessions.</span>
            </div>
            <div className='symbol symbol-40px'>
              <div className='symbol-label bg-light-warning'>
                <i className='bi bi-shield-lock fs-2 text-warning'></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const DashboardWrapper: FC = () => {
  const intl = useIntl()
  return (
    <>
      <PageTitle breadcrumbs={[]}>{intl.formatMessage({ id: 'MENU.DASHBOARD' })}</PageTitle>
      <Content>
        <DashboardPage />
      </Content>
    </>
  )
}

export { DashboardWrapper }
