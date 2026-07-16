import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'

interface EccPoint {
  point: string
  disp: string
  err: string
}

interface RepeatRow {
  disp: string
  err: string
}

interface LinPoint {
  load: string
  dispInc: string
  errInc: string
  dispDec: string
  errDec: string
}

interface QCRecord {
  id: string
  model: string
  srNo: string
  capacity: string
  swVer: string
  readability: string
  interval: string
  calWt: string
  issueDate: string
  testedBy: string
  designation: string
  remarks: string
  status: 'draft' | 'submitted'
  eccPoints: EccPoint[]
  creepReadings: string[]
  creepDiff: string
  repeatLoad: string
  repeatTol: string
  repeatRows: RepeatRow[]
  repeatMaxDiff: string
  repeatSD: string
  linRows: LinPoint[]
  linMaxDiff: string
  branch?: string
}

const DEFAULT_QC_DATA: QCRecord[] = [
  {
    id: 'QC-2026-1001',
    model: 'AE-1000',
    srNo: 'AC-98721',
    capacity: '1000g',
    swVer: 'V1.02',
    readability: '0.01g',
    interval: '0.1g',
    calWt: '1000g Std',
    issueDate: '2026-06-15',
    testedBy: 'Ramesh Patil',
    designation: 'QC Head',
    remarks: 'Approved. Scale is linear within limit.',
    status: 'submitted',
    eccPoints: [
      { point: 'A (Center)', disp: '200.00', err: '0.00' },
      { point: 'B (Back Left)', disp: '200.01', err: '+0.01' },
      { point: 'C (Back Right)', disp: '200.00', err: '0.00' },
      { point: 'D (Front Right)', disp: '199.99', err: '-0.01' },
      { point: 'E (Front Left)', disp: '200.00', err: '0.00' },
    ],
    creepReadings: ['0.00', '500.00', '1000.01', '500.00', '0.00'],
    creepDiff: '0.01g',
    repeatLoad: '500g',
    repeatTol: '0.05g',
    repeatRows: [
      { disp: '500.00', err: '0.00' },
      { disp: '500.01', err: '+0.01' },
      { disp: '500.00', err: '0.00' },
      { disp: '499.99', err: '-0.01' },
      { disp: '500.00', err: '0.00' },
      { disp: '500.00', err: '0.00' },
      { disp: '500.01', err: '+0.01' },
      { disp: '500.00', err: '0.00' },
      { disp: '499.99', err: '-0.01' },
      { disp: '500.00', err: '0.00' },
    ],
    repeatMaxDiff: '0.02g',
    repeatSD: '0.007g',
    linRows: [
      { load: '200', dispInc: '200.00', errInc: '0.00', dispDec: '200.00', errDec: '0.00' },
      { load: '400', dispInc: '400.01', errInc: '+0.01', dispDec: '400.01', errDec: '+0.01' },
      { load: '600', dispInc: '600.01', errInc: '+0.01', dispDec: '600.02', errDec: '+0.02' },
      { load: '800', dispInc: '800.02', errInc: '+0.02', dispDec: '800.02', errDec: '+0.02' },
      { load: '1000', dispInc: '1000.02', errInc: '+0.02', dispDec: '1000.02', errDec: '+0.02' },
    ],
    linMaxDiff: '0.02g'
  }
]

