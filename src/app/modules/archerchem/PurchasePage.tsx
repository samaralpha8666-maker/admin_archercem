import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toAbsoluteUrl } from '../../../_metronic/helpers'
import {
  getPurchaseRequisitions,
  createPurchaseRequisition,
  updatePurchaseRequisition,
  deletePurchaseRequisition
} from '../auth/core/_requests'
import { toast } from 'react-hot-toast'

export interface PRItem {
  srNo?: number
  description: string
  qty: string
}

export interface PRRecord {
  id: number | string
  prNo: string
  date: string
  department: string
  fulfillmentDate: string
  preferredVendor: string
  branch: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | string
  items: PRItem[]
  notes: string
  requisitionBy: string
  approvedBy: string
  createdAt?: string
}

const DEFAULT_PR_SEED: PRRecord[] = [
  {
    id: '1',
    prNo: 'PR-2026-001',
    date: '2026-06-01',
    department: 'R&D',
    fulfillmentDate: '2026-06-15',
    preferredVendor: 'Arrow Electronics',
    branch: 'Vasai Factory (HQ)',
    status: 'pending',
    items: [
      { description: 'Display Board V2.1', qty: '10 Pcs' },
      { description: 'IC Register 74HC595', qty: '50 Pcs' }
    ],
    notes: 'Urgent production requirement for AE balance batch',
    requisitionBy: 'Munna Kumar',
    approvedBy: ''
  },
  {
    id: '2',
    prNo: 'PR-2026-002',
    date: '2026-06-05',
    department: 'Production',
    fulfillmentDate: '2026-06-20',
    preferredVendor: 'Apex Loadcells',
    branch: 'Vasai Factory (HQ)',
    status: 'approved',
    items: [
      { description: 'Precision Loadcell 500g', qty: '5 Pcs' },
      { description: 'Stainless Steel Pan (Round)', qty: '20 Pcs' }
    ],
    notes: 'Stock replenishment',
    requisitionBy: 'Sunita Rane',
    approvedBy: 'Admin (Rajesh Mehta)'
  }
]

