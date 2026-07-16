import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'

interface CalibrationReading {
  nominal: string
  observed: string
  error: string
  uncertainty: string
}

interface CalibrationRecord {
  id: string
  certNo: string
  ulrNo: string
  calDate: string
  dueDate: string
  labLocation: string
  customer: string
  address: string
  instrument: string
  serialNo: string
  capacityRange: string
  leastCount: string
  refStandard: string
  stdCertNo: string
  envTempRH: string
  readings: CalibrationReading[]
  result: 'pass' | 'fail' | 'conditional'
  remarks: string
  calibratedBy: string
  approvedBy: string
  status: 'draft' | 'issued'
  branch?: string
}

const DEFAULT_CALIBRATION_DATA: CalibrationRecord[] = [
  {
    id: 'CAL-2026-001',
    certNo: 'ACI/CAL/2026/001',
    ulrNo: 'CC123456000000001F',
    calDate: '2026-06-10',
    dueDate: '2027-06-09',
    labLocation: 'Vasai Laboratory',
    customer: 'Macleods Pharmaceuticals Ltd',
    address: 'Plot 312, GIDC, Sarigam, Gujarat 396155',
    instrument: 'Radwag AS 220.X2 Analytical Balance',
    serialNo: 'RW-449122',
    capacityRange: '220g',
    leastCount: '0.1mg',
    refStandard: 'SS Weight Box Class E2, 1mg-200g',
    stdCertNo: 'NPL/WT/2026/3312',
    envTempRH: '23.4°C / 51% RH',
    readings: [
      { nominal: '10g', observed: '10.0001g', error: '+0.1mg', uncertainty: '±0.05mg' },
      { nominal: '50g', observed: '50.0003g', error: '+0.3mg', uncertainty: '±0.05mg' },
      { nominal: '100g', observed: '99.9997g', error: '-0.3mg', uncertainty: '±0.05mg' },
      { nominal: '200g', observed: '200.0004g', error: '+0.4mg', uncertainty: '±0.10mg' }
    ],
    result: 'pass',
    remarks: 'The balance calibration results satisfy operating parameters within limit.',
    calibratedBy: 'Priyanka Rane',
    approvedBy: 'Dr. S. K. Nair (Lab Head)',
    status: 'issued'
  }
]

