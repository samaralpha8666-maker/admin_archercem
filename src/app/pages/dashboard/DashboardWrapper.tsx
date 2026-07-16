import { FC, useState, useEffect } from 'react'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../../modules/auth'
import Chart from 'react-apexcharts'
import { Link } from 'react-router-dom'

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

  // ApexCharts config for Brand-wise Stock Donut
  const donutChartOptions = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'inherit',
    },
    labels: ['Archerchem', 'Radwag', 'Tapson', 'ADRA'],
    colors: ['#3730a3', '#0284c7', '#d97706', '#7c3aed'],
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      style: {
        fontSize: '12px',
      },
    },
  }

  const donutChartSeries = [85.4, 62.1, 48.8, 32.5] // values in Lakhs (total 228.8L ≈ 2.29Cr)

  // ApexCharts config for Weight Matching Accuracy trend
  const lineChartOptions = {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 3 },
    colors: ['#10b981'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#a1a5b7', fontSize: '12px' } }
    },
    yaxis: {
      min: 99.5,
      max: 100.0,
      labels: { style: { colors: '#a1a5b7', fontSize: '12px' } }
    },
    grid: {
      borderColor: '#eff2f5',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } }
    }
  }

  const lineChartSeries = [
    {
      name: 'Accuracy %',
      data: [99.88, 99.92, 99.85, 99.97, 99.94, 99.99, 99.96]
    }
  ]

  // Recent Weight Matching Checks data
  const weightChecks = [
    { model: 'AE-1000', serial: 'AC-98721', std: '500g', obs: '500.02g', dev: '+0.02g', accuracy: '99.996%', status: 'Passed', badge: 'success' },
    { model: 'WPS-500', serial: 'RW-22104', std: '250g', obs: '249.98g', dev: '-0.02g', accuracy: '99.992%', status: 'Passed', badge: 'success' },
    { model: 'TP-2000', serial: 'TP-38012', std: '1000g', obs: '1000.41g', dev: '+0.41g', accuracy: '99.959%', status: 'Passed', badge: 'success' },
    { model: 'AD-3000', serial: 'AD-15093', std: '1500g', obs: '1500.82g', dev: '+0.82g', accuracy: '99.945%', status: 'Fail (Tol ±0.5g)', badge: 'danger' },
    { model: 'AE-5000', serial: 'AC-98944', std: '2000g', obs: '2000.05g', dev: '+0.05g', accuracy: '99.997%', status: 'Passed', badge: 'success' }
  ]

  return (
    <div className='row g-5 g-xl-10'>
      {/* 1. Welcome Card Banner */}
      <div className='col-12 mb-md-5 mb-xl-10'>
        <div className='card card-flush h-md-100 border-0 shadow-sm' style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
          <div className='card-body d-flex flex-column justify-content-between p-10 bgi-no-repeat bgi-size-cover bgi-position-y-bottom'>
            <div className='mb-10'>
              <h3 className='fs-2hx fw-bold text-white mb-3'>
                {currentUser?.school_name || 'Archerchem Instruments'} ERP
              </h3>
              <p className='text-white text-opacity-75 fw-semibold fs-5'>
                Welcome back, {currentUser?.name || 'Administrator'}. This is the central portal for monitoring industrial weighing scales, QC test reports, calibration certificates, and store logistics.
              </p>
            </div>
            
            <div className='d-flex align-items-center gap-3'>
              <span className='badge bg-white bg-opacity-10 text-white fw-bold px-4 py-3 fs-7'>
                Branch: {activeBranch}
              </span>
              <span className='badge bg-success text-white fw-bold px-4 py-3 fs-7'>
                Scale Calibration Node: Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className='col-md-3 mb-5'>
        <div className='card card-flush h-100 border-0 bg-body shadow-sm'>
          <div className='card-body d-flex align-items-center justify-content-between p-6'>
            <div className='d-flex flex-column'>
              <span className='fs-2hx fw-bold text-gray-900 lh-1 ls-n2'>₹2.45Cr</span>
              <span className='text-gray-500 pt-1 fw-bold fs-7'>Total Stock Value</span>
            </div>
            <div className='symbol symbol-50px'>
              <div className='symbol-label bg-light-primary text-primary'>
                <i className='bi bi-coin fs-2x'></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-md-3 mb-5'>
        <div className='card card-flush h-100 border-0 bg-body shadow-sm'>
          <div className='card-body d-flex align-items-center justify-content-between p-6'>
            <div className='d-flex flex-column'>
              <span className='fs-2hx fw-bold text-gray-900 lh-1 ls-n2'>15</span>
              <span className='text-gray-500 pt-1 fw-bold fs-7'>Pending PR</span>
            </div>
            <div className='symbol symbol-50px'>
              <div className='symbol-label bg-light-warning text-warning'>
                <i className='bi bi-cart-check fs-2x'></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-md-3 mb-5'>
        <div className='card card-flush h-100 border-0 bg-body shadow-sm'>
          <div className='card-body d-flex align-items-center justify-content-between p-6'>
            <div className='d-flex flex-column'>
              <span className='fs-2hx fw-bold text-danger lh-1 ls-n2'>12</span>
              <span className='text-gray-500 pt-1 fw-bold fs-7'>Low Stock items</span>
            </div>
            <div className='symbol symbol-50px'>
              <div className='symbol-label bg-light-danger text-danger'>
                <i className='bi bi-exclamation-triangle fs-2x'></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-md-3 mb-5'>
        <div className='card card-flush h-100 border-0 bg-body shadow-sm'>
          <div className='card-body d-flex align-items-center justify-content-between p-6'>
            <div className='d-flex flex-column'>
              <span className='fs-2hx fw-bold text-success lh-1 ls-n2'>142</span>
              <span className='text-gray-500 pt-1 fw-bold fs-7'>Active Cal. Certs</span>
            </div>
            <div className='symbol symbol-50px'>
              <div className='symbol-label bg-light-success text-success'>
                <i className='bi bi-patch-check fs-2x'></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Weight Matching & Calibration Tracker (Main custom widget) */}
      <div className='col-xl-8 mb-5 mb-xl-10'>
        <div className='card card-flush h-xl-100 border-0 bg-body shadow-sm'>
          <div className='card-header pt-7 px-8 border-0'>
            <h3 className='card-title align-items-start flex-column'>
              <span className='card-label fw-bold text-gray-900 fs-3'>Weight Matching & Calibration Analyzer</span>
              <span className='text-gray-500 mt-1 fw-semibold fs-7'>Live monitoring of standard test weight matches vs balance readings</span>
            </h3>
            <div className='card-toolbar'>
              <Link to='/calibration' className='btn btn-light-primary btn-sm fw-bold'>View Certificates</Link>
            </div>
          </div>

          <div className='card-body pt-5 px-8'>
            {/* Chart + Summary row */}
            <div className='row align-items-center mb-6'>
              <div className='col-md-7'>
                <div className='d-flex align-items-center gap-6 mb-5'>
                  <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3 bg-light'>
                    <div className='d-flex align-items-center'>
                      <div className='fs-2 fw-bold text-success'>99.97%</div>
                    </div>
                    <div className='fw-semibold fs-7 text-gray-500'>Avg matching accuracy</div>
                  </div>
                  <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3 bg-light'>
                    <div className='d-flex align-items-center'>
                      <div className='fs-2 fw-bold text-gray-900'>±0.024g</div>
                    </div>
                    <div className='fw-semibold fs-7 text-gray-500'>Avg deviation offset</div>
                  </div>
                </div>
                <Chart options={lineChartOptions} series={lineChartSeries} type='area' height={200} />
              </div>

              <div className='col-md-5'>
                <div className='bg-light-success p-5 rounded d-flex flex-column gap-2 mb-4'>
                  <div className='fw-bold text-success fs-5'>⚖️ Scale Traceability standard</div>
                  <p className='text-gray-700 fs-7 mb-0'>
                    Scales calibrated against standard reference weights trace to **NABL Class F1 / E2 SS Weight Boxes**. Tolerance limits are applied automatically.
                  </p>
                </div>
                <div className='bg-light-danger p-5 rounded d-flex flex-column gap-2'>
                  <div className='fw-bold text-danger fs-5'>⚠️ Calibration Warning</div>
                  <p className='text-gray-700 fs-7 mb-0'>
                    Instrument **Model AD-3000 (Serial AD-15093)** failed matching tolerance limit (Observed error: +0.82g vs standard limit ±0.5g). Maintenance scheduled.
                  </p>
                </div>
              </div>
            </div>

            {/* List of recent checks */}
            <div className='table-responsive'>
              <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
                <thead>
                  <tr className='fw-bold text-muted fs-7 text-uppercase'>
                    <th className='min-w-100px'>Scale Model</th>
                    <th className='min-w-100px'>Serial No</th>
                    <th className='min-w-80px text-end'>Standard Applied</th>
                    <th className='min-w-80px text-end'>Measured Reading</th>
                    <th className='min-w-80px text-end'>Error Offset</th>
                    <th className='min-w-80px text-end'>Match Accuracy</th>
                    <th className='min-w-100px text-end'>Calibration Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weightChecks.map((check, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className='text-gray-900 fw-bold text-hover-primary fs-6'>{check.model}</span>
                      </td>
                      <td>
                        <span className='text-muted fw-semibold fs-7'>{check.serial}</span>
                      </td>
                      <td className='text-end fw-bold text-gray-800'>{check.std}</td>
                      <td className='text-end text-gray-800'>{check.obs}</td>
                      <td className={`text-end fw-bold ${check.dev.startsWith('+') ? 'text-danger' : 'text-primary'}`}>{check.dev}</td>
                      <td className='text-end fw-semibold text-gray-900'>{check.accuracy}</td>
                      <td className='text-end'>
                        <span className={`badge badge-light-${check.badge} fw-bold px-3 py-1`}>{check.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Brand-wise Stock Distribution & Alerts */}
      <div className='col-xl-4 mb-5 mb-xl-10'>
        <div className='card card-flush h-xl-100 border-0 bg-body shadow-sm'>
          <div className='card-header pt-7 px-8 border-0'>
            <h3 className='card-title align-items-start flex-column'>
              <span className='card-label fw-bold text-gray-900 fs-3'>Brand-wise Stock</span>
              <span className='text-gray-500 mt-1 fw-semibold fs-7'>Value distribution across major partners</span>
            </h3>
          </div>

          <div className='card-body pt-5 px-8 d-flex flex-column justify-content-between'>
            {/* Donut Chart Container */}
            <div className='d-flex flex-center position-relative mb-5' style={{ height: '170px' }}>
              <div className='position-absolute d-flex flex-column align-items-center justify-content-center'>
                <span className='fs-2hx fw-bold text-gray-900'>₹2.29Cr</span>
                <span className='text-gray-500 fs-7 fw-semibold'>Total Stocked</span>
              </div>
              <Chart options={donutChartOptions} series={donutChartSeries} type='donut' width='100%' height={170} />
            </div>

            {/* Legend list */}
            <div className='d-flex flex-column gap-3 mb-6'>
              <div className='d-flex align-items-center justify-content-between'>
                <div className='d-flex align-items-center gap-3'>
                  <span className='w-12px h-12px rounded-circle' style={{ backgroundColor: '#3730a3' }}></span>
                  <span className='text-gray-700 fw-bold fs-7'>Archerchem Instruments</span>
                </div>
                <span className='text-gray-900 fw-bold fs-6'>₹85.4L</span>
              </div>
              <div className='d-flex align-items-center justify-content-between'>
                <div className='d-flex align-items-center gap-3'>
                  <span className='w-12px h-12px rounded-circle' style={{ backgroundColor: '#0284c7' }}></span>
                  <span className='text-gray-700 fw-bold fs-7'>Radwag Weighing Systems</span>
                </div>
                <span className='text-gray-900 fw-bold fs-6'>₹62.1L</span>
              </div>
              <div className='d-flex align-items-center justify-content-between'>
                <div className='d-flex align-items-center gap-3'>
                  <span className='w-12px h-12px rounded-circle' style={{ backgroundColor: '#d97706' }}></span>
                  <span className='text-gray-700 fw-bold fs-7'>Tapson Analytics</span>
                </div>
                <span className='text-gray-900 fw-bold fs-6'>₹48.8L</span>
              </div>
              <div className='d-flex align-items-center justify-content-between'>
                <div className='d-flex align-items-center gap-3'>
                  <span className='w-12px h-12px rounded-circle' style={{ backgroundColor: '#7c3aed' }}></span>
                  <span className='text-gray-700 fw-bold fs-7'>ADRA Instruments</span>
                </div>
                <span className='text-gray-900 fw-bold fs-6'>₹32.5L</span>
              </div>
            </div>

            {/* Critical Low Stock banner */}
            <Link to='/store' className='d-flex align-items-center gap-4 bg-light-warning p-4 rounded text-decoration-none'>
              <span className='fs-2'>⚠️</span>
              <div className='d-flex flex-column flex-grow-1'>
                <span className='text-warning-bold fw-bold fs-6'>Critical Low Stock Alert</span>
                <span className='text-gray-600 fs-7'>12 items are currently below safety threshold levels.</span>
              </div>
              <i className='bi bi-chevron-right fs-4 text-gray-400'></i>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Quick Access Menu Grid */}
      <div className='col-12 mb-5 mb-xl-10'>
        <div className='card card-flush border-0 bg-body shadow-sm'>
          <div className='card-header pt-7 px-8 border-0'>
            <h3 className='card-title align-items-start flex-column'>
              <span className='card-label fw-bold text-gray-900 fs-3'>Quick Access ERP Modules</span>
              <span className='text-gray-500 mt-1 fw-semibold fs-7'>Instantly hop into core factory operations</span>
            </h3>
          </div>
          <div className='card-body pt-3 px-8 pb-8'>
            <div className='row row-cols-2 row-cols-sm-3 row-cols-md-5 g-4'>
              <div className='col'>
                <Link to='/brands' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>🏭</span>
                  <span className='fw-bold fs-7'>Brands &amp; branches</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/oif' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>📝</span>
                  <span className='fw-bold fs-7'>Order Intimation (OIF)</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/electronics' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>⚡</span>
                  <span className='fw-bold fs-7'>Electronics BOM</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/qc' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>🧪</span>
                  <span className='fw-bold fs-7'>QC Scale Reports</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/calibration' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>📜</span>
                  <span className='fw-bold fs-7'>Calibration certs</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/amc' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>🛠️</span>
                  <span className='fw-bold fs-7'>Service &amp; AMC</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/purchase' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>🛒</span>
                  <span className='fw-bold fs-7'>Purchase &amp; Requisition</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/store' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>📦</span>
                  <span className='fw-bold fs-7'>Store locations</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/store' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>↔️</span>
                  <span className='fw-bold fs-7'>Inter-branch transfers</span>
                </Link>
              </div>
              <div className='col'>
                <Link to='/settings/profile' className='btn btn-outline btn-outline-dashed btn-outline-default d-flex flex-column align-items-center text-center p-5 rounded-4 h-100 justify-content-center gap-2 border-hover-primary text-gray-800 text-hover-primary'>
                  <span className='fs-2x mb-1'>👤</span>
                  <span className='fw-bold fs-7'>Profile Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Recent Operations Timeline */}
      <div className='col-12 mb-5'>
        <div className='card card-flush border-0 bg-body shadow-sm'>
          <div className='card-header pt-7 px-8 border-0'>
            <h3 className='card-title align-items-start flex-column'>
              <span className='card-label fw-bold text-gray-900 fs-3'>Recent Operations Feed</span>
              <span className='text-gray-500 mt-1 fw-semibold fs-7'>Recent events logs across departments</span>
            </h3>
          </div>
          <div className='card-body pt-5 px-8 pb-8'>
            <div className='timeline-label'>
              <div className='timeline-item d-flex align-items-start mb-6'>
                <div className='timeline-label fw-bold text-gray-800 fs-6 w-75px me-4'>10 mins</div>
                <div className='timeline-badge d-flex align-items-center justify-content-center me-4'>
                  <span className='w-12px h-12px bg-primary rounded-circle border border-white border-2'></span>
                </div>
                <div className='timeline-content text-gray-800 fs-6'>
                  OIF-2026-045 created for Sunset Pharma Malad dispatch by Ramesh Patil.
                </div>
              </div>

              <div className='timeline-item d-flex align-items-start mb-6'>
                <div className='timeline-label fw-bold text-gray-800 fs-6 w-75px me-4'>25 mins</div>
                <div className='timeline-badge d-flex align-items-center justify-content-center me-4'>
                  <span className='w-12px h-12px bg-success rounded-circle border border-white border-2'></span>
                </div>
                <div className='timeline-content text-gray-800 fs-6'>
                  PR-2026-001 (Chip Capacitors 100nf) approved by Store Head Munna Khan.
                </div>
              </div>

              <div className='timeline-item d-flex align-items-start mb-6'>
                <div className='timeline-label fw-bold text-gray-800 fs-6 w-75px me-4'>1 hour</div>
                <div className='timeline-badge d-flex align-items-center justify-content-center me-4'>
                  <span className='w-12px h-12px bg-warning rounded-circle border border-white border-2'></span>
                </div>
                <div className='timeline-content text-gray-800 fs-6 text-muted'>
                  IC Register issued to R&D unit at Vasai Factory — quantity: 2 Pcs.
                </div>
              </div>

              <div className='timeline-item d-flex align-items-start mb-6'>
                <div className='timeline-label fw-bold text-gray-800 fs-6 w-75px me-4'>2 hours</div>
                <div className='timeline-badge d-flex align-items-center justify-content-center me-4'>
                  <span className='w-12px h-12px bg-info rounded-circle border border-white border-2'></span>
                </div>
                <div className='timeline-content text-gray-800 fs-6'>
                  Stock received: Radwag PCB board modules (quantity: 50 Pcs) added to Vasai Store.
                </div>
              </div>

              <div className='timeline-item d-flex align-items-start'>
                <div className='timeline-label fw-bold text-gray-800 fs-6 w-75px me-4'>3 hours</div>
                <div className='timeline-badge d-flex align-items-center justify-content-center me-4'>
                  <span className='w-12px h-12px bg-dark rounded-circle border border-white border-2'></span>
                </div>
                <div className='timeline-content text-gray-800 fs-6'>
                  New OIF registered for ADRA customer in Pune — Serial check scheduled.
                </div>
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
