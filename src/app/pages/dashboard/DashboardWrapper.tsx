import { FC, useState, useEffect, useMemo } from 'react'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { KTIcon } from '../../../_metronic/helpers'
import { useAuth } from '../../modules/auth'
import Chart from 'react-apexcharts'
import { Link } from 'react-router-dom'

interface QuickShortcut {
  key: string
  title: string
  subtitle: string
  icon: string
  path: string
  badgeText?: string
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'dark'
}

const ALL_QUICK_SHORTCUTS: QuickShortcut[] = [
  {
    key: 'users',
    title: 'User Management',
    subtitle: 'Roles, RBAC & permissions',
    icon: 'profile-user',
    path: '/users',
    badgeText: 'Admin',
    color: 'primary'
  },
  {
    key: 'store',
    title: 'Store & Inventory',
    subtitle: 'Raw materials & GRN logs',
    icon: 'archive',
    path: '/store',
    badgeText: 'Stock',
    color: 'success'
  },
  {
    key: 'purchase',
    title: 'Purchase Requisitions',
    subtitle: 'Track PRs, POs & quotes',
    icon: 'basket',
    path: '/purchase',
    badgeText: 'Orders',
    color: 'warning'
  },
  {
    key: 'qc',
    title: 'QC Test Reports',
    subtitle: 'Scale inspection test logs',
    icon: 'shield-tick',
    path: '/qc',
    badgeText: 'QA/QC',
    color: 'info'
  },
  {
    key: 'calibration',
    title: 'Calibration Lab',
    subtitle: 'ISO 17025 certificates',
    icon: 'award',
    path: '/calibration',
    badgeText: 'ISO 17025',
    color: 'primary'
  },
  {
    key: 'amc',
    title: 'Service & AMC',
    subtitle: 'AMC contracts & service',
    icon: 'wrench',
    path: '/amc',
    badgeText: 'Service',
    color: 'danger'
  },
  {
    key: 'oif',
    title: 'Order Intimation (OIF)',
    subtitle: 'Order intimations & dispatch',
    icon: 'briefcase',
    path: '/oif',
    color: 'dark'
  },
  {
    key: 'electronics',
    title: 'Electronics Material',
    subtitle: 'PCB boards & load cells',
    icon: 'cpu',
    path: '/electronics',
    color: 'info'
  }
]