const CalibrationPage: FC = () => {
  const [calList, setCalList] = useState<CalibrationRecord[]>([])
  const [viewState, setViewState] = useState<'list' | 'form' | 'detail'>('list')
  const [activeCalId, setActiveCalId] = useState<string | null>(null)
  
  // Filtering & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'due' | 'overdue'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [formData, setFormData] = useState<Partial<CalibrationRecord>>({
    certNo: '',
    ulrNo: '',
    calDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    labLocation: 'Vasai Laboratory',
    customer: '',
    address: '',
    instrument: '',
    serialNo: '',
    capacityRange: '',
    leastCount: '',
    refStandard: 'SS Weight Box Class F1, 1mg-200g',
    stdCertNo: '',
    envTempRH: '24°C / 50% RH',
    readings: [{ nominal: '', observed: '', error: '', uncertainty: '' }],
    result: 'pass',
    remarks: '',
    calibratedBy: '',
    approvedBy: '',
    status: 'draft'
  })

  useEffect(() => {
    const cached = localStorage.getItem('archerchem_calibration_list')
    if (cached) {
      try {
        setCalList(JSON.parse(cached))
      } catch (e) {
        setCalList(DEFAULT_CALIBRATION_DATA)
      }
    } else {
      setCalList(DEFAULT_CALIBRATION_DATA)
      localStorage.setItem('archerchem_calibration_list', JSON.stringify(DEFAULT_CALIBRATION_DATA))
    }
  }, [])

  const saveCals = (updated: CalibrationRecord[]) => {
    setCalList(updated)
    localStorage.setItem('archerchem_calibration_list', JSON.stringify(updated))
  }

  // Reading Rows Management
  const handleReadingChange = (index: number, field: keyof CalibrationReading, val: string) => {
    const updated = [...(formData.readings || [])]
    updated[index] = { ...updated[index], [field]: val }
    setFormData({ ...formData, readings: updated })
  }

  const addReadingRow = () => {
    setFormData({
      ...formData,
      readings: [...(formData.readings || []), { nominal: '', observed: '', error: '', uncertainty: '' }]
    })
  }

  const removeReadingRow = (index: number) => {
    const updated = (formData.readings || []).filter((_, i) => i !== index)
    setFormData({ ...formData, readings: updated })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.certNo || !formData.customer || !formData.instrument) {
      toast.error('Certificate No, Customer, and Instrument Model are required.')
      return
    }

    let updated: CalibrationRecord[]
    if (activeCalId) {
      updated = calList.map((c) =>
        c.id === activeCalId ? { ...(c as CalibrationRecord), ...formData } as CalibrationRecord : c
      )
    } else {
      const nextId = `CAL-2026-${String(calList.length + 1).padStart(3, '0')}`
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const newRec: CalibrationRecord = {
        ...(formData as CalibrationRecord),
        id: nextId,
        branch: activeBranch,
        status: formData.status as CalibrationRecord['status'] || 'issued'
      }
      updated = [newRec, ...calList]
    }

    saveCals(updated)
    toast.success('Calibration Certificate saved successfully.')
    setViewState('list')
    setActiveCalId(null)
  }

  const triggerEdit = (rec: CalibrationRecord) => {
    setFormData(rec)
    setActiveCalId(rec.id)
    setViewState('form')
  }

  const selectedCal = calList.find((c) => c.id === activeCalId)

  // Filtering Logic
  const getFilteredList = () => {
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    return calList.filter((c) => {
      // Branch matches
      const recordBranch = c.branch || 'Vasai Factory (HQ)'
      if (recordBranch !== activeBranch) return false

      // Search matches
      const matchesSearch =
        c.certNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instrument.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      // Status Matches
      const today = new Date()
      const dueDate = new Date(c.dueDate)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (statusFilter === 'overdue') {
        return diffDays < 0
      }
      if (statusFilter === 'due') {
        return diffDays >= 0 && diffDays <= 30
      }
      if (statusFilter === 'valid') {
        return diffDays > 30
      }
      return true
    })
  }

  const filteredCals = getFilteredList()

  return (
    <>
      <PageTitle breadcrumbs={[]}>Calibration Certificates Laboratory</PageTitle>
      <Content>
        {/* VIEW 1: CERTIFICATE LIST */}
        {viewState === 'list' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold text-gray-900 fs-3'>NABL Calibration Records</span>
                <span className='text-gray-500 mt-1 fw-semibold fs-7'>Track balance traceabilities, check dates, and issue accredited certificates</span>
              </h3>
              <div className='card-toolbar'>
                <button
                  onClick={() => {
                    setFormData({
                      certNo: '', ulrNo: '', calDate: new Date().toISOString().split('T')[0],
                      dueDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
                      labLocation: 'Vasai Laboratory', customer: '', address: '', instrument: '', serialNo: '', capacityRange: '', leastCount: '',
                      refStandard: 'SS Weight Box Class F1, 1mg-200g', stdCertNo: '', envTempRH: '24°C / 50% RH',
                      readings: [{ nominal: '', observed: '', error: '', uncertainty: '' }], result: 'pass', remarks: '', calibratedBy: '', approvedBy: '', status: 'draft'
                    })
                    setActiveCalId(null)
                    setViewState('form')
                  }}
                  className='btn btn-primary btn-sm fw-bold'
                >
                  <i className='bi bi-plus-lg me-2'></i> New Calibration Cert
                </button>
              </div>
            </div>

            <div className='card-body pt-2'>
              {/* Filters & Search */}
              <div className='d-flex align-items-center justify-content-between flex-wrap gap-4 mb-6'>
                <div className='d-flex align-items-center gap-2'>
                  <button onClick={() => setStatusFilter('all')} className={`btn btn-sm px-4 py-2 fw-bold ${statusFilter === 'all' ? 'btn-primary' : 'btn-light'}`}>All</button>
                  <button onClick={() => setStatusFilter('valid')} className={`btn btn-sm px-4 py-2 fw-bold ${statusFilter === 'valid' ? 'btn-primary' : 'btn-light'}`}>✅ Valid</button>
                  <button onClick={() => setStatusFilter('due')} className={`btn btn-sm px-4 py-2 fw-bold ${statusFilter === 'due' ? 'btn-primary' : 'btn-light'}`}>⏰ Due Soon</button>
                  <button onClick={() => setStatusFilter('overdue')} className={`btn btn-sm px-4 py-2 fw-bold ${statusFilter === 'overdue' ? 'btn-primary' : 'btn-light'}`}>⚠️ Overdue</button>
                </div>
                <div className='position-relative w-300px'>
                  <span className='position-absolute ms-3 top-50 translate-middle-y'>🔍</span>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='form-control form-control-solid ps-10 py-2 fs-7'
                    placeholder='Search Cert No, Customer, Scale Model...'
                  />
                </div>
              </div>

              {/* Table */}
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8'>
                      <th>Cert Certificate No</th>
                      <th>Customer name</th>
                      <th>Scale / Model</th>
                      <th className='text-end'>Cal Date</th>
                      <th className='text-end'>Next Due Date</th>
                      <th className='text-end'>Status</th>
                      <th className='text-end'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className='text-center text-muted py-8'>No calibration records match selection.</td>
                      </tr>
                    ) : (
                      filteredCals.map((c) => {
                        const today = new Date()
                        const due = new Date(c.dueDate)
                        const isOverdue = due.getTime() < today.getTime()
                        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24))
                        const isDueSoon = diffDays >= 0 && diffDays <= 30

                        return (
                          <tr key={c.id}>
                            <td>
                              <span
                                onClick={() => {
                                  setActiveCalId(c.id)
                                  setViewState('detail')
                                }}
                                className='text-gray-900 fw-bold text-hover-primary cursor-pointer fs-6'
                              >
                                {c.certNo}
                              </span>
                              {c.ulrNo && (
                                <span className='text-muted fs-8 d-block'>ULR: {c.ulrNo}</span>
                              )}
                            </td>
                            <td>
                              <span className='text-gray-900 fw-bold fs-6'>{c.customer}</span>
                            </td>
                            <td>
                              <div className='d-flex flex-column'>
                                <span className='text-gray-800 fw-semibold fs-6'>{c.instrument}</span>
                                <span className='text-muted fs-8'>S/N: {c.serialNo}</span>
                              </div>
                            </td>
                            <td className='text-end text-muted fw-semibold fs-7'>{c.calDate}</td>
                            <td className='text-end text-muted fw-semibold fs-7'>{c.dueDate}</td>
                            <td className='text-end'>
                              {isOverdue ? (
                                <span className='badge badge-light-danger fw-bold px-3 py-1'>Overdue</span>
                              ) : isDueSoon ? (
                                <span className='badge badge-light-warning fw-bold px-3 py-1'>Due Soon</span>
                              ) : (
                                <span className='badge badge-light-success fw-bold px-3 py-1'>Valid</span>
                              )}
                            </td>
                            <td className='text-end'>
                              <div className='d-flex justify-content-end gap-2'>
                                <button
                                  onClick={() => {
                                    setActiveCalId(c.id)
                                    setViewState('detail')
                                  }}
                                  className='btn btn-icon btn-light-info btn-sm'
                                >
                                  <i className='bi bi-printer fs-5'></i>
                                </button>
                                <button
                                  onClick={() => triggerEdit(c)}
                                  className='btn btn-icon btn-light-primary btn-sm'
                                >
                                  <i className='bi bi-pencil fs-5'></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FORM CREATION & EDIT */}
        {viewState === 'form' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold text-gray-900 fs-3'>
                  {activeCalId ? `Edit Certificate ${formData.certNo}` : 'New NABL Calibration Certificate'}
                </span>
                <span className='text-gray-500 mt-1 fw-semibold fs-7'>Accredited laboratory calibration parameters registration</span>
              </h3>
              <div className='card-toolbar'>
                <button onClick={() => setViewState('list')} className='btn btn-sm btn-light fw-bold'>Cancel</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='form card-body pt-4'>
              {/* Section 1: Certificate Info */}
              <h5 className='text-gray-900 fw-bold fs-5 mb-4 border-bottom pb-2 text-primary'>📋 Certificate Registry</h5>
              <div className='row g-6 mb-6'>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Certificate No</label>
                  <input
                    type='text'
                    value={formData.certNo || ''}
                    onChange={(e) => setFormData({ ...formData, certNo: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='ACI/CAL/2026/001'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>ULR (NABL Registry) Number</label>
                  <input
                    type='text'
                    value={formData.ulrNo || ''}
                    onChange={(e) => setFormData({ ...formData, ulrNo: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='CC123456...'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Calibration Date</label>
                  <input
                    type='date'
                    value={formData.calDate || ''}
                    onChange={(e) => setFormData({ ...formData, calDate: e.target.value })}
                    className='form-control form-control-solid'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Next Due Date</label>
                  <input
                    type='date'
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className='form-control form-control-solid'
                  />
                </div>
              </div>

              {/* Section 2: Customer & Balance details */}
              <h5 className='text-gray-900 fw-bold fs-5 mb-4 border-bottom pb-2 text-primary'>👤 Instrument &amp; Customer</h5>
              <div className='row g-6 mb-6'>
                <div className='col-md-4'>
                  <label className='form-label fw-bold fs-7 required'>Customer Name</label>
                  <input
                    type='text'
                    value={formData.customer || ''}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='e.g. Macleods Pharma'
                  />
                </div>
                <div className='col-md-8'>
                  <label className='form-label fw-bold fs-7'>Customer Facility Address</label>
                  <input
                    type='text'
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='Full address'
                  />
                </div>
              </div>
              <div className='row g-6 mb-6'>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Balance Model</label>
                  <input
                    type='text'
                    value={formData.instrument || ''}
                    onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='e.g. Radwag AS 220.X2'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Serial Number</label>
                  <input
                    type='text'
                    value={formData.serialNo || ''}
                    onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='RW-449102'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Weighing Capacity</label>
                  <input
                    type='text'
                    value={formData.capacityRange || ''}
                    onChange={(e) => setFormData({ ...formData, capacityRange: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='220g'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Least Count (Division d)</label>
                  <input
                    type='text'
                    value={formData.leastCount || ''}
                    onChange={(e) => setFormData({ ...formData, leastCount: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='0.1mg'
                  />
                </div>
              </div>

              {/* Section 3: Standard & Environment */}
              <h5 className='text-gray-900 fw-bold fs-5 mb-4 border-bottom pb-2 text-primary'>⚖️ Traceability References</h5>
              <div className='row g-6 mb-6'>
                <div className='col-md-4'>
                  <label className='form-label fw-bold fs-7'>Reference Standard Used</label>
                  <input
                    type='text'
                    value={formData.refStandard || ''}
                    onChange={(e) => setFormData({ ...formData, refStandard: e.target.value })}
                    className='form-control form-control-solid'
                  />
                </div>
                <div className='col-md-4'>
                  <label className='form-label fw-bold fs-7'>Std Weight Cert No.</label>
                  <input
                    type='text'
                    value={formData.stdCertNo || ''}
                    onChange={(e) => setFormData({ ...formData, stdCertNo: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='NPL/WT/...'
                  />
                </div>
                <div className='col-md-4'>
                  <label className='form-label fw-bold fs-7'>Environment Temp/RH</label>
                  <input
                    type='text'
                    value={formData.envTempRH || ''}
                    onChange={(e) => setFormData({ ...formData, envTempRH: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='24°C / 50% RH'
                  />
                </div>
              </div>

              {/* Section 4: Readings dynamic rows */}
              <div className='card border border-dashed border-gray-300 mb-6 bg-light-neutral p-6'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                  <span className='fw-bold text-gray-800 fs-5'>📊 Calibration Observations Readings</span>
                  <button type='button' onClick={addReadingRow} className='btn btn-light-primary btn-sm fw-bold'>
                    + Add Reading Row
                  </button>
                </div>

                {(formData.readings || []).map((row, idx) => (
                  <div key={idx} className='row g-4 mb-3 align-items-center'>
                    <div className='col-md-3'>
                      <input
                        type='text'
                        value={row.nominal}
                        onChange={(e) => handleReadingChange(idx, 'nominal', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='Nominal Load (e.g. 100g)'
                      />
                    </div>
                    <div className='col-md-3'>
                      <input
                        type='text'
                        value={row.observed}
                        onChange={(e) => handleReadingChange(idx, 'observed', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='Observed Weight'
                      />
                    </div>
                    <div className='col-md-3'>
                      <input
                        type='text'
                        value={row.error}
                        onChange={(e) => handleReadingChange(idx, 'error', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='Error margin (+0.2mg)'
                      />
                    </div>
                    <div className='col-md-2'>
                      <input
                        type='text'
                        value={row.uncertainty}
                        onChange={(e) => handleReadingChange(idx, 'uncertainty', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='Uncertainty (±0.05mg)'
                      />
                    </div>
                    <div className='col-md-1 text-end'>
                      <button
                        type='button'
                        onClick={() => removeReadingRow(idx)}
                        disabled={(formData.readings || []).length <= 1}
                        className='btn btn-icon btn-light-danger btn-sm'
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Remarks, signatories */}
              <div className='row g-6 mb-6'>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Calibrated By (Engineer)</label>
                  <input
                    type='text'
                    value={formData.calibratedBy || ''}
                    onChange={(e) => setFormData({ ...formData, calibratedBy: e.target.value })}
                    className='form-control form-control-solid'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Approved Signatory (Head)</label>
                  <input
                    type='text'
                    value={formData.approvedBy || ''}
                    onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                    className='form-control form-control-solid'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Verification Result</label>
                  <select
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value as any })}
                    className='form-select form-select-solid'
                  >
                    <option value='pass'>Pass - Meets Tolerance Limits</option>
                    <option value='conditional'>Conditional Pass (Check remarks)</option>
                    <option value='fail'>Fail - Out of Spec</option>
                  </select>
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Status Option</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className='form-select form-select-solid'
                  >
                    <option value='draft'>Draft Record</option>
                    <option value='issued'>Issue Certificate</option>
                  </select>
                </div>
              </div>

              <div className='mb-6'>
                <label className='form-label fw-bold fs-7'>Overall observations / remarks</label>
                <input
                  type='text'
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className='form-control form-control-solid'
                  placeholder='e.g. Standard calibration completed'
                />
              </div>

              {/* Actions */}
              <div className='d-flex justify-content-end gap-3 pt-6 border-top'>
                <button type='button' onClick={() => setViewState('list')} className='btn btn-light'>Cancel</button>
                <button type='submit' className='btn btn-primary fw-bold'>Save Calibration Certificate</button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: DETAIL & PRINT CERTIFICATE */}
        {viewState === 'detail' && selectedCal && (
          <div className='row g-6'>
            <div className='col-lg-4'>
              <div className='card border-0 shadow-sm mb-6'>
                <div className='card-header pt-6'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>Certificate Actions</h3>
                </div>
                <div className='card-body d-flex flex-column gap-3'>
                  <button onClick={() => window.print()} className='btn btn-primary fw-bold w-100'>
                    🖨️ Open Browser Print Panel
                  </button>
                  <button onClick={() => triggerEdit(selectedCal)} className='btn btn-light-primary fw-bold w-100'>
                    ✏️ Edit Certificate
                  </button>
                  <button onClick={() => setViewState('list')} className='btn btn-light w-100'>
                    ← Back to Directory
                  </button>
                </div>
              </div>

              {/* Lab Metadata Info */}
              <div className='card border-0 shadow-sm'>
                <div className='card-body pt-6 fs-7'>
                  <div className='mb-4'>
                    <span className='text-muted d-block'>NABL Accreditation Location:</span>
                    <strong className='text-gray-800'>{selectedCal.labLocation}</strong>
                  </div>
                  <div className='mb-4'>
                    <span className='text-muted d-block'>Reference Standard Weights:</span>
                    <strong className='text-gray-800'>{selectedCal.refStandard}</strong>
                    <span className='text-muted d-block fs-8'>Cert: {selectedCal.stdCertNo}</span>
                  </div>
                  <div>
                    <span className='text-muted d-block'>Certificate Result:</span>
                    <span className={`badge badge-light-${selectedCal.result === 'pass' ? 'success' : 'danger'} fw-bold px-3 py-1 text-capitalize mt-1`}>
                      {selectedCal.result}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print certificate container */}
            <div className='col-lg-8' id='printable-area'>
              <div
                className='card border shadow-lg p-12 rounded bg-white'
                style={{
                  minHeight: '297mm',
                  fontFamily: "'Georgia', serif",
                  color: '#222',
                  borderTop: '10px double #047857',
                  borderBottom: '10px double #047857'
                }}
              >
                {/* Laboratory header */}
                <div className='text-center border-bottom pb-6 mb-6'>
                  <div className='d-flex align-items-center justify-content-center gap-2 mb-2'>
                    <span className='fs-2 border border-2 border-success p-2 rounded text-success fw-bold'>A·C·I</span>
                    <span className='fs-2 fw-bolder text-success text-uppercase letter-spacing-1'>ARCHERCAL CALIBRATION LABORATORY</span>
                  </div>
                  <span className='text-muted fs-8 d-block'>
                    NABL Accredited Calibration Services · ISO/IEC 17025 Certified
                  </span>
                  <span className='text-muted fs-8 d-block mt-0.5'>
                    Unit 12, N. G. Industrial Park, Vasai East, Thane, Maharashtra - 401208
                  </span>
                </div>

                <div className='text-center mb-8'>
                  <h3 className='fw-bold fs-4 text-decoration-underline text-success letter-spacing-2 m-0'>CALIBRATION CERTIFICATE</h3>
                </div>

                {/* Certificate Meta table info */}
                <div className='row g-6 mb-6 fs-7 pb-4 border-bottom border-gray-300'>
                  <div className='col-6'>
                    <span className='text-muted d-block'>Certificate Number:</span>
                    <strong className='text-dark fs-6'>{selectedCal.certNo}</strong>
                  </div>
                  <div className='col-6 text-end'>
                    <span className='text-muted d-block'>ULR Number (NABL ID):</span>
                    <strong className='text-dark fs-6'>{selectedCal.ulrNo || 'N/A'}</strong>
                  </div>
                  <div className='col-6'>
                    <span className='text-muted d-block'>Date of Calibration:</span>
                    <strong className='text-dark'>{selectedCal.calDate}</strong>
                  </div>
                  <div className='col-6 text-end'>
                    <span className='text-muted d-block'>Next Calibration Due:</span>
                    <strong className='text-dark'>{selectedCal.dueDate}</strong>
                  </div>
                </div>

                {/* Customer Details */}
                <div className='row g-6 mb-6 fs-7'>
                  <div className='col-md-6'>
                    <span className='text-muted d-block mb-1 text-uppercase fw-semibold' style={{ color: '#047857' }}>Consignee Customer:</span>
                    <strong className='text-dark fs-6 d-block mb-1'>{selectedCal.customer}</strong>
                    <span className='text-gray-700'>{selectedCal.address}</span>
                  </div>
                  <div className='col-md-6 border-start ps-6'>
                    <span className='text-muted d-block mb-1 text-uppercase fw-semibold' style={{ color: '#047857' }}>Instrument Details:</span>
                    <div className='d-flex flex-column gap-1'>
                      <div>Name / Model: <strong className='text-dark'>{selectedCal.instrument}</strong></div>
                      <div>Serial Number: <strong>{selectedCal.serialNo}</strong></div>
                      <div>Capacity Capacity: <strong>{selectedCal.capacityRange}</strong></div>
                      <div>Least division division: <strong>{selectedCal.leastCount}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Traceability references standard */}
                <div className='bg-light p-4 rounded mb-6 fs-8 border'>
                  <span className='fw-bold text-success text-uppercase d-block mb-2'>Traceability Specifications</span>
                  <div className='row g-2 text-gray-800'>
                    <div className='col-4'>Reference Weights: <strong>{selectedCal.refStandard}</strong></div>
                    <div className='col-4'>Reference Std Cert: <strong>{selectedCal.stdCertNo}</strong></div>
                    <div className='col-4'>Environment Temp/RH: <strong>{selectedCal.envTempRH}</strong></div>
                  </div>
                </div>

                {/* Main readings table */}
                <div className='mb-8'>
                  <span className='fw-bold text-success text-uppercase d-block fs-7 mb-2'>Calibration Readings &amp; Observed Errors</span>
                  <div className='table-responsive'>
                    <table className='table table-bordered border-gray-400 align-middle gs-4 gy-2 fs-7 mb-0'>
                      <thead style={{ backgroundColor: '#ecfdf5' }}>
                        <tr className='fw-bold text-dark border-bottom border-gray-400'>
                          <th className='text-center' style={{ width: '50px' }}>Sr</th>
                          <th className='text-end'>Nominal Load Applied</th>
                          <th className='text-end'>Observed Displayed Value</th>
                          <th className='text-end'>Indicated Error Offset</th>
                          <th className='text-end'>Measurement Uncertainty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCal.readings.map((r, idx) => (
                          <tr key={idx} className='border-bottom'>
                            <td className='text-center fw-bold'>{idx + 1}</td>
                            <td className='text-end fw-bold text-dark'>{r.nominal}</td>
                            <td className='text-end text-dark'>{r.observed}</td>
                            <td className={`text-end fw-bold ${r.error.startsWith('-') ? 'text-primary' : 'text-danger'}`}>{r.error}</td>
                            <td className='text-end text-muted font-monospace'>{r.uncertainty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom sign off */}
                <div className='mt-auto pt-8 border-top row g-6 fs-7 align-items-end'>
                  <div className='col-7'>
                    <span className='text-muted d-block'>Result Calibration Verdict:</span>
                    <strong className='text-uppercase text-success fs-6 d-block mb-2'>
                      {selectedCal.result === 'pass'
                        ? 'Passed — Within tolerance'
                        : selectedCal.result === 'conditional'
                        ? 'Conditional Pass'
                        : 'Failed — Out of spec'}
                    </strong>
                    <span className='text-muted fs-8 d-block italic'>{selectedCal.remarks}</span>
                  </div>
                  <div className='col-5 text-end'>
                    <div className='mb-15'>
                      <span className='text-muted d-block'>Authorized Technical Inspector</span>
                      <strong className='text-gray-900'>{selectedCal.calibratedBy}</strong>
                    </div>
                    <div className='border-top pt-1 text-muted fs-8'>
                      Approved By: {selectedCal.approvedBy}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default CalibrationPage
