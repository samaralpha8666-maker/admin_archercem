import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'

interface PurchaseRequisition {
  id: string
  item: string
  qty: number
  unit: string
  requestedBy: string
  dept: string
  date: string
  urgency: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  branch?: string
}

const DEFAULT_PR_DATA: PurchaseRequisition[] = [
  { id: 'PR-2026-001', item: 'Chip Capacitors 100nf (SMD-0805)', qty: 500, unit: 'Pcs', requestedBy: 'Sunita Rane', dept: 'R&D', date: '2026-07-16', urgency: 'medium', status: 'pending', reason: 'Production restock for ADRA modules batch.' },
  { id: 'PR-2026-002', item: 'A/D converter IC CS5530 (TSSOP20)', qty: 50, unit: 'Pcs', requestedBy: 'Ramesh Patil', dept: 'Production', date: '2026-07-15', urgency: 'high', status: 'approved', reason: 'Urgent shortfall required for Malad client dispatch order.' },
  { id: 'PR-2026-003', item: 'Calibration standard Weight Box 1Kg', qty: 2, unit: 'Pcs', requestedBy: 'Pooja Desai', dept: 'Quality Control', date: '2026-07-12', urgency: 'low', status: 'approved', reason: 'QC lab standard replacement.' }
]

const PurchasePage: FC = () => {
  const [prList, setPrList] = useState<PurchaseRequisition[]>([])
  const [viewState, setViewState] = useState<'list' | 'approvals'>('list')
  const [showAddPrModal, setShowAddPrModal] = useState(false)

  // Form State
  const [prForm, setPrForm] = useState<Partial<PurchaseRequisition>>({
    item: 'Chip Capacitors 100nf (SMD-0805)',
    qty: 100,
    unit: 'Pcs',
    requestedBy: '',
    dept: 'Production',
    urgency: 'medium',
    reason: ''
  })

  useEffect(() => {
    const cached = localStorage.getItem('archerchem_pr_list')
    if (cached) {
      try {
        setPrList(JSON.parse(cached))
      } catch (e) {
        setPrList(DEFAULT_PR_DATA)
      }
    } else {
      setPrList(DEFAULT_PR_DATA)
      localStorage.setItem('archerchem_pr_list', JSON.stringify(DEFAULT_PR_DATA))
    }
  }, [])

  const savePRs = (updated: PurchaseRequisition[]) => {
    setPrList(updated)
    localStorage.setItem('archerchem_pr_list', JSON.stringify(updated))
  }

  // Create PR
  const handlePrSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prForm.requestedBy || !prForm.reason) {
      toast.error('Requested By and Reason description are required.')
      return
    }

    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    const nextId = `PR-2026-${String(prList.length + 1).padStart(3, '0')}`
    const newRec: PurchaseRequisition = {
      id: nextId,
      item: prForm.item || 'BOM Item',
      qty: Number(prForm.qty) || 1,
      unit: prForm.unit || 'Pcs',
      requestedBy: prForm.requestedBy,
      dept: prForm.dept || 'Production',
      date: new Date().toISOString().split('T')[0],
      urgency: prForm.urgency as any || 'medium',
      status: 'pending',
      reason: prForm.reason,
      branch: activeBranch
    }

    savePRs([newRec, ...prList])
    toast.success(`Purchase Requisition ${nextId} created successfully.`)
    setShowAddPrModal(false)
    setPrForm({
      item: 'Chip Capacitors 100nf (SMD-0805)',
      qty: 100,
      unit: 'Pcs',
      requestedBy: '',
      dept: 'Production',
      urgency: 'medium',
      reason: ''
    })
  }

  // Action: Approve / Reject
  const handleDecision = (id: string, decision: 'approved' | 'rejected') => {
    const updated = prList.map((pr) =>
      pr.id === id ? { ...pr, status: decision } : pr
    )
    savePRs(updated)
    toast.success(`Requisition has been marked as ${decision}.`)
  }

  const filteredPRs = prList.filter((pr) => {
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    const recordBranch = pr.branch || 'Vasai Factory (HQ)'
    return recordBranch === activeBranch
  })

  const pendingPRs = filteredPRs.filter((pr) => pr.status === 'pending')

  return (
    <>
      <PageTitle breadcrumbs={[]}>Purchase Requisitions &amp; Approvals</PageTitle>
      <Content>
        {/* Navigation Tabs */}
        <div className='card mb-6 border-0 shadow-sm'>
          <div className='card-body py-2 d-flex justify-content-between align-items-center flex-wrap gap-4'>
            <div className='d-flex align-items-center gap-3'>
              <button
                onClick={() => setViewState('list')}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  viewState === 'list' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                📋 Requisitions Directory
              </button>
              <button
                onClick={() => setViewState('approvals')}
                className={`btn btn-sm px-5 py-3 fw-bold position-relative ${
                  viewState === 'approvals' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                ⏳ Pending Approvals
                {pendingPRs.length > 0 && (
                  <span className='position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-9'>
                    {pendingPRs.length}
                  </span>
                )}
              </button>
            </div>

            <div>
              <button onClick={() => setShowAddPrModal(true)} className='btn btn-primary btn-sm fw-bold'>
                + New Purchase Requisition
              </button>
            </div>
          </div>
        </div>

        {/* View 1: PR List */}
        {viewState === 'list' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title fw-bold text-gray-900 fs-3'>Purchase Requisition Log (PR)</h3>
            </div>
            <div className='card-body pt-2'>
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8'>
                      <th>PR ID</th>
                      <th>Requested Item</th>
                      <th>Quantity</th>
                      <th>Requested By</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Urgency</th>
                      <th className='text-end'>Approval Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPRs.map((pr) => (
                      <tr key={pr.id}>
                        <td><span className='text-gray-900 fw-bold fs-6'>{pr.id}</span></td>
                        <td>
                          <div className='d-flex flex-column'>
                            <span className='text-gray-900 fw-bold fs-6'>{pr.item}</span>
                            <span className='text-muted fs-8 text-truncate' style={{ maxWidth: '250px' }} title={pr.reason}>
                              {pr.reason}
                            </span>
                          </div>
                        </td>
                        <td className='fw-bold text-gray-800'>{pr.qty} {pr.unit}</td>
                        <td><span className='text-gray-800 fw-semibold'>{pr.requestedBy}</span></td>
                        <td><span className='text-gray-700 fw-semibold'>{pr.dept}</span></td>
                        <td className='text-muted fs-7'>{pr.date}</td>
                        <td>
                          <span className={`badge badge-light-${pr.urgency === 'high' ? 'danger' : pr.urgency === 'medium' ? 'warning' : 'primary'} fw-bold px-2.5 py-0.5 fs-8 text-capitalize`}>
                            {pr.urgency}
                          </span>
                        </td>
                        <td className='text-end'>
                          <span
                            className={`badge badge-light-${
                              pr.status === 'approved' ? 'success' : pr.status === 'rejected' ? 'danger' : 'warning'
                            } fw-bold px-3 py-1 text-capitalize`}
                          >
                            {pr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Approvals Dashboard */}
        {viewState === 'approvals' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title fw-bold text-gray-900 fs-3'>Pending Approvals Manager</h3>
            </div>
            <div className='card-body pt-2'>
              {pendingPRs.length === 0 ? (
                <div className='text-center text-muted py-8 fs-6'>🎉 No pending requisitions awaiting approval.</div>
              ) : (
                <div className='table-responsive'>
                  <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4'>
                    <thead>
                      <tr className='fw-bold text-muted text-uppercase fs-8'>
                        <th>PR ID</th>
                        <th>Requested Item</th>
                        <th>Quantity Required</th>
                        <th>Requested By</th>
                        <th>Urgency</th>
                        <th className='min-w-200px'>Reason Description</th>
                        <th className='text-end min-w-150px'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPRs.map((pr) => (
                        <tr key={pr.id}>
                          <td><span className='text-gray-900 fw-bold fs-6'>{pr.id}</span></td>
                          <td><span className='text-gray-900 fw-bold fs-6'>{pr.item}</span></td>
                          <td className='fw-bold text-gray-800'>{pr.qty} {pr.unit}</td>
                          <td>
                            <div className='d-flex flex-column'>
                              <span className='text-gray-900 fw-bold fs-7'>{pr.requestedBy}</span>
                              <span className='text-muted fs-8'>{pr.dept} Department</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-light-${pr.urgency === 'high' ? 'danger' : pr.urgency === 'medium' ? 'warning' : 'primary'} fw-bold px-2.5 py-0.5 fs-8 text-capitalize`}>
                              {pr.urgency}
                            </span>
                          </td>
                          <td><span className='text-gray-700 fs-7 fw-medium d-block text-truncate' style={{ maxWidth: '220px' }}>{pr.reason}</span></td>
                          <td className='text-end'>
                            <div className='d-flex justify-content-end gap-2'>
                              <button
                                onClick={() => handleDecision(pr.id, 'approved')}
                                className='btn btn-success btn-sm fw-bold px-3 py-1.5'
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecision(pr.id, 'rejected')}
                                className='btn btn-light-danger btn-sm fw-bold px-3 py-1.5'
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Create Requisition */}
        {showAddPrModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-600px'>
              <div className='modal-content border-0 rounded shadow-lg'>
                <div className='modal-header pb-0 border-0 justify-content-end'>
                  <button onClick={() => setShowAddPrModal(false)} className='btn btn-icon btn-active-color-primary'>✕</button>
                </div>
                <div className='modal-body px-10 pt-0 pb-10'>
                  <form onSubmit={handlePrSubmit} className='form'>
                    <div className='mb-6 text-center'>
                      <h2 className='mb-2'>New Purchase Requisition</h2>
                      <p className='text-gray-500 fs-7'>File a requisition order to replenish stock or purchase board components</p>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-8'>
                        <label className='form-label fw-bold fs-7 required'>Item Name / Specification</label>
                        <select
                          value={prForm.item}
                          onChange={(e) => setPrForm({ ...prForm, item: e.target.value })}
                          className='form-select form-select-solid'
                        >
                          <option>Chip Capacitors 100nf (SMD-0805)</option>
                          <option>A/D converter IC CS5530 (TSSOP20)</option>
                          <option>Calibration standard Weight Box 1Kg</option>
                          <option>Display Board Assembly (AE-1000)</option>
                          <option>Microcontroller STM32H743IIT6</option>
                        </select>
                      </div>
                      <div className='col-md-4'>
                        <label className='form-label fw-bold fs-7'>Unit</label>
                        <select
                          value={prForm.unit}
                          onChange={(e) => setPrForm({ ...prForm, unit: e.target.value })}
                          className='form-select form-select-solid'
                        >
                          <option value='Pcs'>Pieces (Pcs)</option>
                          <option value='Kgs'>Kilograms (Kgs)</option>
                          <option value='Sets'>Sets</option>
                        </select>
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Quantity Required</label>
                        <input
                          type='number'
                          value={prForm.qty || 1}
                          onChange={(e) => setPrForm({ ...prForm, qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                          className='form-control form-control-solid'
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Urgency / Priority</label>
                        <select
                          value={prForm.urgency}
                          onChange={(e) => setPrForm({ ...prForm, urgency: e.target.value as any })}
                          className='form-select form-select-solid'
                        >
                          <option value='low'>🟢 Low</option>
                          <option value='medium'>🟡 Medium</option>
                          <option value='high'>🔴 High</option>
                        </select>
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Requested By</label>
                        <input
                          type='text'
                          value={prForm.requestedBy || ''}
                          onChange={(e) => setPrForm({ ...prForm, requestedBy: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. Ramesh Patil'
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Department</label>
                        <select
                          value={prForm.dept}
                          onChange={(e) => setPrForm({ ...prForm, dept: e.target.value })}
                          className='form-select form-select-solid'
                        >
                          <option value='Production'>Production Department</option>
                          <option value='R&D'>R&D Lab</option>
                          <option value='Quality Control'>Quality Control</option>
                          <option value='Store'>Store Logistics</option>
                        </select>
                      </div>
                    </div>

                    <div className='mb-6'>
                      <label className='form-label fw-bold fs-7 required'>Reason for Requisition</label>
                      <textarea
                        value={prForm.reason || ''}
                        onChange={(e) => setPrForm({ ...prForm, reason: e.target.value })}
                        className='form-control form-control-solid'
                        rows={3}
                        placeholder='Explain shortfall or client dispatch urgency...'
                      />
                    </div>

                    <div className='d-flex justify-content-end gap-3'>
                      <button type='button' onClick={() => setShowAddPrModal(false)} className='btn btn-light'>Cancel</button>
                      <button type='submit' className='btn btn-primary'>File Requisition</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default PurchasePage