const QCPage: FC = () => {
  const [qcList, setQcList] = useState<QCRecord[]>([])
  const [viewState, setViewState] = useState<'list' | 'form' | 'detail'>('list')
  const [activeQcId, setActiveQcId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [formData, setFormData] = useState<Partial<QCRecord>>({
    model: '',
    srNo: '',
    capacity: '',
    swVer: 'V1.0',
    readability: '0.1g',
    interval: '1g',
    calWt: '',
    issueDate: new Date().toISOString().split('T')[0],
    testedBy: '',
    designation: 'QC Engineer',
    remarks: '',
    status: 'draft',
    eccPoints: [
      { point: 'A (Center)', disp: '', err: '' },
      { point: 'B (Back Left)', disp: '', err: '' },
      { point: 'C (Back Right)', disp: '', err: '' },
      { point: 'D (Front Right)', disp: '', err: '' },
      { point: 'E (Front Left)', disp: '', err: '' },
    ],
    creepReadings: ['', '', '', '', ''],
    creepDiff: '0g',
    repeatLoad: '',
    repeatTol: '',
    repeatRows: Array(10).fill(null).map(() => ({ disp: '', err: '' })),
    repeatMaxDiff: '',
    repeatSD: '',
    linRows: [
      { load: '20%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
      { load: '40%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
      { load: '60%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
      { load: '80%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
      { load: '100%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
    ],
    linMaxDiff: ''
  })

  useEffect(() => {
    const cached = localStorage.getItem('archerchem_qc_list')
    if (cached) {
      try {
        setQcList(JSON.parse(cached))
      } catch (e) {
        setQcList(DEFAULT_QC_DATA)
      }
    } else {
      setQcList(DEFAULT_QC_DATA)
      localStorage.setItem('archerchem_qc_list', JSON.stringify(DEFAULT_QC_DATA))
    }
  }, [])

  const saveQCs = (updated: QCRecord[]) => {
    setQcList(updated)
    localStorage.setItem('archerchem_qc_list', JSON.stringify(updated))
  }

  // Automated repeatability calculators (S.D. & Max difference)
  const calculateRepeatability = (rows: RepeatRow[]) => {
    const values = rows
      .map((r) => parseFloat(r.disp))
      .filter((v) => !isNaN(v))

    if (values.length === 0) return { maxDiff: '', sd: '' }

    const max = Math.max(...values)
    const min = Math.min(...values)
    const maxDiff = (max - min).toFixed(4)

    // Standard deviation
    if (values.length < 2) return { maxDiff: `${maxDiff}g`, sd: '0.0000g' }
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const sumSq = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0)
    const sd = Math.sqrt(sumSq / (values.length - 1)).toFixed(4)

    return { maxDiff: `${maxDiff}g`, sd: `${sd}g` }
  }

  const handleRepeatValueChange = (index: number, dispVal: string) => {
    const updatedRows = [...(formData.repeatRows || [])]
    updatedRows[index] = { ...updatedRows[index], disp: dispVal }
    
    // Auto calculate max diff and standard deviation
    const { maxDiff, sd } = calculateRepeatability(updatedRows)
    setFormData({
      ...formData,
      repeatRows: updatedRows,
      repeatMaxDiff: maxDiff,
      repeatSD: sd
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.model || !formData.srNo) {
      toast.error('Model and Serial Number are required.')
      return
    }

    let updated: QCRecord[]
    if (activeQcId) {
      updated = qcList.map((q) =>
        q.id === activeQcId ? { ...(q as QCRecord), ...formData } as QCRecord : q
      )
    } else {
      const nextId = `QC-2026-${1000 + qcList.length + 1}`
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const newRec: QCRecord = {
        ...(formData as QCRecord),
        id: nextId,
        branch: activeBranch,
        status: formData.status as QCRecord['status'] || 'submitted',
      }
      updated = [newRec, ...qcList]
    }

    saveQCs(updated)
    toast.success('QC Test Report saved successfully.')
    setViewState('list')
    setActiveQcId(null)
  }

  const triggerEdit = (rec: QCRecord) => {
    setFormData(rec)
    setActiveQcId(rec.id)
    setViewState('form')
  }

  const selectedQC = qcList.find((q) => q.id === activeQcId)
  const filteredQCs = qcList.filter(
    (q) => {
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const recordBranch = q.branch || 'Vasai Factory (HQ)'
      if (recordBranch !== activeBranch) return false

      return (
        q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.srNo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
  )

  return (
    <>
      <PageTitle breadcrumbs={[]}>QC Scale Calibration Reports</PageTitle>
      <Content>
        {/* VIEW 1: QC LIST */}
        {viewState === 'list' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold text-gray-900 fs-3'>Scale QC Reports Log</span>
                <span className='text-gray-500 mt-1 fw-semibold fs-7'>Conduct eccentricity, creep, repeatability, and linearity assessments</span>
              </h3>
              <div className='card-toolbar'>
                <button
                  onClick={() => {
                    setFormData({
                      model: '', srNo: '', capacity: '', swVer: 'V1.0', readability: '0.1g', interval: '1g', calWt: '',
                      issueDate: new Date().toISOString().split('T')[0], testedBy: '', designation: 'QC Engineer', remarks: '', status: 'draft',
                      eccPoints: [
                        { point: 'A (Center)', disp: '', err: '' },
                        { point: 'B (Back Left)', disp: '', err: '' },
                        { point: 'C (Back Right)', disp: '', err: '' },
                        { point: 'D (Front Right)', disp: '', err: '' },
                        { point: 'E (Front Left)', disp: '', err: '' },
                      ],
                      creepReadings: ['', '', '', '', ''], creepDiff: '0g', repeatLoad: '', repeatTol: '',
                      repeatRows: Array(10).fill(null).map(() => ({ disp: '', err: '' })), repeatMaxDiff: '', repeatSD: '',
                      linRows: [
                        { load: '20%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
                        { load: '40%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
                        { load: '60%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
                        { load: '80%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
                        { load: '100%', dispInc: '', errInc: '', dispDec: '', errDec: '' },
                      ],
                      linMaxDiff: ''
                    })
                    setActiveQcId(null)
                    setViewState('form')
                  }}
                  className='btn btn-primary btn-sm fw-bold'
                >
                  <i className='bi bi-plus-lg me-2'></i> New QC Report
                </button>
              </div>
            </div>

            <div className='card-body pt-2'>
              <div className='d-flex align-items-center justify-content-between mb-6'>
                <div className='position-relative w-300px'>
                  <span className='position-absolute ms-3 top-50 translate-middle-y'>🔍</span>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='form-control form-control-solid ps-10 py-2 fs-7'
                    placeholder='Search Model, Serial or Report No...'
                  />
                </div>
              </div>

              {/* QC List Table */}
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8'>
                      <th>Report No</th>
                      <th>Model / Serial</th>
                      <th>Capacity</th>
                      <th>Tested By</th>
                      <th className='text-end'>Issue Date</th>
                      <th className='text-end'>Status</th>
                      <th className='text-end'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQCs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className='text-center text-muted py-8'>No QC Reports generated yet.</td>
                      </tr>
                    ) : (
                      filteredQCs.map((q) => (
                        <tr key={q.id}>
                          <td>
                            <span
                              onClick={() => {
                                setActiveQcId(q.id)
                                setViewState('detail')
                              }}
                              className='text-gray-900 fw-bold text-hover-primary cursor-pointer fs-6'
                            >
                              {q.id}
                            </span>
                          </td>
                          <td>
                            <div className='d-flex flex-column'>
                              <span className='text-gray-900 fw-bold fs-6'>{q.model}</span>
                              <span className='text-muted fs-7'>S/N: {q.srNo}</span>
                            </div>
                          </td>
                          <td>
                            <span className='text-gray-800 fw-semibold'>{q.capacity}</span>
                          </td>
                          <td>
                            <span className='text-gray-800 fw-semibold'>{q.testedBy}</span>
                          </td>
                          <td className='text-end text-muted fw-semibold fs-7'>{q.issueDate}</td>
                          <td className='text-end'>
                            <span className={`badge badge-light-${q.status === 'submitted' ? 'success' : 'warning'} fw-bold px-3 py-1`}>
                              {q.status}
                            </span>
                          </td>
                          <td className='text-end'>
                            <div className='d-flex justify-content-end gap-2'>
                              <button
                                onClick={() => {
                                  setActiveQcId(q.id)
                                  setViewState('detail')
                                }}
                                className='btn btn-icon btn-light-info btn-sm'
                              >
                                <i className='bi bi-printer fs-5'></i>
                              </button>
                              <button
                                onClick={() => triggerEdit(q)}
                                className='btn btn-icon btn-light-primary btn-sm'
                              >
                                <i className='bi bi-pencil fs-5'></i>
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

        {/* VIEW 2: FORM CREATION & EDIT */}
        {viewState === 'form' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold text-gray-900 fs-3'>
                  {activeQcId ? `Edit Report ${activeQcId}` : 'New Quality Control Test Report'}
                </span>
                <span className='text-gray-500 mt-1 fw-semibold fs-7'>Conduct laboratory verification tests for weighing balances</span>
              </h3>
              <div className='card-toolbar'>
                <button onClick={() => setViewState('list')} className='btn btn-sm btn-light fw-bold'>
                  Cancel
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='form card-body pt-4'>
              {/* Instrument Details */}
              <div className='row g-6 mb-6'>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Balance Model</label>
                  <input
                    type='text'
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='e.g. AE-1000'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Serial Number</label>
                  <input
                    type='text'
                    value={formData.srNo || ''}
                    onChange={(e) => setFormData({ ...formData, srNo: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='AC-98701'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Max Capacity</label>
                  <input
                    type='text'
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='1000g'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Readability (d)</label>
                  <input
                    type='text'
                    value={formData.readability || ''}
                    onChange={(e) => setFormData({ ...formData, readability: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='0.01g'
                  />
                </div>
              </div>

              {/* Part 2 Detail */}
              <div className='row g-6 mb-8'>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Calibration Weight Used</label>
                  <input
                    type='text'
                    value={formData.calWt || ''}
                    onChange={(e) => setFormData({ ...formData, calWt: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='1Kg Standard Class F1'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Tested By Name</label>
                  <input
                    type='text'
                    value={formData.testedBy || ''}
                    onChange={(e) => setFormData({ ...formData, testedBy: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='Signatory Name'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Verification Date</label>
                  <input
                    type='date'
                    value={formData.issueDate || ''}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className='form-control form-control-solid'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Status Option</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className='form-select form-select-solid'
                  >
                    <option value='draft'>Draft Record</option>
                    <option value='submitted'>Issue Report (Submitted)</option>
                  </select>
                </div>
              </div>

              {/* 1. Eccentricity Test Table */}
              <div className='card border border-dashed border-gray-300 p-6 mb-6 bg-light-neutral'>
                <span className='fw-bold text-gray-800 fs-5 mb-4 d-block'>1️⃣ Eccentricity Test (Pans Corners Loading)</span>
                <table className='table table-bordered border-gray-300 bg-white align-middle gs-4 gy-2 fs-7'>
                  <thead className='bg-light'>
                    <tr className='fw-bold text-dark border-bottom'>
                      <th>Test Position (Pan points)</th>
                      <th>Observed Displayed Wt. (g)</th>
                      <th>Indicated Error (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.eccPoints || []).map((pt, idx) => (
                      <tr key={idx}>
                        <td className='fw-bold'>{pt.point}</td>
                        <td>
                          <input
                            type='text'
                            value={pt.disp}
                            onChange={(e) => {
                              const updated = [...(formData.eccPoints || [])]
                              updated[idx] = { ...updated[idx], disp: e.target.value }
                              setFormData({ ...formData, eccPoints: updated })
                            }}
                            className='form-control form-control-solid form-control-sm w-150px'
                            placeholder='0.00'
                          />
                        </td>
                        <td>
                          <input
                            type='text'
                            value={pt.err}
                            onChange={(e) => {
                              const updated = [...(formData.eccPoints || [])]
                              updated[idx] = { ...updated[idx], err: e.target.value }
                              setFormData({ ...formData, eccPoints: updated })
                            }}
                            className='form-control form-control-solid form-control-sm w-150px'
                            placeholder='0.00'
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2 & 3: Creep & Repeatability Side-by-Side */}
              <div className='row g-6 mb-6'>
                {/* 2. Creep Test */}
                <div className='col-lg-6'>
                  <div className='card border border-dashed border-gray-300 p-6 bg-light-neutral h-100'>
                    <span className='fw-bold text-gray-800 fs-5 mb-4 d-block'>2️⃣ Creep Test (Time Drift Analysis)</span>
                    <table className='table table-bordered border-gray-300 bg-white align-middle gs-4 gy-2 fs-7'>
                      <thead className='bg-light'>
                        <tr className='fw-bold text-dark border-bottom'>
                          <th>Test Reading Step</th>
                          <th>Indicated Wt. (g)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          '0 (Zero - Initial)',
                          'Half Load (50% Cap)',
                          'Full Load (100% Cap)',
                          'Half Load (50% Cap - 15m)',
                          '0 (Zero - Final)'
                        ].map((label, idx) => (
                          <tr key={idx}>
                            <td className='fw-bold'>{label}</td>
                            <td>
                              <input
                                type='text'
                                value={(formData.creepReadings || [])[idx] || ''}
                                onChange={(e) => {
                                  const updated = [...(formData.creepReadings || [])]
                                  updated[idx] = e.target.value
                                  setFormData({ ...formData, creepReadings: updated })
                                }}
                                className='form-control form-control-solid form-control-sm w-150px'
                                placeholder='0.00'
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className='mt-2'>
                      <label className='form-label fw-bold fs-7 text-muted'>Creep Max Deviation Difference</label>
                      <input
                        type='text'
                        value={formData.creepDiff || ''}
                        onChange={(e) => setFormData({ ...formData, creepDiff: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. 0.01g'
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Repeatability Test */}
                <div className='col-lg-6'>
                  <div className='card border border-dashed border-gray-300 p-6 bg-light-neutral h-100'>
                    <span className='fw-bold text-gray-800 fs-5 mb-4 d-block'>3️⃣ Repeatability Test (Standard Deviation)</span>
                    <div className='row g-4 mb-4'>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-8 text-muted'>Test Load Applied</label>
                        <input
                          type='text'
                          value={formData.repeatLoad || ''}
                          onChange={(e) => setFormData({ ...formData, repeatLoad: e.target.value })}
                          className='form-control form-control-solid form-control-sm'
                          placeholder='e.g. 500g'
                        />
                      </div>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-8 text-muted'>Tolerance Limit</label>
                        <input
                          type='text'
                          value={formData.repeatTol || ''}
                          onChange={(e) => setFormData({ ...formData, repeatTol: e.target.value })}
                          className='form-control form-control-solid form-control-sm'
                          placeholder='e.g. 0.05g'
                        />
                      </div>
                    </div>

                    <div className='max-h-250px scroll-y border rounded bg-white p-3 mb-4'>
                      <table className='table table-bordered border-gray-200 align-middle gs-3 gy-1 fs-7 mb-0'>
                        <thead className='bg-light'>
                          <tr className='fw-bold border-bottom'>
                            <th className='text-center' style={{ width: '40px' }}>No</th>
                            <th>Observed Displayed Wt. (g)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(formData.repeatRows || []).map((row, idx) => (
                            <tr key={idx}>
                              <td className='text-center fw-bold'>{idx + 1}</td>
                              <td>
                                <input
                                  type='text'
                                  value={row.disp}
                                  onChange={(e) => handleRepeatValueChange(idx, e.target.value)}
                                  className='form-control form-control-solid form-control-sm py-1'
                                  placeholder='e.g. 500.00'
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className='row g-4'>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-8 text-muted'>Max Difference (Calculated)</label>
                        <input
                          type='text'
                          value={formData.repeatMaxDiff || ''}
                          readOnly
                          className='form-control form-control-solid form-control-sm font-monospace bg-light-neutral'
                        />
                      </div>
                      <div className='col-6'>
                        <label className='form-label fw-bold fs-8 text-muted'>Std Deviation (Calculated)</label>
                        <input
                          type='text'
                          value={formData.repeatSD || ''}
                          readOnly
                          className='form-control form-control-solid form-control-sm font-monospace bg-light-neutral'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submits buttons */}
              <div className='d-flex justify-content-end gap-3 pt-6 border-top'>
                <button type='button' onClick={() => setViewState('list')} className='btn btn-light'>
                  Cancel
                </button>
                <button type='submit' className='btn btn-primary fw-bold'>
                  💾 Save QC Record
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: DETAIL & PRINT SHEET */}
        {viewState === 'detail' && selectedQC && (
          <div className='row g-6'>
            <div className='col-lg-4'>
              <div className='card border-0 shadow-sm mb-6'>
                <div className='card-header pt-6'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>Report Actions</h3>
                </div>
                <div className='card-body d-flex flex-column gap-3'>
                  <button onClick={() => window.print()} className='btn btn-primary fw-bold w-100'>
                    🖨️ Open Browser Print Panel
                  </button>
                  <button onClick={() => triggerEdit(selectedQC)} className='btn btn-light-primary fw-bold w-100'>
                    ✏️ Edit QC Report
                  </button>
                  <button onClick={() => setViewState('list')} className='btn btn-light w-100'>
                    ← Back to List
                  </button>
                </div>
              </div>

              {/* Brief diagnostics */}
              <div className='card border-0 shadow-sm'>
                <div className='card-header pt-6'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>🔬 Diagnostics Result</h3>
                </div>
                <div className='card-body pt-2 fs-7'>
                  <div className='mb-4'>
                    <span className='text-muted d-block'>Eccentricity Deviation max:</span>
                    <strong className='text-gray-800'>
                      {selectedQC.eccPoints.reduce((max, p) => {
                        const err = Math.abs(parseFloat(p.err) || 0)
                        return err > max ? err : max
                      }, 0).toFixed(2)}g
                    </strong>
                  </div>
                  <div className='mb-4'>
                    <span className='text-muted d-block'>Creep drift Offset:</span>
                    <strong className='text-gray-800'>{selectedQC.creepDiff || '—'}</strong>
                  </div>
                  <div className='mb-4'>
                    <span className='text-muted d-block'>Repeatability dispersion S.D.:</span>
                    <strong className='text-gray-900 font-monospace'>{selectedQC.repeatSD || '—'}</strong>
                  </div>
                  <div>
                    <span className='text-muted d-block'>Tested / Issued By:</span>
                    <strong className='text-gray-900'>{selectedQC.testedBy}</strong>
                    <span className='text-muted d-block fs-8'>{selectedQC.designation}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Sheet Card */}
            <div className='col-lg-8' id='printable-area'>
              <div
                className='card border shadow-lg p-10 rounded bg-white'
                style={{
                  minHeight: '297mm',
                  fontFamily: "'Courier New', Courier, monospace",
                  color: '#111',
                  borderTop: '8px solid #06b6d4',
                }}
              >
                {/* Header */}
                <div className='d-flex justify-content-between align-items-center border-bottom pb-4 mb-6'>
                  <div>
                    <h1 className='fw-bolder fs-2 text-cyan-600 m-0'>ARCHERCHEM INSTRUMENTS</h1>
                    <span className='fs-8 text-muted d-block mt-1'>Quality Control Laboratory · Vasai Assembly Division</span>
                  </div>
                  <div className='border border-cyan-500 text-cyan-600 p-2 fw-bold text-uppercase fs-7'>
                    QC TEST REPORT CARD
                  </div>
                </div>

                {/* Sub title */}
                <div className='bg-light p-3 border rounded text-center mb-6 fs-7 fw-bold'>
                  REPORT NO: {selectedQC.id} | DATE OF ASSESSMENT: {selectedQC.issueDate}
                </div>

                {/* Grid model details */}
                <div className='row g-4 mb-6 fs-7 pb-4 border-bottom'>
                  <div className='col-6'>
                    <span className='text-muted d-block'>Balance Model:</span>
                    <strong className='text-dark'>{selectedQC.model}</strong>
                  </div>
                  <div className='col-6'>
                    <span className='text-muted d-block'>Serial Number (S/N):</span>
                    <strong className='text-dark'>{selectedQC.srNo}</strong>
                  </div>
                  <div className='col-6'>
                    <span className='text-muted d-block'>Maximum Capacity:</span>
                    <strong className='text-dark'>{selectedQC.capacity}</strong>
                  </div>
                  <div className='col-6'>
                    <span className='text-muted d-block'>Readability value (d):</span>
                    <strong className='text-dark'>{selectedQC.readability}</strong>
                  </div>
                </div>

                {/* Section 1: Eccentricity */}
                <div className='mb-6'>
                  <span className='fw-bold text-cyan-600 d-block fs-6 mb-2'>1. ECCENTRICITY TEST (Standard load applied corner check)</span>
                  <table className='table table-bordered border-gray-400 gs-3 gy-1 fs-7 mb-0 align-middle'>
                    <thead className='bg-light'>
                      <tr className='fw-bold border-bottom'>
                        <th>Pans Corner Loading Location</th>
                        <th className='text-end'>Observed Weight (g)</th>
                        <th className='text-end'>Offset Error (g)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQC.eccPoints.map((pt, idx) => (
                        <tr key={idx} className='border-bottom'>
                          <td>{pt.point}</td>
                          <td className='text-end fw-bold'>{pt.disp}</td>
                          <td className='text-end text-danger fw-bold'>{pt.err}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 2: Creep */}
                <div className='mb-6'>
                  <span className='fw-bold text-cyan-600 d-block fs-6 mb-2'>2. CREEP TEST (Indication stability drift limit)</span>
                  <table className='table table-bordered border-gray-400 gs-3 gy-1 fs-7 mb-2 align-middle'>
                    <thead className='bg-light'>
                      <tr className='fw-bold border-bottom'>
                        <th>Timing Sequence</th>
                        <th className='text-end'>Displayed Loading Wt. (g)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        '0 (Zero - Initial)',
                        'Half Load (50% Cap)',
                        'Full Load (100% Cap)',
                        'Half Load (50% Cap - 15m)',
                        '0 (Zero - Final)'
                      ].map((lbl, idx) => (
                        <tr key={idx} className='border-bottom'>
                          <td>{lbl}</td>
                          <td className='text-end fw-semibold'>{selectedQC.creepReadings[idx] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className='text-end fs-7 fw-bold'>
                    Max drift observed: <span className='text-danger'>{selectedQC.creepDiff}</span>
                  </div>
                </div>

                {/* Section 3: Repeatability */}
                <div className='mb-8'>
                  <span className='fw-bold text-cyan-600 d-block fs-6 mb-2'>3. REPEATABILITY TEST (Standard deviation check, load: {selectedQC.repeatLoad})</span>
                  <div className='row g-4'>
                    <div className='col-8'>
                      <table className='table table-bordered border-gray-400 gs-3 gy-1 fs-8 align-middle mb-0'>
                        <thead className='bg-light'>
                          <tr className='fw-bold border-bottom'>
                            <th className='text-center' style={{ width: '40px' }}>Sr</th>
                            <th className='text-end'>Displayed (g)</th>
                            <th className='text-center' style={{ width: '40px' }}>Sr</th>
                            <th className='text-end'>Displayed (g)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array(5).fill(null).map((_, i) => (
                            <tr key={i} className='border-bottom'>
                              <td className='text-center fw-bold bg-light'>{i + 1}</td>
                              <td className='text-end'>{selectedQC.repeatRows[i]?.disp || '—'}</td>
                              <td className='text-center fw-bold bg-light'>{i + 6}</td>
                              <td className='text-end'>{selectedQC.repeatRows[i + 5]?.disp || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className='col-4 d-flex flex-column justify-content-center gap-3 fs-7 border-start ps-5'>
                      <div>
                        <span className='text-muted d-block'>Limit Tolerance:</span>
                        <strong className='text-dark'>{selectedQC.repeatTol}</strong>
                      </div>
                      <div>
                        <span className='text-muted d-block'>Max Difference:</span>
                        <strong className='text-danger'>{selectedQC.repeatMaxDiff}</strong>
                      </div>
                      <div>
                        <span className='text-muted d-block'>Std. Deviation:</span>
                        <strong className='text-primary font-monospace'>{selectedQC.repeatSD}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign-off signatures */}
                <div className='mt-auto pt-8 border-top row g-6 fs-7 text-center align-items-end'>
                  <div className='col-6 text-start'>
                    <span className='text-muted d-block'>Remarks &amp; observations:</span>
                    <strong className='text-dark italic'>{selectedQC.remarks || 'No remarks recorded.'}</strong>
                  </div>
                  <div className='col-6 text-end'>
                    <div className='mb-8'>
                      <span className='text-muted d-block'>Authorized Technical Inspector</span>
                      <strong className='text-gray-900'>{selectedQC.testedBy}</strong>
                    </div>
                    <div className='border-top pt-1 text-muted fs-8'>
                      {selectedQC.designation}
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

export default QCPage