const PurchasePage: FC = () => {
  const [prList, setPrList] = useState<PRRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [viewState, setViewState] = useState<'directory' | 'form' | 'approvals'>('directory')
  const [activePrId, setActivePrId] = useState<number | string | null>(null)
  const [filterChip, setFilterChip] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [approverNameInput, setApproverNameInput] = useState('Admin (System)')

  // Form State
  const [formData, setFormData] = useState<Partial<PRRecord>>({
    prNo: 'PR-2026-003',
    date: new Date().toISOString().split('T')[0],
    department: 'R&D',
    fulfillmentDate: '',
    preferredVendor: 'Arrow Electronics',
    status: 'pending',
    items: [
      { description: 'Microcontroller Board STM32', qty: '15 Pcs' },
      { description: 'LCD Display Shield 16x2', qty: '10 Pcs' }
    ],
    notes: 'Required for new calibration series assembly.',
    requisitionBy: 'Munna Kumar',
    approvedBy: ''
  })

  // Fetch PR records from API backend
  const fetchPRs = async () => {
    setLoading(true)
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const res = await getPurchaseRequisitions(activeBranch)
      if (res.data && res.data.success && Array.isArray(res.data.requisitions) && res.data.requisitions.length > 0) {
        setPrList(res.data.requisitions)
        const nextPrNo = `PR-2026-${String(res.data.requisitions.length + 1).padStart(3, '0')}`
        setFormData((prev) => ({ ...prev, prNo: nextPrNo }))
      } else {
        await seedDefaultPRs()
      }
    } catch (e) {
      console.warn('API fetch PRs error, fallback to seed data:', e)
      setPrList(DEFAULT_PR_SEED)
    } finally {
      setLoading(false)
    }
  }

  const seedDefaultPRs = async () => {
    setPrList(DEFAULT_PR_SEED)
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      for (const r of DEFAULT_PR_SEED) {
        await createPurchaseRequisition({ ...r, branch: activeBranch })
      }
    } catch (e) {
      console.warn('Seeding PRs failed:', e)
    }
  }

  useEffect(() => {
    fetchPRs()
    window.addEventListener('branch_changed', fetchPRs)
    return () => {
      window.removeEventListener('branch_changed', fetchPRs)
    }
  }, [])

  // Item row operations
  const handleAddItem = () => {
    const currentItems = formData.items || []
    setFormData({
      ...formData,
      items: [...currentItems, { description: '', qty: '' }]
    })
  }

  const handleRemoveItem = (index: number) => {
    const currentItems = [...(formData.items || [])]
    if (currentItems.length <= 1) {
      toast.error('Requisition must have at least one item row.')
      return
    }
    currentItems.splice(index, 1)
    setFormData({ ...formData, items: currentItems })
  }

  const handleItemChange = (index: number, field: 'description' | 'qty', val: string) => {
    const currentItems = [...(formData.items || [])]
    currentItems[index][field] = val
    setFormData({ ...formData, items: currentItems })
  }

  // Handle Submit / Save Draft
  const handleSubmitPR = async (statusVal: 'pending' | 'approved' = 'pending', printAfter = false) => {
    if (!formData.department) {
      toast.error('Department field is required.')
      return
    }
    if (!formData.requisitionBy) {
      toast.error('Requisition By name is required.')
      return
    }

    try {
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const payload = {
        ...formData,
        branch: activeBranch,
        status: statusVal
      }

      let res
      if (activePrId) {
        res = await updatePurchaseRequisition(activePrId, payload)
      } else {
        res = await createPurchaseRequisition(payload)
      }

      if (res.data && res.data.success) {
        toast.success(
          activePrId
            ? `Purchase Requisition updated!`
            : `⏳ Purchase Requisition ${res.data.requisition.prNo || payload.prNo} submitted for Admin Approval!`
        )
        fetchPRs()

        if (printAfter) {
          executePrintPR(res.data.requisition || payload)
        }
        setViewState('directory')
      }
    } catch (e: any) {
      console.warn('API error, saving locally:', e)
      const newRec: PRRecord = {
        ...(formData as PRRecord),
        id: String(activePrId || Date.now()),
        status: statusVal
      }
      const updated = activePrId ? prList.map((x) => (x.id === activePrId ? newRec : x)) : [newRec, ...prList]
      setPrList(updated)
      toast.success(`⏳ Purchase Requisition ${newRec.prNo} submitted for Admin Approval!`)
      setViewState('directory')
    }
  }

  // Approve action by Admin
  const handleAdminApprove = async (pr: PRRecord) => {
    const appName = window.prompt('Enter Approver Name / Designation:', approverNameInput) || 'Admin'
    try {
      await updatePurchaseRequisition(pr.id, { status: 'approved', approvedBy: appName })
      toast.success(`✅ PR ${pr.prNo} Approved by ${appName}`)
      fetchPRs()
    } catch (e) {
      console.warn('API update failed:', e)
      const updated = prList.map((x) => (x.id === pr.id ? { ...x, status: 'approved', approvedBy: appName } : x))
      setPrList(updated)
      toast.success(`✅ PR ${pr.prNo} Approved by ${appName}`)
    }
  }

  // Reject action by Admin
  const handleAdminReject = async (pr: PRRecord) => {
    const reason = window.prompt(`Enter Rejection Reason for ${pr.prNo}:`, 'Budget constraint') || 'Rejected by Admin'
    try {
      await updatePurchaseRequisition(pr.id, { status: 'rejected', notes: `${pr.notes || ''} [Rejected: ${reason}]` })
      toast.error(`❌ PR ${pr.prNo} Rejected`)
      fetchPRs()
    } catch (e) {
      console.warn('API update failed:', e)
      const updated = prList.map((x) =>
        x.id === pr.id ? { ...x, status: 'rejected', notes: `${x.notes || ''} [Rejected: ${reason}]` } : x
      )
      setPrList(updated)
      toast.error(`❌ PR ${pr.prNo} Rejected`)
    }
  }

  // Direct Printable Document Generator matching 1:1 archerchem-erp 2 PDF layout
  const executePrintPR = (prObj?: PRRecord | any) => {
    const data = prObj || formData
    const itemsList: PRItem[] = data.items && data.items.length ? data.items : [{ description: '', qty: '' }]

    let itemRowsHtml = ''
    itemsList.forEach((it, idx) => {
      itemRowsHtml += `
        <tr>
          <td style="text-align:center;font-weight:bold;background:#f8fafc;width:40px">${idx + 1}</td>
          <td>${it.description || ''}</td>
          <td style="width:120px;text-align:center;font-weight:bold;color:#1e293b">${it.qty || ''}</td>
        </tr>
      `
    })

    const logoUrl = toAbsoluteUrl('media/logos/archerchem.png')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.prNo || 'PR-001'}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;padding:20px;background:#fff;font-size:11px}
    .sheet{border:2px solid #1e1b4b;border-radius:8px;padding:24px;max-width:720px;margin:0 auto;background:#fff}
    .hdr-row{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #1e1b4b;padding-bottom:10px;margin-bottom:12px}
    .brand-title{font-size:22px;font-weight:900;color:#1e1b4b;font-family:Georgia,serif;letter-spacing:1px}
    .logo-img{max-height:45px;width:auto;object-fit:contain}
    .banner{background:#1e1b4b;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:900;letter-spacing:1.5px;border-radius:4px;margin-bottom:16px;text-transform:uppercase}
    .sec-title{font-size:11px;font-weight:800;color:#1e1b4b;margin-bottom:6px;display:flex;align-items:center;gap:6px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:16px;overflow:hidden;background:#f8fafc}
    .info-cell{padding:8px 12px;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;font-size:11px;display:flex;align-items:center;gap:6px}
    .info-cell:nth-child(2n){border-right:none}
    .info-cell b{color:#1e1b4b;white-space:nowrap;font-weight:800}
    .info-cell span{flex:1;font-weight:700;color:#0f172a}
    table.spec{width:100%;border-collapse:collapse;margin-bottom:16px}
    table.spec thead th{background:#1e1b4b;color:#fff;font-size:10.5px;font-weight:800;padding:7px 10px;text-align:left;border:1px solid #1e1b4b}
    table.spec td{border:1px solid #cbd5e1;padding:7px 10px;font-size:10.5px;vertical-align:middle}
    .notes-box{border:1px solid #cbd5e1;border-radius:6px;padding:10px 14px;margin-bottom:16px;background:#f8fafc;min-height:50px}
    .sign-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;border:1px solid #1e1b4b;border-radius:6px;padding:12px 16px;background:#f8fafc}
    .sign-line{border-bottom:1px solid #94a3b8;min-height:18px;margin-top:4px;font-weight:700;color:#0f172a}
    @media print{
      body{padding:0;background:#fff}
      .sheet{border-width:1.5px;max-width:100%;border-radius:0;box-shadow:none}
      @page{size:A4 portrait;margin:8mm}
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="hdr-row">
      <div class="brand-title">ADRA</div>
      <img src="${logoUrl}" class="logo-img" alt="Archerchem Logo">
    </div>

    <div class="banner">PURCHASE REQUISITION FORM</div>

    <div class="sec-title">📋 Basic Details</div>
    <div class="info-grid">
      <div class="info-cell"><b>PR NO. :</b><span>${data.prNo || ''}</span></div>
      <div class="info-cell"><b>DATE :</b><span>${data.date || ''}</span></div>
      <div class="info-cell"><b>DEPARTMENT :</b><span>${data.department || ''}</span></div>
      <div class="info-cell"><b>FULFILLMENT DATE :</b><span>${data.fulfillmentDate || '—'}</span></div>
      <div class="info-cell" style="grid-column: span 2"><b>PREFERRED VENDOR :</b><span>${data.preferredVendor || '—'}</span></div>
    </div>

    <div class="sec-title">📦 Items Required</div>
    <table class="spec">
      <thead>
        <tr>
          <th style="width:40px;text-align:center">Sr.</th>
          <th>Description</th>
          <th style="width:120px;text-align:center">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <div class="sec-title">📝 Notes</div>
    <div class="notes-box">
      ${data.notes || 'No additional notes specified.'}
    </div>

    <div class="sec-title">✍️ Sign-off</div>
    <div class="sign-grid">
      <div>
        <b style="color:#1e1b4b">REQUISITION BY :</b>
        <div class="sign-line">${data.requisitionBy || ''}</div>
      </div>
      <div>
        <b style="color:#1e1b4b">APPROVED BY :</b>
        <div class="sign-line">${data.approvedBy || (data.status === 'approved' ? 'Admin' : 'Pending Approval')}</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`

    const printWindow = window.open('', '_blank', 'width=850,height=1100')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  const pendingCount = prList.filter((p) => p.status === 'pending').length
  const approvedCount = prList.filter((p) => p.status === 'approved').length
  const rejectedCount = prList.filter((p) => p.status === 'rejected').length

  const filteredPRs = prList.filter((p) => {
    const matchesFilter = filterChip === 'all' || p.status === filterChip
    const matchesSearch =
      (p.prNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.requisitionBy || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <>
      <PageTitle breadcrumbs={[]}>Purchase Requisitions &amp; Approvals</PageTitle>
      <Content>
        {/* Navigation Bar */}
        <div className='card mb-6 border-0 shadow-sm'>
          <div className='card-body py-3 d-flex justify-content-between align-items-center flex-wrap gap-4'>
            <div className='d-flex align-items-center gap-3'>
              <button
                onClick={() => setViewState('directory')}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  viewState === 'directory' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                📋 Purchase Requisitions ({prList.length})
              </button>
              <button
                onClick={() => {
                  const nextNo = `PR-2026-${String(prList.length + 1).padStart(3, '0')}`
                  setFormData({
                    prNo: nextNo,
                    date: new Date().toISOString().split('T')[0],
                    department: 'R&D',
                    fulfillmentDate: '',
                    preferredVendor: 'Arrow Electronics',
                    status: 'pending',
                    items: [
                      { description: '', qty: '10 Pc' },
                      { description: '', qty: '' }
                    ],
                    notes: '',
                    requisitionBy: '',
                    approvedBy: ''
                  })
                  setActivePrId(null)
                  setViewState('form')
                }}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  viewState === 'form' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                ➕ Raise New PR
              </button>
              <button
                onClick={() => setViewState('approvals')}
                className={`btn btn-sm px-5 py-3 fw-bold position-relative ${
                  viewState === 'approvals' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                ⏳ Pending Admin Approvals
                {pendingCount > 0 && (
                  <span className='position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-9'>
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: REQUISITIONS DIRECTORY (Exact 1:1 Match to archerchem-erp 2) */}
        {viewState === 'directory' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6 d-flex justify-content-between align-items-center flex-wrap gap-4'>
              <div className='d-flex align-items-center gap-3'>
                <span className='fs-2'>📋</span>
                <div>
                  <h3 className='card-title fw-bold text-gray-900 fs-3 m-0'>Purchase Requisition Forms</h3>
                  <span className='text-gray-500 fs-7 fw-semibold'>ADRA · Archerchem Instruments — Vasai Factory</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const nextNo = `PR-2026-${String(prList.length + 1).padStart(3, '0')}`
                  setFormData({
                    prNo: nextNo,
                    date: new Date().toISOString().split('T')[0],
                    department: 'R&D',
                    fulfillmentDate: '',
                    preferredVendor: 'Arrow Electronics',
                    status: 'pending',
                    items: [
                      { description: '', qty: '10 Pc' },
                      { description: '', qty: '' }
                    ],
                    notes: '',
                    requisitionBy: '',
                    approvedBy: ''
                  })
                  setActivePrId(null)
                  setViewState('form')
                }}
                className='btn btn-primary btn-sm fw-bold'
              >
                + New PR
              </button>
            </div>

            <div className='card-body pt-4'>
              {/* Stat Counter Cards (1:1 archerchem-erp 2 design) */}
              <div className='row g-4 mb-6'>
                <div className='col-md-4'>
                  <div className='border rounded p-4 text-center bg-light bg-opacity-50'>
                    <div className='fs-2hx fw-bolder text-gray-900'>{prList.length}</div>
                    <div className='fs-7 fw-bold text-gray-500 text-uppercase'>Total PRs</div>
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='border border-warning border-dashed rounded p-4 text-center bg-light-warning'>
                    <div className='fs-2hx fw-bolder text-warning'>{pendingCount}</div>
                    <div className='fs-7 fw-bold text-warning text-uppercase'>⏳ Pending Admin Approval</div>
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='border border-success border-dashed rounded p-4 text-center bg-light-success'>
                    <div className='fs-2hx fw-bolder text-success'>{approvedCount}</div>
                    <div className='fs-7 fw-bold text-success text-uppercase'>✅ Approved</div>
                  </div>
                </div>
              </div>

              {/* Filter Chips & Search Bar */}
              <div className='d-flex align-items-center justify-content-between flex-wrap gap-4 mb-6'>
                <div className='d-flex align-items-center gap-2'>
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterChip(st)}
                      className={`btn btn-sm px-4 py-2 fw-bold text-capitalize ${
                        filterChip === st ? 'btn-primary' : 'btn-light-secondary text-gray-700'
                      }`}
                    >
                      {st === 'pending' ? '⏳ Pending' : st === 'approved' ? '✅ Approved' : st === 'rejected' ? '❌ Rejected' : 'All'}
                    </button>
                  ))}
                </div>
                <div className='position-relative w-250px'>
                  <span className='position-absolute ms-3 top-50 translate-middle-y text-gray-500'>🔍</span>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='form-control form-control-solid ps-10 py-2 fs-7'
                    placeholder='Search PR No, Dept, Name...'
                  />
                </div>
              </div>

              {/* Directory Table */}
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8 border-bottom border-gray-300'>
                      <th>PR No</th>
                      <th>Date</th>
                      <th>Department</th>
                      <th>Requisition By</th>
                      <th>Vendor</th>
                      <th>Items</th>
                      <th className='text-center'>Status</th>
                      <th className='text-end'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className='text-center text-gray-500 py-8'>
                          Loading requisitions...
                        </td>
                      </tr>
                    ) : filteredPRs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className='text-center text-gray-500 py-8'>
                          No purchase requisitions found.
                        </td>
                      </tr>
                    ) : (
                      filteredPRs.map((pr) => (
                        <tr key={pr.id}>
                          <td>
                            <span
                              onClick={() => executePrintPR(pr)}
                              className='text-gray-900 fw-bolder text-hover-primary cursor-pointer fs-6'
                            >
                              {pr.prNo}
                            </span>
                          </td>
                          <td className='text-gray-700 fw-semibold fs-7'>{pr.date}</td>
                          <td>
                            <span className='badge badge-light-primary fw-bold fs-8'>{pr.department}</span>
                          </td>
                          <td>
                            <span className='text-gray-900 fw-bold fs-7'>{pr.requisitionBy}</span>
                          </td>
                          <td>
                            <span className='text-gray-700 fs-7'>{pr.preferredVendor || '—'}</span>
                          </td>
                          <td>
                            <span className='fw-bold text-gray-800'>{(pr.items || []).length} items</span>
                          </td>
                          <td className='text-center'>
                            <span
                              className={`badge badge-light-${
                                pr.status === 'approved' ? 'success' : pr.status === 'rejected' ? 'danger' : 'warning'
                              } fw-bold px-3 py-1 text-capitalize`}
                            >
                              {pr.status === 'pending' ? '⏳ Pending Approval' : pr.status}
                            </span>
                          </td>
                          <td className='text-end'>
                            <div className='d-flex justify-content-end gap-2'>
                              <button
                                onClick={() => executePrintPR(pr)}
                                className='btn btn-icon btn-light-info btn-sm'
                                title='Direct Print PDF'
                              >
                                🖨️
                              </button>
                              <button
                                onClick={() => {
                                  setFormData(pr)
                                  setActivePrId(pr.id)
                                  setViewState('form')
                                }}
                                className='btn btn-icon btn-light-primary btn-sm'
                                title='Edit PR'
                              >
                                ✏️
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Delete ${pr.prNo}?`)) {
                                    try {
                                      await deletePurchaseRequisition(pr.id)
                                      toast.success('PR deleted.')
                                      fetchPRs()
                                    } catch (e) {
                                      toast.error('Failed to delete PR.')
                                    }
                                  }
                                }}
                                className='btn btn-icon btn-light-danger btn-sm'
                                title='Delete PR'
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: REQUISITION FORM (Exact 1:1 Match to archerchem-erp 2) */}
        {viewState === 'form' && (
          <div className='row justify-content-center'>
            <div className='col-lg-10'>
              {/* Form Header Banner */}
              <div
                className='card border-0 shadow-lg mb-6 overflow-hidden'
                style={{ borderRadius: '12px', borderColor: '#312e81' }}
              >
                <div
                  className='p-6 d-flex align-items-center justify-content-between border-bottom'
                  style={{ backgroundColor: '#ffffff', borderColor: '#312e81' }}
                >
                  <h2 className='m-0 fw-black tracking-wide' style={{ color: '#1e1b4b', fontSize: '26px', fontFamily: 'Georgia, serif' }}>
                    ADRA
                  </h2>
                  <div className='d-flex align-items-center gap-2'>
                    <img src={toAbsoluteUrl('media/logos/archerchem.png')} alt='Archerchem Logo' style={{ height: '32px' }} />
                    <span className='fw-bold text-uppercase fs-9 text-gray-700' style={{ letterSpacing: '1px' }}>
                      ARCHERCHEM<br />INSTRUMENTS
                    </span>
                  </div>
                </div>

                <div
                  className='py-3 px-6 text-center text-white fw-black text-uppercase'
                  style={{ backgroundColor: '#1e1b4b', fontSize: '15px', letterSpacing: '2px' }}
                >
                  PURCHASE REQUISITION FORM
                </div>
              </div>

              {/* CARD 1: Basic Details */}
              <div className='card border-0 shadow-sm mb-6 rounded-4'>
                <div className='card-header border-0 pt-6 pb-2'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>
                    <span className='fs-3 me-2'>📋</span> Basic Details
                  </h3>
                </div>
                <div className='card-body pt-0'>
                  <div className='row g-4'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-8 text-muted text-uppercase'>PR NO. (AUTO)</label>
                      <input
                        type='text'
                        className='form-control form-control-solid fw-bold fs-6 text-gray-800'
                        value={formData.prNo || ''}
                        onChange={(e) => setFormData({ ...formData, prNo: e.target.value })}
                        placeholder='PR-2026-001'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-8 text-muted text-uppercase required'>DATE *</label>
                      <input
                        type='date'
                        className='form-control form-control-solid fw-bold fs-6 text-gray-800'
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className='col-12'>
                      <label className='form-label fw-bold fs-8 text-muted text-uppercase required'>DEPARTMENT *</label>
                      <input
                        type='text'
                        className='form-control form-control-solid fw-semibold fs-6'
                        value={formData.department || ''}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder='e.g. R&D, Production, QC, Admin'
                      />
                    </div>
                    <div className='col-12'>
                      <label className='form-label fw-bold fs-8 text-muted text-uppercase'>FULFILLMENT DATE</label>
                      <input
                        type='date'
                        className='form-control form-control-solid fw-semibold fs-6'
                        value={formData.fulfillmentDate || ''}
                        onChange={(e) => setFormData({ ...formData, fulfillmentDate: e.target.value })}
                      />
                    </div>
                    <div className='col-12'>
                      <label className='form-label fw-bold fs-8 text-muted text-uppercase'>PREFERRED VENDOR</label>
                      <input
                        type='text'
                        className='form-control form-control-solid fw-semibold fs-6'
                        value={formData.preferredVendor || ''}
                        onChange={(e) => setFormData({ ...formData, preferredVendor: e.target.value })}
                        placeholder='e.g. Arrow Electronics'
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Items Required */}
              <div className='card border-0 shadow-sm mb-6 rounded-4'>
                <div className='card-header border-0 pt-6 pb-2 d-flex justify-content-between align-items-center'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>
                    <span className='fs-3 me-2'>📦</span> Items Required
                  </h3>
                  <button onClick={handleAddItem} className='btn btn-light-primary btn-sm fw-bold px-4'>
                    + Add Item
                  </button>
                </div>
                <div className='card-body pt-2'>
                  <div className='table-responsive'>
                    <table className='table table-bordered align-middle gs-4 gy-3 border-gray-300'>
                      <thead>
                        <tr className='fw-bold text-gray-700 bg-light-primary fs-8 text-uppercase'>
                          <th style={{ width: '50px' }} className='text-center'>Sr.</th>
                          <th>Description</th>
                          <th style={{ width: '160px' }}>Qty</th>
                          <th style={{ width: '50px' }} className='text-center'>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.items || []).map((it, idx) => (
                          <tr key={idx}>
                            <td className='text-center fw-bold text-gray-700 fs-7'>{idx + 1}</td>
                            <td>
                              <input
                                type='text'
                                className='form-control form-control-solid fs-7'
                                value={it.description}
                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                placeholder='Item description / specification...'
                              />
                            </td>
                            <td>
                              <input
                                type='text'
                                className='form-control form-control-solid fs-7'
                                value={it.qty}
                                onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                placeholder='e.g. 10 Pcs'
                              />
                            </td>
                            <td className='text-center'>
                              <button
                                type='button'
                                onClick={() => handleRemoveItem(idx)}
                                className='btn btn-icon btn-light-danger btn-sm'
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* CARD 3: Notes & Sign-off */}
              <div className='card border-0 shadow-sm mb-6 rounded-4'>
                <div className='card-header border-0 pt-6 pb-2'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>
                    <span className='fs-3 me-2'>📝</span> Notes &amp; ✍️ Sign-off
                  </h3>
                </div>
                <div className='card-body pt-0'>
                  <div className='mb-4'>
                    <label className='form-label fw-bold fs-8 text-muted text-uppercase'>NOTES</label>
                    <textarea
                      className='form-control form-control-solid fs-7'
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder='Any additional notes or instructions...'
                    />
                  </div>

                  <div className='row g-4'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-8 text-muted text-uppercase required'>REQUISITION BY *</label>
                      <input
                        type='text'
                        className='form-control form-control-solid fw-bold fs-6'
                        value={formData.requisitionBy || ''}
                        onChange={(e) => setFormData({ ...formData, requisitionBy: e.target.value })}
                        placeholder='Your Name'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-8 text-muted text-uppercase'>APPROVED BY (ADMIN)</label>
                      <input
                        type='text'
                        className='form-control form-control-solid fw-bold fs-6'
                        value={formData.approvedBy || ''}
                        onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                        placeholder='Admin Approval Name (Auto-filled on approval)'
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className='d-flex align-items-center justify-content-between gap-4 mb-8'>
                <button
                  type='button'
                  onClick={() => setViewState('directory')}
                  className='btn btn-light-secondary text-gray-800 fw-bold px-6 py-3'
                >
                  ← Back to Requisitions
                </button>
                <div className='d-flex gap-3'>
                  <button
                    type='button'
                    onClick={() => handleSubmitPR('pending', false)}
                    className='btn btn-primary fw-bold px-8 py-3 fs-6'
                  >
                    ✅ Submit PR for Admin Approval
                  </button>
                  <button
                    type='button'
                    onClick={() => executePrintPR()}
                    className='btn btn-outline btn-outline-primary fw-bold px-6 py-3 fs-6'
                  >
                    🖨️ Print / Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ADMIN APPROVAL WORKFLOW MANAGER (1:1 archerchem-erp 2) */}
        {viewState === 'approvals' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6 d-flex justify-content-between align-items-center flex-wrap gap-4'>
              <div className='d-flex align-items-center gap-3'>
                <span className='fs-2'>⏳</span>
                <div>
                  <h3 className='card-title fw-bold text-gray-900 fs-3 m-0'>Pending Admin Approvals Queue</h3>
                  <span className='text-gray-500 fs-7 fw-semibold'>
                    Review, approve, or reject incoming purchase requisitions before order execution
                  </span>
                </div>
              </div>
              <div className='d-flex align-items-center gap-2'>
                <span className='fw-bold fs-7 text-gray-700'>Approver Signature:</span>
                <input
                  type='text'
                  value={approverNameInput}
                  onChange={(e) => setApproverNameInput(e.target.value)}
                  className='form-control form-control-solid py-1 px-3 fs-7 w-200px'
                  placeholder='Admin Name'
                />
              </div>
            </div>

            <div className='card-body pt-2'>
              {prList.filter((p) => p.status === 'pending').length === 0 ? (
                <div className='text-center text-muted py-12 fs-5'>
                  <div className='fs-1 mb-2'>🎉</div>
                  No pending purchase requisitions awaiting approval.
                </div>
              ) : (
                <div className='row g-6'>
                  {prList
                    .filter((p) => p.status === 'pending')
                    .map((pr) => (
                      <div className='col-lg-6' key={pr.id}>
                        <div className='card border border-warning border-dashed rounded-4 p-6 bg-light bg-opacity-30 h-100 shadow-sm'>
                          <div className='d-flex justify-content-between align-items-center border-bottom pb-4 mb-4'>
                            <div>
                              <span className='fw-black fs-4 text-primary me-2'>{pr.prNo}</span>
                              <span className='badge badge-light-primary fw-bold fs-8'>{pr.department}</span>
                            </div>
                            <span className='badge badge-warning fw-bold px-3 py-1.5 fs-8'>
                              ⏳ Pending Admin Approval
                            </span>
                          </div>

                          <div className='d-flex flex-column gap-2 mb-4 fs-7'>
                            <div className='d-flex justify-content-between border-bottom border-dotted pb-1'>
                              <span className='text-muted fw-semibold'>Requisition By:</span>
                              <span className='fw-bold text-gray-900'>{pr.requisitionBy || 'Staff User'}</span>
                            </div>
                            <div className='d-flex justify-content-between border-bottom border-dotted pb-1'>
                              <span className='text-muted fw-semibold'>Requisition Date:</span>
                              <span className='fw-semibold text-gray-800'>{pr.date}</span>
                            </div>
                            <div className='d-flex justify-content-between border-bottom border-dotted pb-1'>
                              <span className='text-muted fw-semibold'>Fulfillment Date:</span>
                              <span className='fw-semibold text-gray-800'>{pr.fulfillmentDate || 'Standard'}</span>
                            </div>
                            <div className='d-flex justify-content-between border-bottom border-dotted pb-1'>
                              <span className='text-muted fw-semibold'>Preferred Vendor:</span>
                              <span className='fw-semibold text-gray-800'>{pr.preferredVendor || '—'}</span>
                            </div>
                          </div>

                          {/* Requested Items Box */}
                          <div className='border rounded p-3 mb-4 bg-white'>
                            <div className='fw-bold text-uppercase fs-9 text-gray-500 mb-2'>
                              📦 Items Requested ({(pr.items || []).length}):
                            </div>
                            <ul className='list-unstyled m-0 fs-7'>
                              {(pr.items || []).map((it, idx) => (
                                <li key={idx} className='d-flex justify-content-between py-1 border-bottom-subtle'>
                                  <span className='fw-bold text-gray-800'>• {it.description || 'Item'}</span>
                                  <span className='badge badge-light-dark fw-bolder'>{it.qty || '1'}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {pr.notes && (
                            <div className='fs-8 italic text-muted mb-4 bg-light p-2 rounded'>
                              <strong>Notes:</strong> {pr.notes}
                            </div>
                          )}

                          {/* Approval Actions */}
                          <div className='d-flex gap-3 mt-auto pt-2'>
                            <button
                              onClick={() => handleAdminReject(pr)}
                              className='btn btn-light-danger btn-sm flex-grow-1 fw-bold py-2.5'
                            >
                              ❌ Reject PR
                            </button>
                            <button
                              onClick={() => handleAdminApprove(pr)}
                              className='btn btn-success btn-sm flex-grow-1 fw-bold py-2.5'
                            >
                              ✅ Approve PR
                            </button>
                            <button
                              onClick={() => executePrintPR(pr)}
                              className='btn btn-outline btn-outline-primary btn-sm px-3'
                              title='Print PR PDF'
                            >
                              🖨️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default PurchasePage
