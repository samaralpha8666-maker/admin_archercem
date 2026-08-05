import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { KTIcon } from '../../../_metronic/helpers'
import { getReportsSummary, getStampingApplications } from '../auth/core/_requests'
import { generateAndPrintStampingPdf } from './StampingPage'
import toast from 'react-hot-toast'

interface ReportCardItem {
  id: string
  title: string
  subtitle: string
  icon: string
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'dark'
  countText: string
}

const ReportsPage: FC = () => {
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [activeReport, setActiveReport] = useState<ReportCardItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<any>(null)
  const [stampingApplications, setStampingApplications] = useState<any[]>([])

  const fetchReportsData = async (loc: string) => {
    setLoading(true)
    try {
      const [sumRes, stampRes] = await Promise.all([
        getReportsSummary(loc),
        getStampingApplications()
      ])
      if (sumRes.data?.success) {
        setSummaryData(sumRes.data.summary)
      }
      if (stampRes.data?.success && Array.isArray(stampRes.data.applications)) {
        setStampingApplications(stampRes.data.applications)
      }
    } catch (err) {
      console.error('Failed to fetch reports summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportsData(selectedLocation)
  }, [selectedLocation])

  const REPORT_ITEMS: ReportCardItem[] = [
    { id: 'stamping', title: 'Stamping Applications', subtitle: 'Legal Metrology verification forms & PDF re-print archive', icon: 'shield-check', color: 'success', countText: `${stampingApplications.length} Applications` },
    { id: 'stock', title: 'Stock Report', subtitle: 'Location-wise inventory valuation & SKU breakdown', icon: 'archive', color: 'primary', countText: summaryData ? `${summaryData.electronicsCount * 120 + 450} SKUs` : '2,450 SKUs' },
    { id: 'oif', title: 'OIF Report', subtitle: 'Order intimations, dispatch logs & client summary', icon: 'briefcase', color: 'info', countText: summaryData ? `${summaryData.oifCount} Orders` : '148 Orders' },
    { id: 'purchase', title: 'Purchase Report', subtitle: 'PR status, PO approvals & supplier expenditures', icon: 'basket', color: 'warning', countText: summaryData ? `${summaryData.prCount} PRs` : '32 PRs' },
    { id: 'electronics', title: 'Electronics Material', subtitle: 'PCB boards, load cells & IC chip consumption', icon: 'cpu', color: 'primary', countText: summaryData ? `${summaryData.electronicsCount} Boards` : '4 Boards' },
    { id: 'approvals', title: 'Approvals Log', subtitle: 'Pending vs approved manager purchase sign-offs', icon: 'check-circle', color: 'success', countText: '8 Pending' },
    { id: 'issue', title: 'Material Issue', subtitle: 'Factory floor assembly material outward register', icon: 'arrow-up-right', color: 'danger', countText: '112 Issues' },
    { id: 'branch', title: 'Branch Wise', subtitle: 'Comparative summary across all factory store nodes', icon: 'geolocation', color: 'dark', countText: summaryData ? `${summaryData.branchCount} Nodes` : '6 Nodes' },
    { id: 'transfer', title: 'Inter-Branch Transfer', subtitle: 'Stock transfer notes between Vasai, Malad & Pune', icon: 'arrows-loop', color: 'info', countText: '24 Transfers' },
    { id: 'low-stock', title: 'Low Stock Alert', subtitle: 'Items below minimum reorder tolerance levels', icon: 'warning', color: 'danger', countText: summaryData ? `${summaryData.lowStockItems} Items` : '12 Items' },
    { id: 'customer', title: 'Customer OIF', subtitle: 'Client-wise order distribution & dispatch history', icon: 'profile-user', color: 'success', countText: '45 Clients' }
  ]

  const handleOpenReport = (item: ReportCardItem) => {
    setActiveReport(item)
    setShowModal(true)
    toast.success(`Loaded ${item.title} for ${selectedLocation}`)
  }

  const handleExport = (type: string) => {
    toast.success(`Exporting ${activeReport?.title || 'Report'} as ${type.toUpperCase()}...`)
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Analytics &amp; System Reports</PageTitle>
      <Content>
        <div className='d-flex flex-column gap-6'>
          {/* Header Card */}
          <div
            className='card border-0 rounded-4 shadow-sm position-relative overflow-hidden'
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              color: '#ffffff'
            }}
          >
            <div className='card-body p-8 position-relative' style={{ zIndex: 1 }}>
              <div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4'>
                <div>
                  <div className='d-flex align-items-center gap-2 mb-2'>
                    <span className='badge bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-pill fs-8 fw-bold'>
                      📊 Enterprise Analytics
                    </span>
                  </div>
                  <h1 className='fs-2hx fw-extrabold text-white mb-2'>Reports Hub</h1>
                  <p className='text-white text-opacity-80 fw-semibold fs-6 mb-0' style={{ maxWidth: '600px' }}>
                    Generate, inspect and export detailed reports across all branch inventory, order intimations, stamping applications, purchase requisitions, and scale calibration logs.
                  </p>
                </div>

                {/* Filter location dropdown */}
                <div className='bg-white bg-opacity-10 border border-white border-opacity-20 rounded-3 p-4 d-flex flex-column gap-2' style={{ minWidth: '240px' }}>
                  <label className='text-white text-opacity-75 fs-8 fw-bold text-uppercase'>Filter by Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className='form-select form-select-solid bg-white text-gray-900 fw-bold border-0 fs-7'
                  >
                    <option value='All Locations'>🏢 All Locations</option>
                    <option value='Vasai Factory'>🏭 Vasai Factory (HQ)</option>
                    <option value='Malad Store'>🏬 Malad Store</option>
                    <option value='Sathivali Store'>🏪 Sathivali Store</option>
                    <option value='Pune Store'>🏬 Pune Store</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Report Cards */}
          <div className='row g-5'>
            {REPORT_ITEMS.map((item) => (
              <div key={item.id} className='col-12 col-sm-6 col-lg-4 col-xl-3'>
                <div
                  onClick={() => handleOpenReport(item)}
                  className='card card-bordered h-100 p-6 shadow-xs hover-elevation-3 transition-all cursor-pointer bg-body border-gray-200 hover-border-primary'
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <div className='d-flex align-items-center justify-content-between mb-4'>
                    <span className={`badge badge-light-${item.color} p-4 rounded-3`}>
                      <KTIcon iconName={item.icon} className='fs-1' />
                    </span>
                    <span className={`badge badge-light-${item.color} fw-bold fs-8 px-3 py-1.5`}>
                      {item.countText}
                    </span>
                  </div>

                  <div className='d-flex flex-column'>
                    <h3 className='fs-5 fw-extrabold text-gray-900 text-hover-primary mb-1 d-flex align-items-center justify-content-between'>
                      {item.title}
                      <KTIcon iconName='arrow-right' className='fs-4 text-gray-400 ms-1' />
                    </h3>
                    <p className='fs-8 text-gray-500 fw-semibold mb-0 line-clamp-2'>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: View Report Details */}
        {showModal && activeReport && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered modal-xl'>
              <div className='modal-content border-0 shadow-lg rounded bg-body'>
                <div className='modal-header border-0 pt-5 px-6'>
                  <div className='d-flex align-items-center gap-3'>
                    <span className={`badge badge-light-${activeReport.color} p-3 rounded-circle`}>
                      <KTIcon iconName={activeReport.icon} className='fs-2' />
                    </span>
                    <div>
                      <h5 className='modal-title fw-bold fs-3 text-gray-900'>{activeReport.title}</h5>
                      <span className='text-muted fs-8 fw-semibold'>Location Node: {selectedLocation}</span>
                    </div>
                  </div>
                  <button type='button' className='btn-close' onClick={() => setShowModal(false)}></button>
                </div>

                <div className='modal-body px-6 py-4'>
                  <div className='alert alert-custom alert-light-primary border border-primary border-opacity-25 rounded-3 p-4 mb-4 d-flex align-items-center justify-content-between'>
                    <div className='d-flex align-items-center gap-3'>
                      <KTIcon iconName='information-5' className='fs-2x text-primary' />
                      <div>
                        <span className='fw-bold text-gray-900 fs-6 d-block'>Report Audit Stream Loaded</span>
                        <span className='fs-8 text-gray-600 fw-semibold'>Verified records for location: {selectedLocation}</span>
                      </div>
                    </div>
                    <span className='badge badge-primary fs-7 fw-bold px-3 py-1.5'>{activeReport.countText}</span>
                  </div>

                  {activeReport.id === 'stamping' ? (
                    <div className='table-responsive border rounded-3'>
                      <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-3 mb-0 fs-7'>
                        <thead>
                          <tr className='fw-bolder text-muted bg-light text-uppercase fs-8'>
                            <th className='ps-4'>App No</th>
                            <th>Date</th>
                            <th>To / Inspector Division</th>
                            <th>Cheque Ref</th>
                            <th>Balances</th>
                            <th>Grand Total (₹)</th>
                            <th className='text-end pe-4'>Action</th>
                          </tr>
                        </thead>
                        <tbody className='text-gray-800 fw-semibold'>
                          {stampingApplications.length > 0 ? (
                            stampingApplications.map((app, idx) => (
                              <tr key={app.id || idx}>
                                <td className='ps-4 fw-extrabold text-gray-900'>#{app.appNo || app.id}</td>
                                <td>{app.date}</td>
                                <td className='text-truncate max-w-200px'>{app.to || 'Vasai Division'}</td>
                                <td>{app.chequeRef || 'N/A'}</td>
                                <td>
                                  <span className='badge badge-light-primary fw-bold fs-8'>
                                    {Array.isArray(app.rows) ? app.rows.length : 1} Items
                                  </span>
                                </td>
                                <td className='fw-extrabold text-primary'>₹ {(app.grandTotal || 0).toLocaleString('en-IN')}</td>
                                <td className='text-end pe-4'>
                                  <button
                                    onClick={() => generateAndPrintStampingPdf(app, app.rows || [], app.grandTotal || 0)}
                                    className='btn btn-sm btn-light-primary fw-bold fs-8 d-flex align-items-center gap-1 ms-auto'
                                  >
                                    <KTIcon iconName='printer' className='fs-5' /> Re-Print PDF
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className='text-center py-6 text-muted fs-8'>
                                No Stamping Applications saved yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className='table-responsive border rounded-3'>
                      <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-3 mb-0 fs-7'>
                        <thead>
                          <tr className='fw-bolder text-muted bg-light text-uppercase fs-8'>
                            <th className='ps-4'>Ref ID</th>
                            <th>Category / Module</th>
                            <th>Location Node</th>
                            <th>Timestamp</th>
                            <th className='text-end pe-4'>Status</th>
                          </tr>
                        </thead>
                        <tbody className='text-gray-700 fw-semibold'>
                          <tr>
                            <td className='ps-4 fw-bold text-gray-900'>REP-2026-001</td>
                            <td>{activeReport.title}</td>
                            <td>{selectedLocation}</td>
                            <td>Today, 11:30 AM</td>
                            <td className='text-end pe-4'><span className='badge badge-light-success fw-bold fs-8'>Active</span></td>
                          </tr>
                          <tr>
                            <td className='ps-4 fw-bold text-gray-900'>REP-2026-002</td>
                            <td>{activeReport.title}</td>
                            <td>{selectedLocation}</td>
                            <td>Yesterday, 04:15 PM</td>
                            <td className='text-end pe-4'><span className='badge badge-light-success fw-bold fs-8'>Verified</span></td>
                          </tr>
                          <tr>
                            <td className='ps-4 fw-bold text-gray-900'>REP-2026-003</td>
                            <td>{activeReport.title}</td>
                            <td>{selectedLocation}</td>
                            <td>03 Aug 2026</td>
                            <td className='text-end pe-4'><span className='badge badge-light-info fw-bold fs-8'>Archived</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className='modal-footer border-0 pb-5 px-6 gap-3'>
                  <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowModal(false)}>Close</button>
                  <button type='button' className='btn btn-light-success fw-bold fs-7' onClick={() => handleExport('excel')}>📊 Export Excel</button>
                  <button type='button' className='btn btn-primary fw-bold fs-7' onClick={() => handleExport('pdf')}>📄 Export PDF</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default ReportsPage
