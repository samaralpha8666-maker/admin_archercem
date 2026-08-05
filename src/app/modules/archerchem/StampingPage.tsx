import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { KTIcon } from '../../../_metronic/helpers'
import { getStampingApplications, createStampingApplication } from '../auth/core/_requests'
import toast from 'react-hot-toast'

interface StampRow {
  id: number
  model: string
  make: string
  approval: string
  maxVal: string
  maxUnit: string
  eVal: string
  eUnit: string
  dVal: string
  dUnit: string
  cls: string
  minWeight: string
  qty: number
  machine: string
  amt: number
}

function oimlToGrams(val: number, unit: string): number {
  if (unit === 'kg') return val * 1000
  if (unit === 'mg') return val / 1000
  return val
}

function formatWeight(valG: number, unit: string): string {
  if (unit === 'kg') return (valG / 1000).toFixed(6).replace(/\.?0+$/, '') + ' kg'
  if (unit === 'mg') return (valG * 1000).toFixed(4).replace(/\.?0+$/, '') + ' mg'
  return valG.toFixed(4).replace(/\.?0+$/, '') + ' g'
}

function calcOimlClassAndMin(maxValStr: string, maxUnit: string, eValStr: string, eUnit: string) {
  const maxRaw = parseFloat(maxValStr)
  const eRaw = parseFloat(eValStr)
  if (isNaN(maxRaw) || isNaN(eRaw) || maxRaw <= 0 || eRaw <= 0) {
    return { cls: '', minWeight: '' }
  }

  const maxG = oimlToGrams(maxRaw, maxUnit)
  const eG = oimlToGrams(eRaw, eUnit)

  const counts = maxG / eG
  let cls = 'II'
  if (counts > 100000) cls = 'I'
  else if (counts > 10000) cls = 'II'
  else if (counts > 1000) cls = 'III'
  else cls = 'IIII'

  let minG = 20 * eG
  if (cls === 'I') minG = 100 * eG
  else if (cls === 'II') minG = eG >= 0.000001 && eG <= 0.00005 ? 20 * eG : 50 * eG
  else if (cls === 'III') minG = 20 * eG
  else minG = 10 * eG

  return {
    cls: 'Class ' + cls,
    minWeight: formatWeight(minG, eUnit)
  }
}