const DashboardPage: FC = () => {
  const { currentUser } = useAuth()
  const [activeBranch, setActiveBranch] = useState<string>(() => {
    return localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
  })

  useEffect(() => {
    const handleBranchChange = () => {
      setActiveBranch(localStorage.getItem('active_branch') || 'Vasai Factory (HQ)')
    }
    window.addEventListener('branch_changed', handleBranchChange)
    return () => {
      window.removeEventListener('branch_changed', handleBranchChange)
    }
  }, [])

  // Check permission helper
  const hasPermission = (moduleKey: string) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') return true
    const perms = currentUser.permissions || []
    return perms.includes(moduleKey)
  }

  // Filter allowed shortcuts
  const userShortcuts = useMemo(() => {
    return ALL_QUICK_SHORTCUTS.filter((s) => hasPermission(s.key))
  }, [currentUser])

  // Donut Chart - Brand Allocation
  const donutChartOptions = {
    chart: { type: 'donut' as const, fontFamily: 'inherit' },
    labels: ['Archerchem', 'Radwag', 'Tapson', 'ADRA'],
    colors: ['#4f46e5', '#0284c7', '#f59e0b', '#8b5cf6'],
    stroke: { show: true, width: 2, colors: ['#ffffff'] },
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Stock',
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              formatter: () => '₹2.45Cr'
            }
          }
        }
      }
    },
    tooltip: { style: { fontSize: '12px' } }
  }

  const donutChartSeries = [85.4, 62.1, 48.8, 32.5]

  // Line Chart - Scale Calibration Accuracy Trend
  const lineChartOptions = {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      fontFamily: 'inherit',
      sparkline: { enabled: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 3.5 },
    colors: ['#10b981'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 600 } }
    },
    yaxis: {
      min: 99.7,
      max: 100.0,
      labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 600 } }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } }
    }
  }

  const lineChartSeries = [
    {
      name: 'Accuracy %',
      data: [99.85, 99.91, 99.88, 99.96, 99.94, 99.98, 99.96]
    }
  ]

  // Recent Scale Inspections Table
  const recentInspections = [
    { model: 'AE-1000 Micro Balance', serial: 'AC-98721', std: '500.00g', obs: '500.01g', dev: '+0.01g', accuracy: '99.998%', status: 'Passed', badge: 'success' },
    { model: 'Radwag WPS-500', serial: 'RW-22104', std: '250.00g', obs: '249.98g', dev: '-0.02g', accuracy: '99.992%', status: 'Passed', badge: 'success' },
    { model: 'Tapson TP-2000', serial: 'TP-38012', std: '1000.00g', obs: '1000.35g', dev: '+0.35g', accuracy: '99.965%', status: 'Passed', badge: 'success' },
    { model: 'ADRA AD-3000', serial: 'AD-15093', std: '1500.00g', obs: '1500.82g', dev: '+0.82g', accuracy: '99.945%', status: 'Tolerance Warning', badge: 'warning' },
    { model: 'Archerchem AE-5000', serial: 'AC-98944', std: '2000.00g', obs: '2000.04g', dev: '+0.04g', accuracy: '99.998%', status: 'Passed', badge: 'success' }
  ]

  // System Live Activity Log
  const activityLogs = [
    { time: '10 mins ago', type: 'GRN Received', title: 'Vasai Store received 50 Pcs Radwag Load Cell Sensors.', icon: 'archive', color: 'success' },
    { time: '25 mins ago', type: 'PR Approval', title: 'PR-2026-042 (Micro IC Chips) approved by Management.', icon: 'basket', color: 'primary' },
    { time: '1 hour ago', type: 'QC Certified', title: 'QC Inspection Certificate issued for Scale AE-1000.', icon: 'shield-tick', color: 'info' },
    { time: '2 hours ago', type: 'User Added', title: 'New Store Manager account (store866@gmail.com) activated.', icon: 'profile-user', color: 'warning' }
  ]

  return (
    <div className='d-flex flex-column gap-7'>

      {/* ══ 1. HERO HEADER BANNER (Gradient & Executive Summary) ══ */}
      <div
        className='card border-0 rounded-4 shadow-sm position-relative overflow-hidden'
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)',
          color: '#ffffff'
        }}
      >
        {/* Glow Effects */}
        <div
          className='position-absolute rounded-circle pointer-events-none'
          style={{
            width: '400px',
            height: '400px',
            top: '-100px',
            right: '-50px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 0
          }}
        />

        <div className='card-body p-8 p-md-10 position-relative' style={{ zIndex: 1 }}>
          <div className='d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-6'>
            {/* Left Content */}
            <div className='d-flex flex-column gap-3'>
              <div className='d-flex flex-wrap align-items-center gap-3'>
                <span className='badge bg-white bg-opacity-20 text-white px-3.5 py-2 rounded-pill fs-7 fw-bold shadow-sm'>
                  ✨ Executive Dashboard
                </span>
                <span className='badge bg-success text-white px-3 py-1.5 rounded-pill fs-8 fw-bolder text-uppercase'>
                  Role: {currentUser?.role?.toUpperCase() || 'ADMIN'}
                </span>
                {currentUser?.department && (
                  <span className='badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-1.5 rounded-pill fs-8 fw-bold'>
                    Dept: {currentUser.department}
                  </span>
                )}
              </div>

              <h1 className='fs-2hx fw-extrabold text-white mb-0 tracking-tight'>
                Welcome back, {currentUser?.name || 'Administrator'} 👋
              </h1>

              <p className='text-white text-opacity-80 fw-semibold fs-6 mb-0' style={{ maxWidth: '650px', lineHeight: 1.6 }}>
                Archerchem Instruments Enterprise Control Hub. Real-time telemetry for weighing scale calibrations, inventory SKU movements, and multi-tenant access controls.
              </p>
            </div>

            {/* Right Status Pill Badges & Actions */}
            <div className='d-flex flex-column align-items-start align-items-lg-end gap-3'>
              <div className='bg-white bg-opacity-10 border border-white border-opacity-20 rounded-4 p-4 d-flex align-items-center gap-4 shadow-sm'>
                <div className='p-3 bg-primary bg-opacity-30 rounded-circle'>
                  <KTIcon iconName='geolocation' className='fs-1 text-cyan' />
                </div>
                <div className='d-flex flex-column'>
                  <span className='text-white text-opacity-60 fs-8 fw-semibold'>Active Branch Node</span>
                  <span className='text-white fw-bolder fs-6'>{activeBranch}</span>
                </div>
              </div>

              <div className='d-flex align-items-center gap-2'>
                {hasPermission('users') && (
                  <Link to='/users' className='btn btn-sm btn-light-primary fw-bold d-flex align-items-center gap-2 shadow-sm'>
                    <KTIcon iconName='plus' className='fs-3' /> Add User
                  </Link>
                )}
                {hasPermission('store') && (
                  <Link to='/store' className='btn btn-sm btn-primary fw-bold d-flex align-items-center gap-2 shadow-sm'>
                    <KTIcon iconName='archive' className='fs-3' /> Store Portal
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 2. TOP METRIC STAT CARDS (4 Vibrant KPI Cards) ══ */}
      <div className='row g-6'>
        {/* Card 1: Total Stock Valuation */}
        <div className='col-12 col-sm-6 col-xl-3'>
          <div className='card card-flush h-100 border-0 shadow-sm bg-body hover-elevation-2 transition-all'>
            <div className='card-body p-6 d-flex align-items-center justify-content-between'>
              <div className='d-flex flex-column'>
                <span className='text-gray-500 fw-bold fs-7 mb-1'>Total Stock Valuation</span>
                <span className='fs-2hx fw-extrabold text-gray-900 lh-1 mb-2'>₹2.45 Cr</span>
                <div className='d-flex align-items-center gap-1 text-success fs-8 fw-bold'>
                  <KTIcon iconName='arrow-up' className='fs-6 text-success' />
                  <span>+14.2% vs last month</span>
                </div>
              </div>

              <div className='symbol symbol-55px'>
                <div className='symbol-label bg-light-primary rounded-4 text-primary'>
                  <KTIcon iconName='bank' className='fs-2x' />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Active Orders / OIF */}
        <div className='col-12 col-sm-6 col-xl-3'>
          <div className='card card-flush h-100 border-0 shadow-sm bg-body hover-elevation-2 transition-all'>
            <div className='card-body p-6 d-flex align-items-center justify-content-between'>
              <div className='d-flex flex-column'>
                <span className='text-gray-500 fw-bold fs-7 mb-1'>Active OIF Orders</span>
                <span className='fs-2hx fw-extrabold text-gray-900 lh-1 mb-2'>148 Orders</span>
                <div className='d-flex align-items-center gap-1 text-primary fs-8 fw-bold'>
                  <KTIcon iconName='check-circle' className='fs-6 text-primary' />
                  <span>96% Fulfillment Rate</span>
                </div>
              </div>

              <div className='symbol symbol-55px'>
                <div className='symbol-label bg-light-info rounded-4 text-info'>
                  <KTIcon iconName='briefcase' className='fs-2x' />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Calibration Certificates */}
        <div className='col-12 col-sm-6 col-xl-3'>
          <div className='card card-flush h-100 border-0 shadow-sm bg-body hover-elevation-2 transition-all'>
            <div className='card-body p-6 d-flex align-items-center justify-content-between'>
              <div className='d-flex flex-column'>
                <span className='text-gray-500 fw-bold fs-7 mb-1'>Calibration Certs</span>
                <span className='fs-2hx fw-extrabold text-gray-900 lh-1 mb-2'>342 Certs</span>
                <div className='d-flex align-items-center gap-1 text-success fs-8 fw-bold'>
                  <KTIcon iconName='shield-tick' className='fs-6 text-success' />
                  <span>ISO 17025 Compliant</span>
                </div>
              </div>

              <div className='symbol symbol-55px'>
                <div className='symbol-label bg-light-success rounded-4 text-success'>
                  <KTIcon iconName='award' className='fs-2x' />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Active System Users */}
        <div className='col-12 col-sm-6 col-xl-3'>
          <div className='card card-flush h-100 border-0 shadow-sm bg-body hover-elevation-2 transition-all'>
            <div className='card-body p-6 d-flex align-items-center justify-content-between'>
              <div className='d-flex flex-column'>
                <span className='text-gray-500 fw-bold fs-7 mb-1'>Tenant Users</span>
                <span className='fs-2hx fw-extrabold text-gray-900 lh-1 mb-2'>28 Users</span>
                <div className='d-flex align-items-center gap-1 text-warning fs-8 fw-bold'>
                  <KTIcon iconName='profile-user' className='fs-6 text-warning' />
                  <span>6 Preset Access Roles</span>
                </div>
              </div>

              <div className='symbol symbol-55px'>
                <div className='symbol-label bg-light-warning rounded-4 text-warning'>
                  <KTIcon iconName='people' className='fs-2x' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 3. QUICK SHORTCUTS TOOLBAR (Module Access Links) ══ */}
      <div className='card card-flush shadow-sm border-0'>
        <div className='card-header pt-6 pb-2 border-0'>
          <div className='card-title d-flex align-items-center gap-3'>
            <span className='badge badge-light-primary p-3 rounded-circle'>
              <KTIcon iconName='element-11' className='fs-2' />
            </span>
            <div className='d-flex flex-column'>
              <h3 className='fw-bolder text-gray-900 fs-4 mb-0'>Quick Module Shortcuts</h3>
              <span className='text-muted fs-7 fw-semibold'>Instant one-click access to authorized modules</span>
            </div>
          </div>
        </div>

        <div className='card-body pt-2 pb-7'>
          <div className='row g-4'>
            {userShortcuts.map((item) => (
              <div key={item.key} className='col-12 col-sm-6 col-md-4 col-xl-3'>
                <Link
                  to={item.path}
                  className='card card-bordered h-100 p-5 text-decoration-none shadow-xs hover-elevation-3 transition-all border-dashed border-gray-300 bg-hover-light'
                  style={{ transition: 'all 0.22s ease' }}
                >
                  <div className='d-flex align-items-center justify-content-between mb-4'>
                    <span className={`badge badge-light-${item.color} p-3 rounded-3`}>
                      <KTIcon iconName={item.icon} className='fs-2hx' />
                    </span>

                    {item.badgeText && (
                      <span className={`badge badge-light-${item.color} fw-bolder fs-8 px-2.5 py-1`}>
                        {item.badgeText}
                      </span>
                    )}
                  </div>

                  <div className='d-flex flex-column'>
                    <span className='fs-6 fw-bolder text-gray-900 text-hover-primary mb-1 d-flex align-items-center justify-content-between'>
                      {item.title}
                      <KTIcon iconName='arrow-right' className='fs-4 text-gray-400 ms-1' />
                    </span>
                    <span className='fs-8 text-gray-500 fw-semibold line-clamp-2'>
                      {item.subtitle}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 4. MAIN ANALYTICS SECTION (Calibration Charts & Inventory Split) ══ */}
      <div className='row g-6'>
        {/* Scale Calibration Tracker */}
        <div className='col-12 col-xl-8'>
          <div className='card card-flush h-xl-100 border-0 shadow-sm bg-body'>
            <div className='card-header pt-7 pb-2 border-0'>
              <div className='card-title d-flex flex-column'>
                <span className='card-label fw-extrabold text-gray-900 fs-3 mb-1'>
                  Scale Calibration Accuracy & Telemetry
                </span>
                <span className='text-gray-500 fw-semibold fs-7'>
                  Monthly precision tracking across micro balances (Tolerance ±0.05g to ±0.5g)
                </span>
              </div>
              <div className='card-toolbar'>
                <span className='badge badge-light-success fw-bolder fs-7 px-3 py-2'>
                  <KTIcon iconName='shield-tick' className='fs-5 text-success me-1' />
                  Avg Accuracy: 99.96%
                </span>
              </div>
            </div>

            <div className='card-body pt-3'>
              {/* Chart */}
              <div className='mb-6'>
                <Chart options={lineChartOptions} series={lineChartSeries} type='area' height={230} />
              </div>

              {/* High-Precision Scale Inspections Table */}
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed gs-0 gy-3 fs-7'>
                  <thead>
                    <tr className='fw-bolder text-muted border-bottom-0 text-uppercase fs-8'>
                      <th className='min-w-150px'>Scale Model</th>
                      <th className='min-w-100px'>Serial No</th>
                      <th className='min-w-100px'>Std Weight</th>
                      <th className='min-w-100px'>Observed</th>
                      <th className='min-w-80px'>Dev</th>
                      <th className='min-w-100px'>Accuracy</th>
                      <th className='text-end min-w-100px'>Status</th>
                    </tr>
                  </thead>
                  <tbody className='text-gray-700 fw-semibold'>
                    {recentInspections.map((row, idx) => (
                      <tr key={idx}>
                        <td className='fw-bold text-gray-900 d-flex align-items-center gap-2'>
                          <KTIcon iconName='cpu' className='fs-4 text-primary' />
                          {row.model}
                        </td>
                        <td className='text-muted fs-8'>{row.serial}</td>
                        <td className='text-gray-800 fw-bold'>{row.std}</td>
                        <td className='text-gray-800 fw-bold'>{row.obs}</td>
                        <td className={`fw-extrabold text-${row.badge}`}>{row.dev}</td>
                        <td className='fw-extrabold text-gray-900'>{row.accuracy}</td>
                        <td className='text-end'>
                          <span className={`badge badge-light-${row.badge} fw-bold fs-8 px-3 py-1.5`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Inventory Allocation Donut */}
        <div className='col-12 col-xl-4'>
          <div className='card card-flush h-xl-100 border-0 shadow-sm bg-body'>
            <div className='card-header pt-7 pb-2 border-0'>
              <div className='card-title d-flex flex-column'>
                <span className='card-label fw-extrabold text-gray-900 fs-3 mb-1'>
                  Brand Stock Allocation
                </span>
                <span className='text-gray-500 fw-semibold fs-7'>
                  Valuation split by brand manufacturers
                </span>
              </div>
            </div>

            <div className='card-body pt-3 d-flex flex-column justify-content-between'>
              <div className='d-flex flex-center position-relative mb-6 my-auto'>
                <Chart options={donutChartOptions} series={donutChartSeries} type='donut' height={250} />
              </div>

              {/* Brand Rows */}
              <div className='d-flex flex-column gap-3'>
                <div className='d-flex align-items-center justify-content-between p-3 bg-light rounded-3'>
                  <div className='d-flex align-items-center gap-2.5'>
                    <span className='w-12px h-12px rounded-circle' style={{ backgroundColor: '#4f46e5' }}></span>
                    <span className='fs-7 fw-bold text-gray-800'>Archerchem</span>
                  </div>
                  <span className='fs-7 fw-extrabold text-gray-900'>₹85.4L (37%)</span>
                </div>

                <div className='d-flex align-items-center justify-content-between p-3 bg-light rounded-3'>
                  <div className='d-flex align-items-center gap-2.5'>
                    <span className='w-12px h-12px rounded-circle' style={{ backgroundColor: '#0284c7' }}></span>
                    <span className='fs-7 fw-bold text-gray-800'>Radwag</span>
                  </div>
                  <span className='fs-7 fw-extrabold text-gray-900'>₹62.1L (27%)</span>
                </div>

                <div className='d-flex align-items-center justify-content-between p-3 bg-light rounded-3'>
                  <div className='d-flex align-items-center gap-2.5'>
                    <span className='w-12px h-12px rounded-circle' style={{ backgroundColor: '#f59e0b' }}></span>
                    <span className='fs-7 fw-bold text-gray-800'>Tapson</span>
                  </div>
                  <span className='fs-7 fw-extrabold text-gray-900'>₹48.8L (21%)</span>
                </div>

                <div className='d-flex align-items-center justify-content-between p-3 bg-light rounded-3'>
                  <div className='d-flex align-items-center gap-2.5'>
                    <span className='w-12px h-12px rounded-circle' style={{ backgroundColor: '#8b5cf6' }}></span>
                    <span className='fs-7 fw-bold text-gray-800'>ADRA</span>
                  </div>
                  <span className='fs-7 fw-extrabold text-gray-900'>₹32.5L (15%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 5. SYSTEM ACTIVITY LOGS TIMELINE ══ */}
      <div className='card card-flush shadow-sm border-0'>
        <div className='card-header pt-6 pb-2 border-0'>
          <div className='card-title d-flex align-items-center gap-3'>
            <span className='badge badge-light-success p-3 rounded-circle'>
              <KTIcon iconName='time' className='fs-2 text-success' />
            </span>
            <div className='d-flex flex-column'>
              <h3 className='fw-bolder text-gray-900 fs-4 mb-0'>Real-time System Activity Stream</h3>
              <span className='text-muted fs-7 fw-semibold'>Live audit log events across tenant branches</span>
            </div>
          </div>
        </div>

        <div className='card-body pt-3 pb-7'>
          <div className='row g-6'>
            {activityLogs.map((log, index) => (
              <div key={index} className='col-12 col-md-6'>
                <div className='d-flex align-items-start gap-4 p-4 rounded-3 bg-light border border-dashed border-gray-300'>
                  <span className={`badge badge-light-${log.color} p-3 rounded-3 mt-1`}>
                    <KTIcon iconName={log.icon} className='fs-2' />
                  </span>
                  <div className='d-flex flex-column flex-grow-1'>
                    <div className='d-flex align-items-center justify-content-between mb-1'>
                      <span className={`badge badge-light-${log.color} fw-bold fs-8`}>
                        {log.type}
                      </span>
                      <span className='text-muted fs-8 fw-semibold'>{log.time}</span>
                    </div>
                    <span className='text-gray-800 fw-bold fs-7 line-clamp-2'>
                      {log.title}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
