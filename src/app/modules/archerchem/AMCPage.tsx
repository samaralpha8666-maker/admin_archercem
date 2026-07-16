import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'

interface AmcContract {
  id: string
  customer: string
  model: string
  serialNo: string
  startDate: string
  endDate: string
  value: string
  frequency: string
  status: 'active' | 'expired' | 'due_soon'
  branch?: string
}

interface ServiceTicket {
  id: string
  customer: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'pending' | 'resolved'
  assignedTo: string
  createdAt: string
  branch?: string
}

const DEFAULT_AMC: AmcContract[] = [
  { id: 'AMC-2026-001', customer: 'Sun Pharma Industries', model: 'AE-1000', serialNo: 'AC-98721', startDate: '2026-01-01', endDate: '2026-12-31', value: '₹25,000', frequency: 'Quarterly', status: 'active' },
  { id: 'AMC-2026-002', customer: 'Cipla Ltd Goa Unit', model: 'WPS-500', serialNo: 'RW-22104', startDate: '2025-08-01', endDate: '2026-07-31', value: '₹40,000', frequency: 'Half-yearly', status: 'due_soon' },
  { id: 'AMC-2026-003', customer: 'GlaxoSmithKline Nashik', model: 'TP-2000', serialNo: 'TP-38012', startDate: '2025-01-01', endDate: '2025-12-31', value: '₹18,000', frequency: 'Annual', status: 'expired' }
]

const DEFAULT_TICKETS: ServiceTicket[] = [
  { id: 'TKT-101', customer: 'Sun Pharma Industries', description: 'Scale AE-1000 showing creep variance of +0.05g under stable environment.', priority: 'high', status: 'open', assignedTo: 'Suresh Nair', createdAt: '2026-07-15' },
  { id: 'TKT-102', customer: 'Apollo Hospitals', description: 'Printer alignment offset on model WPS-500. Output receipt fonts wrapping.', priority: 'medium', status: 'pending', assignedTo: 'Rahul Mehta', createdAt: '2026-07-16' },
  { id: 'TKT-103', customer: 'Macleods Pharmaceuticals', description: 'Routine calibration checklist validation.', priority: 'low', status: 'resolved', assignedTo: 'Suresh Nair', createdAt: '2026-07-12' }
]