const StampingPage: FC = () => {
  const [headerForm, setHeaderForm] = useState({
    date: new Date().toISOString().split('T')[0],
    appNo: '093',
    to: 'The Inspector of Legal Metrology, Vasai Division (I)',
    subject: 'Verification and Stamping of Electronic Weighing scale.',
    mfgLic: 'LM/MH/LM/400',
    dlrLic: 'LM/MH/LD/419',
    repLic: 'LM/MH/LR/601',
    lcrNo: '260194695',
    chequeRef: ''
  })

  const [rows, setRows] = useState<StampRow[]>([
    {
      id: 1,
      model: 'PS 210.R2',
      make: 'RADWAG',
      approval: 'IND/09/25/170',
      maxVal: '210',
      maxUnit: 'g',
      eVal: '10',
      eUnit: 'mg',
      dVal: '1',
      dUnit: 'mg',
      cls: 'Class II',
      minWeight: '500 mg',
      qty: 1,
      machine: '877459',
      amt: 400
    }
  ])

  const [grandTotal, setGrandTotal] = useState<number>(400)

  useEffect(() => {
    const total = rows.reduce((acc, row) => acc + (row.amt || 0) * (row.qty || 1), 0)
    setGrandTotal(total)
  }, [rows])

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const res = await getStampingApplications()
        if (res.data?.success && res.data.applications?.length) {
          const latest = res.data.applications[0]
          setHeaderForm({
            date: latest.date || new Date().toISOString().split('T')[0],
            appNo: latest.appNo || '093',
            to: latest.to || '',
            subject: latest.subject || '',
            mfgLic: latest.mfgLic || '',
            dlrLic: latest.dlrLic || '',
            repLic: latest.repLic || '',
            lcrNo: latest.lcrNo || '',
            chequeRef: latest.chequeRef || ''
          })
          if (Array.isArray(latest.rows) && latest.rows.length) {
            setRows(latest.rows)
          }
        }
      } catch (err) {
        console.error('Failed to load stamping applications:', err)
      }
    }
    loadApplications()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        handlePrint()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [headerForm, rows, grandTotal])

  const handleAddRow = () => {
    const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1
    setRows([
      ...rows,
      {
        id: nextId,
        model: '',
        make: 'RADWAG',
        approval: '',
        maxVal: '',
        maxUnit: 'g',
        eVal: '',
        eUnit: 'mg',
        dVal: '',
        dUnit: 'mg',
        cls: '',
        minWeight: '',
        qty: 1,
        machine: '',
        amt: 400
      }
    ])
  }

  const handleRemoveRow = (id: number) => {
    if (rows.length === 1) {
      toast.error('At least one balance row is required.')
      return
    }
    setRows(rows.filter((r) => r.id !== id))
  }

  const handleRowChange = (id: number, field: keyof StampRow, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const updated = { ...row, [field]: value }

        if (['maxVal', 'maxUnit', 'eVal', 'eUnit'].includes(field)) {
          const { cls, minWeight } = calcOimlClassAndMin(
            updated.maxVal,
            updated.maxUnit,
            updated.eVal,
            updated.eUnit
          )
          updated.cls = cls
          updated.minWeight = minWeight
        }
        return updated
      })
    )
  }

  const handlePrint = () => {
    if (!rows.some((r) => r.model)) {
      toast.error('Please enter at least one valid balance model.')
      return
    }
    window.print()
  }

  const handleReset = () => {
    setHeaderForm({
      date: new Date().toISOString().split('T')[0],
      appNo: '093',
      to: 'The Inspector of Legal Metrology, Vasai Division (I)',
      subject: 'Verification and Stamping of Electronic Weighing scale.',
      mfgLic: 'LM/MH/LM/400',
      dlrLic: 'LM/MH/LD/419',
      repLic: 'LM/MH/LR/601',
      lcrNo: '260194695',
      chequeRef: ''
    })
    setRows([
      {
        id: 1,
        model: 'PS 210.R2',
        make: 'RADWAG',
        approval: 'IND/09/25/170',
        maxVal: '210',
        maxUnit: 'g',
        eVal: '10',
        eUnit: 'mg',
        dVal: '1',
        dUnit: 'mg',
        cls: 'Class II',
        minWeight: '500 mg',
        qty: 1,
        machine: '877459',
        amt: 400
      }
    ])
    toast.success('Form reset to default parameters.')
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Legal Metrology Stamping Application</PageTitle>
      <Content>
        <div className='d-flex flex-column gap-6'>
          {/* Hero Banner */}
          <div
            className='card border-0 rounded-4 shadow-sm position-relative overflow-hidden'
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              color: '#ffffff'
            }}
          >
            <div className='card-body p-8 position-relative' style={{ zIndex: 1 }}>
              <div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4'>
                <div className='d-flex align-items-center gap-4'>
                  <div className='p-4 bg-white bg-opacity-10 rounded-circle text-white'>
                    <KTIcon iconName='shield-tick' className='fs-2hx' />
                  </div>
                  <div>
                    <span className='badge bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-pill fs-8 fw-bold mb-2 d-inline-block'>
                      🔏 Government Verification Form
                    </span>
                    <h1 className='fs-2hx fw-extrabold text-white mb-1'>Legal Metrology — Stamping Application</h1>
                    <p className='text-white text-opacity-80 fw-semibold fs-6 mb-0'>
                      Verification &amp; Stamping Application Form for Electronic Weighing Instruments under Legal Metrology Dept.
                    </p>
                  </div>
                </div>

                <div className='d-flex gap-3'>
                  <button onClick={handleReset} className='btn btn-outline btn-outline-white text-white fw-bold fs-7'>
                    🔄 Reset Form
                  </button>
                  <button onClick={handlePrint} className='btn btn-light-primary text-primary bg-white fw-extrabold fs-7 shadow-sm d-flex align-items-center gap-2'>
                    <KTIcon iconName='printer' className='fs-4' />
                    Print Application
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Header Card */}
          <div className='card card-flush shadow-sm border-0 bg-body'>
            <div className='card-header pt-6 border-0'>
              <h3 className='card-title fw-bolder text-gray-900 fs-4 d-flex align-items-center gap-2'>
                <KTIcon iconName='notepad' className='fs-3 text-primary' />
                Application Header &amp; Licenses
              </h3>
            </div>

            <div className='card-body pt-2'>
              <div className='row g-4'>
                <div className='col-12 col-md-3'>
                  <label className='form-label fw-bold fs-7 text-gray-800 required'>Date</label>
                  <input
                    type='date'
                    value={headerForm.date}
                    onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                  />
                </div>

                <div className='col-12 col-md-3'>
                  <label className='form-label fw-bold fs-7 text-gray-800'>Application No.</label>
                  <input
                    type='text'
                    value={headerForm.appNo}
                    onChange={(e) => setHeaderForm({ ...headerForm, appNo: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                    placeholder='e.g. 093'
                  />
                </div>

                <div className='col-12 col-md-6'>
                  <label className='form-label fw-bold fs-7 text-gray-800'>To (Inspector / Division)</label>
                  <input
                    type='text'
                    value={headerForm.to}
                    onChange={(e) => setHeaderForm({ ...headerForm, to: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                  />
                </div>

                <div className='col-12'>
                  <label className='form-label fw-bold fs-7 text-gray-800'>Subject</label>
                  <input
                    type='text'
                    value={headerForm.subject}
                    onChange={(e) => setHeaderForm({ ...headerForm, subject: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                  />
                </div>

                <div className='col-12 col-md-3'>
                  <label className='form-label fw-bold fs-7 text-gray-800'>MFG Lic.</label>
                  <input
                    type='text'
                    value={headerForm.mfgLic}
                    onChange={(e) => setHeaderForm({ ...headerForm, mfgLic: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                  />
                </div>

                <div className='col-12 col-md-3'>
                  <label className='form-label fw-bold fs-7 text-gray-800'>DLR Lic.</label>
                  <input
                    type='text'
                    value={headerForm.dlrLic}
                    onChange={(e) => setHeaderForm({ ...headerForm, dlrLic: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                  />
                </div>

                <div className='col-12 col-md-3'>
                  <label className='form-label fw-bold fs-7 text-gray-800'>REP Lic.</label>
                  <input
                    type='text'
                    value={headerForm.repLic}
                    onChange={(e) => setHeaderForm({ ...headerForm, repLic: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                  />
                </div>

                <div className='col-12 col-md-3'>
                  <label className='form-label fw-bold fs-7 text-gray-800'>LCR No.</label>
                  <input
                    type='text'
                    value={headerForm.lcrNo}
                    onChange={(e) => setHeaderForm({ ...headerForm, lcrNo: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Balance / Scale Items */}
          <div className='card card-flush shadow-sm border-0 bg-body'>
            <div className='card-header pt-6 border-0 d-flex align-items-center justify-content-between'>
              <div>
                <h3 className='card-title fw-bolder text-gray-900 fs-4 d-flex align-items-center gap-2 mb-1'>
                  <KTIcon iconName='bank' className='fs-3 text-success' />
                  Balance / Scale Specifications
                </h3>
                <span className='text-muted fs-8 fw-semibold'>Enter Max &amp; e values to auto-calculate Class &amp; Min Weight (OIML)</span>
              </div>
              <button onClick={handleAddRow} className='btn btn-sm btn-light-success fw-bold d-flex align-items-center gap-1'>
                <KTIcon iconName='plus' className='fs-4' /> Add Balance
              </button>
            </div>

            <div className='card-body pt-2'>
              <div className='d-flex flex-column gap-5'>
                {rows.map((row, idx) => (
                  <div key={row.id} className='p-5 border border-dashed border-gray-300 rounded-4 bg-light position-relative'>
                    <div className='d-flex align-items-center justify-content-between mb-4'>
                      <span className='badge badge-primary fs-7 fw-bold px-3 py-1'>Balance #{idx + 1}</span>
                      {rows.length > 1 && (
                        <button
                          type='button'
                          onClick={() => handleRemoveRow(row.id)}
                          className='btn btn-sm btn-light-danger fs-8 fw-bold px-3 py-1'
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    <div className='row g-4'>
                      <div className='col-12 col-md-6'>
                        <label className='form-label fw-bold fs-7 text-gray-800 required'>Model No.</label>
                        <input
                          type='text'
                          value={row.model}
                          onChange={(e) => handleRowChange(row.id, 'model', e.target.value)}
                          className='form-control form-control-solid fw-bold fs-7'
                          placeholder='e.g. PS 210.R2'
                        />
                      </div>

                      <div className='col-12 col-md-3'>
                        <label className='form-label fw-bold fs-7 text-gray-800'>Make</label>
                        <input
                          type='text'
                          value={row.make}
                          onChange={(e) => handleRowChange(row.id, 'make', e.target.value)}
                          className='form-control form-control-solid fw-bold fs-7'
                          placeholder='e.g. RADWAG'
                        />
                      </div>

                      <div className='col-12 col-md-3'>
                        <label className='form-label fw-bold fs-7 text-gray-800'>Model Approval No.</label>
                        <input
                          type='text'
                          value={row.approval}
                          onChange={(e) => handleRowChange(row.id, 'approval', e.target.value)}
                          className='form-control form-control-solid fw-bold fs-7'
                          placeholder='e.g. IND/09/25/170'
                        />
                      </div>

                      <div className='col-12 col-md-6'>
                        <label className='form-label fw-bold fs-7 text-gray-800 required'>Max Capacity</label>
                        <div className='input-group'>
                          <input
                            type='number'
                            step='any'
                            value={row.maxVal}
                            onChange={(e) => handleRowChange(row.id, 'maxVal', e.target.value)}
                            className='form-control form-control-solid fw-bold fs-7'
                            placeholder='e.g. 210'
                          />
                          <select
                            value={row.maxUnit}
                            onChange={(e) => handleRowChange(row.id, 'maxUnit', e.target.value)}
                            className='form-select form-select-solid fw-bold fs-7 w-90px'
                          >
                            <option value='mg'>mg</option>
                            <option value='g'>g</option>
                            <option value='kg'>kg</option>
                          </select>
                        </div>
                      </div>

                      <div className='col-12 col-md-6'>
                        <label className='form-label fw-bold fs-7 text-gray-800 required'>e (Readability)</label>
                        <div className='input-group'>
                          <input
                            type='number'
                            step='any'
                            value={row.eVal}
                            onChange={(e) => handleRowChange(row.id, 'eVal', e.target.value)}
                            className='form-control form-control-solid fw-bold fs-7'
                            placeholder='e.g. 10'
                          />
                          <select
                            value={row.eUnit}
                            onChange={(e) => handleRowChange(row.id, 'eUnit', e.target.value)}
                            className='form-select form-select-solid fw-bold fs-7 w-90px'
                          >
                            <option value='mg'>mg</option>
                            <option value='g'>g</option>
                            <option value='kg'>kg</option>
                          </select>
                        </div>
                      </div>

                      <div className='col-12 col-md-3'>
                        <label className='form-label fw-bold fs-7 text-gray-800'>Class (Auto)</label>
                        <input
                          type='text'
                          readOnly
                          value={row.cls}
                          className='form-control form-control-solid bg-light-success text-success fw-extrabold fs-7'
                          placeholder='Class II'
                        />
                      </div>

                      <div className='col-12 col-md-3'>
                        <label className='form-label fw-bold fs-7 text-gray-800'>Min Weight (Auto)</label>
                        <input
                          type='text'
                          readOnly
                          value={row.minWeight}
                          className='form-control form-control-solid bg-light-success text-gray-900 fw-bold fs-7'
                          placeholder='500 mg'
                        />
                      </div>

                      <div className='col-12 col-md-3'>
                        <label className='form-label fw-bold fs-7 text-gray-800'>d (Scale Interval)</label>
                        <div className='input-group'>
                          <input
                            type='text'
                            value={row.dVal}
                            onChange={(e) => handleRowChange(row.id, 'dVal', e.target.value)}
                            className='form-control form-control-solid fw-bold fs-7'
                            placeholder='1'
                          />
                          <select
                            value={row.dUnit}
                            onChange={(e) => handleRowChange(row.id, 'dUnit', e.target.value)}
                            className='form-select form-select-solid fw-bold fs-7 w-90px'
                          >
                            <option value='mg'>mg</option>
                            <option value='g'>g</option>
                            <option value='kg'>kg</option>
                          </select>
                        </div>
                      </div>

                      <div className='col-12 col-md-3'>
                        <label className='form-label fw-bold fs-7 text-gray-800'>Qty</label>
                        <input
                          type='number'
                          min={1}
                          value={row.qty}
                          onChange={(e) => handleRowChange(row.id, 'qty', parseInt(e.target.value) || 1)}
                          className='form-control form-control-solid fw-bold fs-7'
                        />
                      </div>

                      <div className='col-12 col-md-6'>
                        <label className='form-label fw-bold fs-7 text-gray-800'>Machine No. / Serial No.</label>
                        <input
                          type='text'
                          value={row.machine}
                          onChange={(e) => handleRowChange(row.id, 'machine', e.target.value)}
                          className='form-control form-control-solid fw-bold fs-7'
                          placeholder='e.g. 877459'
                        />
                      </div>

                      <div className='col-12 col-md-6'>
                        <label className='form-label fw-bold fs-7 text-gray-800 required'>Amount (₹)</label>
                        <input
                          type='number'
                          value={row.amt}
                          onChange={(e) => handleRowChange(row.id, 'amt', parseFloat(e.target.value) || 0)}
                          className='form-control form-control-solid fw-extrabold fs-7 text-primary'
                          placeholder='400'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment & Grand Total Card */}
          <div className='card card-flush shadow-sm border-0 bg-body p-6'>
            <div className='row align-items-center g-4'>
              <div className='col-12 col-md-7'>
                <label className='form-label fw-bold fs-7 text-gray-800'>Cheque / DD / UPI Reference No.</label>
                <input
                  type='text'
                  value={headerForm.chequeRef}
                  onChange={(e) => setHeaderForm({ ...headerForm, chequeRef: e.target.value })}
                  className='form-control form-control-solid fw-bold fs-7'
                  placeholder='Enter Cheque / Demand Draft / Online Transaction Reference'
                />
              </div>

              <div className='col-12 col-md-5'>
                <div className='bg-light-primary p-4 rounded-3 border border-primary border-opacity-25 d-flex align-items-center justify-content-between'>
                  <span className='fs-7 fw-bold text-gray-800'>Grand Total Amount</span>
                  <span className='fs-2hx fw-extrabold text-primary'>₹ {grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </>
  )
}

export default StampingPage