const AMCPage: FC = () => {
  const [amcList, setAmcList] = useState<AmcContract[]>([])
  const [ticketList, setTicketList] = useState<ServiceTicket[]>([])
  const [activeTab, setActiveTab] = useState<'amc' | 'tickets'>('amc')

  // Form Modals
  const [showAmcModal, setShowAmcModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)

  // Form states
  const [amcForm, setAmcForm] = useState<Partial<AmcContract>>({
    customer: '', model: '', serialNo: '', startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    value: '', frequency: 'Quarterly', status: 'active'
  })

  const [tktForm, setTktForm] = useState<Partial<ServiceTicket>>({
    customer: '', description: '', priority: 'medium', status: 'open', assignedTo: ''
  })

  useEffect(() => {
    const cachedAmc = localStorage.getItem('archerchem_amc_list')
    const cachedTkt = localStorage.getItem('archerchem_ticket_list')
    
    if (cachedAmc) {
      try { setAmcList(JSON.parse(cachedAmc)) } catch (e) { setAmcList(DEFAULT_AMC) }
    } else {
      setAmcList(DEFAULT_AMC)
      localStorage.setItem('archerchem_amc_list', JSON.stringify(DEFAULT_AMC))
    }

    if (cachedTkt) {
      try { setTicketList(JSON.parse(cachedTkt)) } catch (e) { setTicketList(DEFAULT_TICKETS) }
    } else {
      setTicketList(DEFAULT_TICKETS)
      localStorage.setItem('archerchem_ticket_list', JSON.stringify(DEFAULT_TICKETS))
    }
  }, [])

  const saveAMC = (updated: AmcContract[]) => {
    setAmcList(updated)
    localStorage.setItem('archerchem_amc_list', JSON.stringify(updated))
  }

  const saveTkts = (updated: ServiceTicket[]) => {
    setTicketList(updated)
    localStorage.setItem('archerchem_ticket_list', JSON.stringify(updated))
  }

  // AMC Submit
  const handleAmcSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amcForm.customer || !amcForm.model || !amcForm.value) {
      toast.error('Please fill customer, model and value details.')
      return
    }

    const nextId = `AMC-2026-${String(amcList.length + 1).padStart(3, '0')}`
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    const newRec: AmcContract = {
      ...(amcForm as AmcContract),
      id: nextId,
      branch: activeBranch,
      status: 'active'
    }

    saveAMC([newRec, ...amcList])
    toast.success(`AMC Contract registered successfully for ${newRec.customer}.`)
    setShowAmcModal(false)
    setAmcForm({
      customer: '', model: '', serialNo: '', startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      value: '', frequency: 'Quarterly', status: 'active'
    })
  }

  // Ticket Submit
  const handleTktSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tktForm.customer || !tktForm.description) {
      toast.error('Please fill customer and description.')
      return
    }

    const nextId = `TKT-${100 + ticketList.length + 1}`
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    const newRec: ServiceTicket = {
      ...(tktForm as ServiceTicket),
      id: nextId,
      branch: activeBranch,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'open'
    }

    saveTkts([newRec, ...ticketList])
    toast.success(`Complaint Ticket ${nextId} has been logged.`)
    setShowTicketModal(false)
    setTktForm({ customer: '', description: '', priority: 'medium', status: 'open', assignedTo: '' })
  }

  const handleTicketStatusChange = (id: string, status: ServiceTicket['status']) => {
    const updated = ticketList.map((t) =>
      t.id === id ? { ...t, status } : t
    )
    saveTkts(updated)
    toast.success(`Ticket ${id} status updated to ${status}.`)
  }

  const filteredAmcs = amcList.filter((c) => {
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    const recordBranch = c.branch || 'Vasai Factory (HQ)'
    return recordBranch === activeBranch
  })

  const filteredTickets = ticketList.filter((t) => {
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    const recordBranch = t.branch || 'Vasai Factory (HQ)'
    return recordBranch === activeBranch
  })

  return (
    <>
      <PageTitle breadcrumbs={[]}>Service Tickets &amp; AMC Tracker</PageTitle>
      <Content>
        {/* Navigation Tabs */}
        <div className='card mb-6 border-0 shadow-sm'>
          <div className='card-body py-2 d-flex justify-content-between align-items-center flex-wrap gap-4'>
            <div className='d-flex align-items-center gap-3'>
              <button
                onClick={() => setActiveTab('amc')}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  activeTab === 'amc' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                🛠️ AMC Contracts Directory
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  activeTab === 'tickets' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                🎫 Service Complaints Tickets
              </button>
            </div>

            <div>
              {activeTab === 'amc' ? (
                <button onClick={() => setShowAmcModal(true)} className='btn btn-primary btn-sm fw-bold'>
                  + Register AMC Agreement
                </button>
              ) : (
                <button onClick={() => setShowTicketModal(true)} className='btn btn-danger btn-sm fw-bold'>
                  + Log Service Complaint
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab 1: AMC List */}
        {activeTab === 'amc' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title fw-bold text-gray-900 fs-3'>Annual Maintenance Contracts (AMC)</h3>
            </div>
            <div className='card-body pt-2'>
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8'>
                      <th>Contract ID</th>
                      <th>Customer Name</th>
                      <th>Instrument / Serial</th>
                      <th>Validity Period</th>
                      <th>Contract Value</th>
                      <th className='text-end'>Maintenance Frequency</th>
                      <th className='text-end'>Contract Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAmcs.map((c) => (
                      <tr key={c.id}>
                        <td><span className='text-gray-900 fw-bold fs-6'>{c.id}</span></td>
                        <td><span className='text-gray-900 fw-bold fs-6'>{c.customer}</span></td>
                        <td>
                          <div className='d-flex flex-column'>
                            <span className='text-gray-800 fw-semibold'>{c.model}</span>
                            <span className='text-muted fs-8'>S/N: {c.serialNo || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <span className='text-muted fs-7'>{c.startDate} to {c.endDate}</span>
                        </td>
                        <td className='fw-bold text-gray-800'>{c.value}</td>
                        <td className='text-end fw-semibold text-gray-700'>{c.frequency}</td>
                        <td className='text-end'>
                          <span
                            className={`badge badge-light-${
                              c.status === 'active'
                                ? 'success'
                                : c.status === 'due_soon'
                                ? 'warning'
                                : 'danger'
                            } fw-bold px-3 py-1`}
                          >
                            {c.status === 'active' ? 'Active' : c.status === 'due_soon' ? 'Expiring soon' : 'Expired'}
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

        {/* Tab 2: Tickets list */}
        {activeTab === 'tickets' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title fw-bold text-gray-900 fs-3'>Customer Service Complaints Tickets</h3>
            </div>
            <div className='card-body pt-2'>
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8'>
                      <th>Ticket ID</th>
                      <th>Customer</th>
                      <th className='min-w-200px'>Complaint Description</th>
                      <th>Priority</th>
                      <th>Assigned Tech</th>
                      <th className='text-end'>Logged Date</th>
                      <th className='text-end'>Complaint Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((t) => (
                      <tr key={t.id}>
                        <td><span className='text-gray-900 fw-bold fs-6'>{t.id}</span></td>
                        <td><span className='text-gray-900 fw-bold fs-6'>{t.customer}</span></td>
                        <td>
                          <span className='text-gray-700 fs-7 fw-medium d-block text-truncate' style={{ maxWidth: '280px' }} title={t.description}>
                            {t.description}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-light-${t.priority === 'high' ? 'danger text-danger' : t.priority === 'medium' ? 'warning text-warning' : 'primary text-primary'} fw-bold px-2 py-0.5 fs-8`}>
                            {t.priority}
                          </span>
                        </td>
                        <td><span className='text-gray-900 fw-semibold fs-7'>{t.assignedTo || 'Unassigned'}</span></td>
                        <td className='text-end text-muted fs-7'>{t.createdAt}</td>
                        <td className='text-end'>
                          <select
                            value={t.status}
                            onChange={(e) => handleTicketStatusChange(t.id, e.target.value as any)}
                            className={`form-select form-select-solid form-select-sm fw-bold d-inline-block w-120px text-capitalize ${
                              t.status === 'resolved' ? 'text-success' : t.status === 'pending' ? 'text-warning' : 'text-danger'
                            }`}
                          >
                            <option value='open'>🔴 Open</option>
                            <option value='pending'>🟡 Pending</option>
                            <option value='resolved'>🟢 Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: New AMC Register */}
        {showAmcModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-600px'>
              <div className='modal-content rounded border-0'>
                <div className='modal-header pb-0 border-0 justify-content-end'>
                  <button onClick={() => setShowAmcModal(false)} className='btn btn-icon btn-active-color-primary'>✕</button>
                </div>
                <div className='modal-body px-10 pt-0 pb-10'>
                  <form onSubmit={handleAmcSubmit} className='form'>
                    <div className='mb-6 text-center'>
                      <h2 className='mb-2'>Register AMC Contract</h2>
                      <p className='text-gray-500 fs-7'>Register annual calibration/service check contracts for customer balances</p>
                    </div>

                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 required'>Customer Name</label>
                      <input
                        type='text'
                        value={amcForm.customer || ''}
                        onChange={(e) => setAmcForm({ ...amcForm, customer: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. Cipla Ltd'
                      />
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-7 required'>Instrument Model</label>
                        <input
                          type='text'
                          value={amcForm.model || ''}
                          onChange={(e) => setAmcForm({ ...amcForm, model: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. AE-1000'
                        />
                      </div>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-7'>Serial Number</label>
                        <input
                          type='text'
                          value={amcForm.serialNo || ''}
                          onChange={(e) => setAmcForm({ ...amcForm, serialNo: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='S/N code'
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-7 required'>Start Date</label>
                        <input
                          type='date'
                          value={amcForm.startDate || ''}
                          onChange={(e) => setAmcForm({ ...amcForm, startDate: e.target.value })}
                          className='form-control form-control-solid'
                        />
                      </div>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-7 required'>End Date</label>
                        <input
                          type='date'
                          value={amcForm.endDate || ''}
                          onChange={(e) => setAmcForm({ ...amcForm, endDate: e.target.value })}
                          className='form-control form-control-solid'
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-6'>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-7 required'>Contract Value (Annual)</label>
                        <input
                          type='text'
                          value={amcForm.value || ''}
                          onChange={(e) => setAmcForm({ ...amcForm, value: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. ₹25,000'
                        />
                      </div>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-7'>Service Visit Frequency</label>
                        <select
                          value={amcForm.frequency}
                          onChange={(e) => setAmcForm({ ...amcForm, frequency: e.target.value })}
                          className='form-select form-select-solid'
                        >
                          <option value='Quarterly'>Quarterly (4 visits)</option>
                          <option value='Half-yearly'>Half-yearly (2 visits)</option>
                          <option value='Annual'>Annual (1 visit)</option>
                        </select>
                      </div>
                    </div>

                    <div className='d-flex justify-content-end gap-3'>
                      <button type='button' onClick={() => setShowAmcModal(false)} className='btn btn-light'>Cancel</button>
                      <button type='submit' className='btn btn-primary'>Register Agreement</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: New Ticket complaint */}
        {showTicketModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-500px'>
              <div className='modal-content rounded border-0'>
                <div className='modal-header pb-0 border-0 justify-content-end'>
                  <button onClick={() => setShowTicketModal(false)} className='btn btn-icon btn-active-color-primary'>✕</button>
                </div>
                <div className='modal-body px-10 pt-0 pb-10'>
                  <form onSubmit={handleTktSubmit} className='form'>
                    <div className='mb-6 text-center'>
                      <h2 className='mb-2'>Log Service Complaint</h2>
                      <p className='text-gray-500 fs-7'>Log scale malfunction or calibration drift complaints</p>
                    </div>

                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 required'>Customer Name</label>
                      <input
                        type='text'
                        value={tktForm.customer || ''}
                        onChange={(e) => setTktForm({ ...tktForm, customer: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. Apollo Hospitals'
                      />
                    </div>

                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 required'>Complaint Description</label>
                      <textarea
                        value={tktForm.description || ''}
                        onChange={(e) => setTktForm({ ...tktForm, description: e.target.value })}
                        className='form-control form-control-solid'
                        rows={4}
                        placeholder='Details of drift variance, hardware damage, or error offset codes...'
                      />
                    </div>

                    <div className='row g-4 mb-6'>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-7'>Priority Urgency</label>
                        <select
                          value={tktForm.priority}
                          onChange={(e) => setTktForm({ ...tktForm, priority: e.target.value as any })}
                          className='form-select form-select-solid'
                        >
                          <option value='low'>🟢 Low</option>
                          <option value='medium'>🟡 Medium</option>
                          <option value='high'>🔴 High</option>
                        </select>
                      </div>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-7'>Assigned Tech Specialist</label>
                        <input
                          type='text'
                          value={tktForm.assignedTo || ''}
                          onChange={(e) => setTktForm({ ...tktForm, assignedTo: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. Suresh Nair'
                        />
                      </div>
                    </div>

                    <div className='d-flex justify-content-end gap-3'>
                      <button type='button' onClick={() => setShowTicketModal(false)} className='btn btn-light'>Cancel</button>
                      <button type='submit' className='btn btn-danger'>File Complaint Ticket</button>
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

export default AMCPage
