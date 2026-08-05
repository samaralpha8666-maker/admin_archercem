import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'
import {
  getCalibrationCertificates,
  createCalibrationCertificate,
  updateCalibrationCertificate,
  deleteCalibrationCertificate
} from '../auth/core/_requests'

interface CalibrationReading {
  nominal: string
  observed: string
  error: string
  uncertainty: string
}

interface CalibrationRecord {
  id: string
  ulrNo: string
  calDate: string
  nextDue: string
  labLocation: string
  customer: string
  address: string
  instrument: string
  serial: string
  range: string
  leastCount: string
  refStd: string
  stdCert: string
  env: string
  readings: CalibrationReading[]
  result: 'pass' | 'fail' | 'conditional'
  remarks: string
  calBy: string
  approvedBy: string
  status: 'pending' | 'completed' | 'draft' | 'issued'
}

const DEFAULT_CALIBRATION_DATA: CalibrationRecord[] = [
  {
    id: 'ACI/CAL/2026/001',
    ulrNo: 'CC123456000000045F',
    calDate: '2026-05-15',
    nextDue: '2027-05-14',
    labLocation: 'Vasai Laboratory',
    customer: 'Sunrise Pharma Pvt Ltd',
    address: 'Plot 12, MIDC Andheri (E), Mumbai 400093',
    instrument: 'Radwag AS 220.X2 Analytical Balance',
    serial: 'RW-2025-1187',
    range: '220g',
    leastCount: '0.1mg',
    refStd: 'SS Weight Box Class F1, 1mg-200g',
    stdCert: 'NPL/WT/2025/3301',
    env: '24°C / 52% RH',
    readings: [
      { nominal: '1mg', observed: '1.0001mg', error: '+0.0001mg', uncertainty: '±0.0003mg' },
      { nominal: '100mg', observed: '99.9998mg', error: '-0.0002mg', uncertainty: '±0.0008mg' },
      { nominal: '100g', observed: '100.0012g', error: '+0.0012g', uncertainty: '±0.0025g' },
      { nominal: '200g', observed: '200.0015g', error: '+0.0015g', uncertainty: '±0.0040g' }
    ],
    result: 'pass',
    remarks: 'Instrument calibration performance meets ISO 17025 tolerance limits.',
    calBy: 'Sunita Rane',
    approvedBy: 'Dr. S. K. Nair (Lab Head)',
    status: 'completed'
  },
  {
    id: 'ACI/CAL/2026/002',
    ulrNo: 'CC123456000000046F',
    calDate: '2026-03-20',
    nextDue: '2027-03-19',
    labLocation: 'Vadodara Laboratory',
    customer: 'Apollo Hospitals & Healthcare Ltd',
    address: 'Sector 23, CBD Belapur, Navi Mumbai 400614',
    instrument: 'Mettler Toledo ME204 Precision Balance',
    serial: 'MT-2024-0921',
    range: '220g',
    leastCount: '0.1mg',
    refStd: 'SS Weight Box Class E2, 1mg-100g',
    stdCert: 'NPL/WT/2024/2210',
    env: '23°C / 48% RH',
    readings: [
      { nominal: '10mg', observed: '10.0001mg', error: '+0.0001mg', uncertainty: '±0.0005mg' },
      { nominal: '50g', observed: '49.9997g', error: '-0.0003g', uncertainty: '±0.0015g' },
      { nominal: '200g', observed: '200.0008g', error: '+0.0008g', uncertainty: '±0.0030g' }
    ],
    result: 'pass',
    remarks: 'Operating within maximum permissible error.',
    calBy: 'Ramesh Patil',
    approvedBy: 'Dr. S. K. Nair (Lab Head)',
    status: 'completed'
  },
  {
    id: 'ACI/CAL/2026/003',
    ulrNo: 'CC123456000000047F',
    calDate: '2025-08-25',
    nextDue: '2026-08-24',
    labLocation: 'Vasai Laboratory',
    customer: 'Macleods Pharmaceuticals Ltd',
    address: 'Plot 312, GIDC Industrial Estate, Sarigam, Gujarat 396155',
    instrument: 'Radwag PS 1000.R2 Precision Balance',
    serial: 'RW-2024-8841',
    range: '1000g',
    leastCount: '1mg',
    refStd: 'SS Weight Box Class F1, 1g-1000g',
    stdCert: 'NPL/WT/2025/1109',
    env: '24.5°C / 54% RH',
    readings: [
      { nominal: '10g', observed: '10.002g', error: '+0.002g', uncertainty: '±0.005g' },
      { nominal: '500g', observed: '500.004g', error: '+0.004g', uncertainty: '±0.010g' },
      { nominal: '1000g', observed: '1000.009g', error: '+0.009g', uncertainty: '±0.020g' }
    ],
    result: 'pass',
    remarks: 'Scheduled annual recalibration due soon.',
    calBy: 'Priyanka Rane',
    approvedBy: 'Lab Head',
    status: 'completed'
  },
  {
    id: 'ACI/CAL/2026/004',
    ulrNo: 'CC123456000000048F',
    calDate: '2025-07-01',
    nextDue: '2026-07-01',
    labLocation: 'Vasai Laboratory',
    customer: 'Cipla Limited (Unit 2)',
    address: 'L-139 to L-146, Verna Industrial Estate, Goa 403722',
    instrument: 'Sartorius Entris 224-1S Analytical Balance',
    serial: 'SAR-2023-9901',
    range: '220g',
    leastCount: '0.1mg',
    refStd: 'SS Weight Box Class F1, 1mg-200g',
    stdCert: 'NPL/WT/2025/0821',
    env: '25°C / 58% RH',
    readings: [
      { nominal: '100mg', observed: '100.0025mg', error: '+0.0025mg', uncertainty: '±0.0010mg' },
      { nominal: '100g', observed: '100.0085g', error: '+0.0085g', uncertainty: '±0.0050g' }
    ],
    result: 'conditional',
    remarks: 'Recalibration overdue. Maintenance inspection recommended before routine testing.',
    calBy: 'Sunita Rane',
    approvedBy: 'Lab Head',
    status: 'completed'
  }
]

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

function calStatusOf(cal: CalibrationRecord) {
  const d = daysUntil(cal.nextDue)
  if (d === null) return { text: 'Valid', cls: 'badge-light-success', cardCls: 'border-start border-4 border-success' }
  if (d < 0) return { text: 'Overdue', cls: 'badge-light-danger', cardCls: 'border-start border-4 border-danger' }
  if (d <= 30) return { text: `Due in ${d}d`, cls: 'badge-light-warning', cardCls: 'border-start border-4 border-warning' }
  return { text: 'Valid', cls: 'badge-light-success', cardCls: 'border-start border-4 border-success' }
}

function getNextCertNo(records: CalibrationRecord[]): string {
  let maxNum = 0
  records.forEach((r) => {
    const parts = r.id.split('/')
    if (parts.length >= 4) {
      const num = parseInt(parts[3], 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
  })
  const yr = new Date().getFullYear()
  return `ACI/CAL/${yr}/${String(maxNum + 1).padStart(3, '0')}`
}

const CalibrationPage: FC = () => {
  const [calList, setCalList] = useState<CalibrationRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [viewState, setViewState] = useState<'list' | 'form' | 'detail'>('list')
  const [activeCalId, setActiveCalId] = useState<string | null>(null)

  // Filters & Search
  const [calFilter, setCalFilter] = useState<'all' | 'valid' | 'due' | 'overdue'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<CalibrationRecord>>({
    id: '',
    ulrNo: '',
    calDate: new Date().toISOString().split('T')[0],
    nextDue: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    labLocation: 'Vasai Laboratory',
    customer: '',
    address: '',
    instrument: '',
    serial: '',
    range: '',
    leastCount: '',
    refStd: 'SS Weight Box Class F1, 1mg-200g',
    stdCert: '',
    env: '24°C / 52% RH',
    readings: [
      { nominal: '', observed: '', error: '', uncertainty: '' },
      { nominal: '', observed: '', error: '', uncertainty: '' }
    ],
    result: 'pass',
    remarks: '',
    calBy: '',
    approvedBy: '',
    status: 'pending'
  })

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const res = await getCalibrationCertificates()
      if (res.data && res.data.success && Array.isArray(res.data.certificates) && res.data.certificates.length > 0) {
        setCalList(res.data.certificates)
        localStorage.setItem('erp_cal', JSON.stringify(res.data.certificates))
      } else {
        await seedDefaultCertificates()
      }
    } catch (e) {
      console.warn('API fetch calibration certificates failed, using local storage fallback:', e)
      loadFromCacheOrDefault()
    } finally {
      setLoading(false)
    }
  }

  const seedDefaultCertificates = async () => {
    // Seed database with proper default calibration records if DB is empty
    setCalList(DEFAULT_CALIBRATION_DATA)
    localStorage.setItem('erp_cal', JSON.stringify(DEFAULT_CALIBRATION_DATA))

    try {
      for (const cert of DEFAULT_CALIBRATION_DATA) {
        await createCalibrationCertificate(cert)
      }
    } catch (e) {
      console.warn('Seeding database with default calibration records failed:', e)
    }
  }

  const loadFromCacheOrDefault = () => {
    const raw = localStorage.getItem('erp_cal') || localStorage.getItem('archerchem_calibration_list')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCalList(parsed)
          return
        }
      } catch (e) {}
    }
    setCalList(DEFAULT_CALIBRATION_DATA)
  }

  const saveCalsLocal = (updated: CalibrationRecord[]) => {
    setCalList(updated)
    localStorage.setItem('erp_cal', JSON.stringify(updated))
    localStorage.setItem('archerchem_calibration_list', JSON.stringify(updated))
  }

  const handleInitNewForm = () => {
    setIsEditing(false)
    const today = new Date().toISOString().split('T')[0]
    const nextDue = new Date()
    nextDue.setFullYear(nextDue.getFullYear() + 1)
    const dueStr = nextDue.toISOString().split('T')[0]
    const certNo = getNextCertNo(calList)

    setFormData({
      id: certNo,
      ulrNo: '',
      calDate: today,
      nextDue: dueStr,
      labLocation: 'Vasai Laboratory',
      customer: '',
      address: '',
      instrument: '',
      serial: '',
      range: '',
      leastCount: '',
      refStd: 'SS Weight Box Class F1, 1mg-200g',
      stdCert: '',
      env: '24°C / 52% RH',
      readings: [
        { nominal: '', observed: '', error: '', uncertainty: '' },
        { nominal: '', observed: '', error: '', uncertainty: '' }
      ],
      result: 'pass',
      remarks: '',
      calBy: '',
      approvedBy: '',
      status: 'pending'
    })
    setActiveCalId(null)
    setViewState('form')
  }

  const handleEdit = (c: CalibrationRecord) => {
    setIsEditing(true)
    setFormData({ ...c })
    setActiveCalId(c.id)
    setViewState('form')
  }

  const handleDelete = async (c: CalibrationRecord) => {
    if (!window.confirm(`Are you sure you want to delete certificate ${c.id}?`)) return
    try {
      await deleteCalibrationCertificate(c.id)
      toast.success(`Deleted certificate ${c.id}`)
    } catch (e) {
      console.warn('API delete failed:', e)
    }
    const updated = calList.filter((x) => x.id !== c.id)
    saveCalsLocal(updated)
    if (viewState === 'detail') setViewState('list')
  }

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

  const saveCalDraft = async () => {
    if (!formData.customer) {
      toast.error('Customer name is required!')
      return
    }
    const certId = formData.id || getNextCertNo(calList)
    const rec: CalibrationRecord = {
      ...(formData as CalibrationRecord),
      id: certId,
      status: 'pending'
    }

    try {
      if (isEditing) {
        await updateCalibrationCertificate(certId, rec)
      } else {
        await createCalibrationCertificate(rec)
      }
    } catch (e) {
      console.warn('API sync draft failed:', e)
    }

    const idx = calList.findIndex((x) => x.id === certId)
    let updated: CalibrationRecord[]
    if (idx >= 0) {
      updated = [...calList]
      updated[idx] = rec
    } else {
      updated = [rec, ...calList]
    }
    saveCalsLocal(updated)
    toast.success(`💾 Calibration draft saved: ${rec.id}`)
    setViewState('list')
  }

  const submitCal = async () => {
    if (!formData.customer) {
      toast.error('Customer name is required!')
      return
    }
    if (!formData.instrument) {
      toast.error('Instrument / Model is required!')
      return
    }
    if (!formData.calBy) {
      toast.error('Calibrated By is required!')
      return
    }
    const certId = formData.id || getNextCertNo(calList)
    const rec: CalibrationRecord = {
      ...(formData as CalibrationRecord),
      id: certId,
      status: 'completed'
    }

    try {
      if (isEditing) {
        await updateCalibrationCertificate(certId, rec)
      } else {
        await createCalibrationCertificate(rec)
      }
    } catch (e) {
      console.warn('API sync certificate failed:', e)
    }

    const idx = calList.findIndex((x) => x.id === certId)
    let updated: CalibrationRecord[]
    if (idx >= 0) {
      updated = [...calList]
      updated[idx] = rec
    } else {
      updated = [rec, ...calList]
    }
    saveCalsLocal(updated)
    toast.success(`✅ Calibration certificate issued: ${rec.id}`)
    setViewState('list')
  }

  /* Print calibration certificate — clean professional layout matching erp 2 */
  const printCal = (recordToPrint?: CalibrationRecord) => {
    const c = recordToPrint || (selectedCal ? selectedCal : (formData as CalibrationRecord))
    if (!c || !c.id) {
      toast.error('No certificate available to print')
      return
    }

    const readingRowsHtml = (c.readings || [])
      .map(
        (r) => `
      <tr>
        <td>${r.nominal || ''}</td>
        <td>${r.observed || ''}</td>
        <td>${r.error || ''}</td>
        <td>${r.uncertainty || ''}</td>
      </tr>`
      )
      .join('')

    const html = `<!DOCTYPE html><html><head><title>${c.id}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:18px;font-size:11px}
      .outer{border:2px solid #047857;border-radius:4px;padding:14px}
      .top-row{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #047857;padding-bottom:10px;margin-bottom:10px}
      .aci-box{display:flex;gap:3px}
      .aci-box span{border:2px solid #047857;color:#065f46;font-weight:900;font-size:14px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:3px}
      .company-block{text-align:center;flex:1}
      .company-name{font-size:19px;font-weight:900;color:#065f46;font-family:Georgia,serif}
      .company-addr{font-size:10px;color:#333;margin-top:2px}
      .title-banner{background:#047857;color:#fff;text-align:center;padding:8px;font-size:15px;font-weight:900;letter-spacing:2px;margin:0 0 10px}
      .sec-bar{background:#047857;color:#fff;font-size:10.5px;font-weight:800;padding:5px 10px;letter-spacing:.4px}
      .section-block{margin-bottom:10px;border:1px solid #047857;border-radius:4px;overflow:hidden}
      .section-body{padding:8px}
      .row{display:flex;border-bottom:1px solid #eee;padding:5px 4px}
      .row:last-child{border-bottom:none}
      .row .lbl{width:160px;color:#666;flex-shrink:0;font-weight:700}
      .row .val{font-weight:700;flex:1}
      table.rpt{width:100%;border-collapse:collapse;border:1px solid #047857}
      table.rpt th{background:#ecfdf5;border:1px solid #047857;padding:5px 6px;font-size:10px;font-weight:800;text-align:center}
      table.rpt td{border:1px solid #047857;padding:5px 6px;font-size:10px;text-align:center}
      .sign-area{display:flex;justify-content:space-between;margin-top:16px}
      .sign-area .right{text-align:left;font-size:10px}
      .sign-area .right .line{border-bottom:1px solid #999;width:160px;height:24px;margin-bottom:4px}
      .result-banner{text-align:center;font-weight:900;font-size:13px;padding:8px;border-radius:4px;margin-bottom:10px}
      .result-pass{background:#ecfdf5;color:#065f46;border:1px solid #047857}
      .result-fail{background:#fef2f2;color:#b91c1c;border:1px solid #ef4444}
      @media print{ body{padding:6px} .outer{border-width:1.5px} }
    </style></head><body>
    <div class="outer">
      <div style="display:flex;align-items:center;gap:10px;border-bottom:2px solid #047857;padding-bottom:6px;margin-bottom:10px">
        <div class="aci-box"><span>A</span><span>C</span><span>I</span></div>
        <div style="flex:1;text-align:center">
          <div style="font-size:16px;font-weight:900;color:#065f46;font-family:Georgia,serif">ARCHERCAL CALIBRATION LABORATORY</div>
          <div style="font-size:9px;color:#333;margin-top:1px">NABL Accredited · ${c.labLocation || 'Vasai Laboratory'} · A Unit of Archerchem Instruments</div>
          <div style="font-size:8.5px;color:#444;margin-top:1px">ANMOL INDUSTRIAL ESTATE-2, GALA NO. 8 & 9, DHANYA SATIVALI NAGARI, VASAI (EAST) - 401208</div>
          <div style="display:flex;justify-content:center;gap:14px;font-size:8px;color:#444;margin-top:2px">
            <span>✉ sales@adra-ai.com</span><span>📞 72088 36187</span>
          </div>
        </div>
      </div>
      <div class="title-banner">CALIBRATION CERTIFICATE</div>

      <div class="section-block">
        <div class="sec-bar">CERTIFICATE DETAILS</div>
        <div class="section-body">
          <div class="row"><div class="lbl">Certificate No.</div><div class="val">${c.id}</div></div>
          <div class="row"><div class="lbl">ULR No.</div><div class="val">${c.ulrNo || '—'}</div></div>
          <div class="row"><div class="lbl">Calibration Date</div><div class="val">${c.calDate || '—'}</div></div>
          <div class="row"><div class="lbl">Next Due Date</div><div class="val">${c.nextDue || '—'}</div></div>
        </div>
      </div>

      <div class="section-block">
        <div class="sec-bar">CUSTOMER &amp; INSTRUMENT</div>
        <div class="section-body">
          <div class="row"><div class="lbl">Customer</div><div class="val">${c.customer || '—'}</div></div>
          <div class="row"><div class="lbl">Address</div><div class="val">${c.address || '—'}</div></div>
          <div class="row"><div class="lbl">Instrument / Model</div><div class="val">${c.instrument || '—'}</div></div>
          <div class="row"><div class="lbl">Serial No.</div><div class="val">${c.serial || '—'}</div></div>
          <div class="row"><div class="lbl">Range / Capacity</div><div class="val">${c.range || '—'}</div></div>
          <div class="row"><div class="lbl">Least Count</div><div class="val">${c.leastCount || '—'}</div></div>
        </div>
      </div>

      <div class="section-block">
        <div class="sec-bar">TRACEABILITY</div>
        <div class="section-body">
          <div class="row"><div class="lbl">Reference Standard</div><div class="val">${c.refStd || '—'}</div></div>
          <div class="row"><div class="lbl">Std. Certificate No.</div><div class="val">${c.stdCert || '—'}</div></div>
          <div class="row"><div class="lbl">Environment</div><div class="val">${c.env || '—'}</div></div>
        </div>
      </div>

      <div class="section-block">
        <div class="sec-bar">CALIBRATION READINGS</div>
        <div class="section-body">
          <table class="rpt">
            <thead><tr><th>Nominal Value</th><th>Observed Reading</th><th>Error</th><th>Uncertainty (±)</th></tr></thead>
            <tbody>${readingRowsHtml || '<tr><td colspan="4">No readings recorded</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <div class="result-banner ${c.result === 'fail' ? 'result-fail' : 'result-pass'}">
        RESULT: ${(c.result || 'pass').toUpperCase()} ${c.result === 'pass' ? '— WITHIN TOLERANCE' : ''}
      </div>

      ${c.remarks ? `<div style="font-size:10px;margin-bottom:10px"><strong>Remarks:</strong> ${c.remarks}</div>` : ''}

      <div class="sign-area">
        <div></div>
        <div class="right">
          <div style="font-weight:800;margin-bottom:6px">Authorized Signatory</div>
          <div class="line"></div>
          <div>Calibrated By: ${c.calBy || ''}</div>
          <div>Approved By: ${c.approvedBy || ''}</div>
        </div>
      </div>
    </div>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`

    const printWin = window.open('', '_blank')
    if (printWin) {
      printWin.document.write(html)
      printWin.document.close()
    } else {
      toast.error('Could not open print window. Please allow popups.')
    }
  }

  // Filtered List Logic
  const getFilteredList = () => {
    let list = calList
    if (calFilter === 'valid') {
      list = list.filter((c) => {
        const d = daysUntil(c.nextDue)
        return d === null || d > 30
      })
    } else if (calFilter === 'due') {
      list = list.filter((c) => {
        const d = daysUntil(c.nextDue)
        return d !== null && d >= 0 && d <= 30
      })
    } else if (calFilter === 'overdue') {
      list = list.filter((c) => {
        const d = daysUntil(c.nextDue)
        return d !== null && d < 0
      })
    }

    if (searchQuery) {
      const s = searchQuery.toLowerCase()
      list = list.filter(
        (c) =>
          (c.id || '').toLowerCase().includes(s) ||
          (c.customer || '').toLowerCase().includes(s) ||
          (c.instrument || '').toLowerCase().includes(s) ||
          (c.serial || '').toLowerCase().includes(s) ||
          (c.ulrNo || '').toLowerCase().includes(s)
      )
    }
    return list
  }

  const filteredCals = getFilteredList()
  const selectedCal = calList.find((c) => c.id === activeCalId)

  // Counter stats
  const totalCount = calList.length
  const dueCount = calList.filter((c) => {
    const d = daysUntil(c.nextDue)
    return d !== null && d >= 0 && d <= 30
  }).length
  const overdueCount = calList.filter((c) => {
    const d = daysUntil(c.nextDue)
    return d !== null && d < 0
  }).length

  return (
    <>
      <PageTitle breadcrumbs={[]}>Calibration Certificates</PageTitle>
      <Content>
        {/* ══════════════════════════════════
             CALIBRATION CERTIFICATE — LIST
        ══════════════════════════════════ */}
        {viewState === 'list' && (
          <div className='d-flex flex-column gap-5'>
            {/* Hero Header Banner */}
            <div
              className='card border-0 text-white overflow-hidden shadow-sm'
              style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '12px' }}
            >
              <div className='card-body p-6 d-flex align-items-center justify-content-between flex-wrap gap-4'>
                <div className='d-flex align-items-center gap-4'>
                  <div className='fs-2hx p-3 rounded-circle bg-white bg-opacity-20 d-flex align-items-center justify-content-center'>
                    📜
                  </div>
                  <div>
                    <h2 className='text-white fw-bolder mb-1 fs-2'>NABL Calibration Certificates</h2>
                    <p className='text-white text-opacity-75 fs-7 m-0 fw-semibold'>
                      Archercal Calibration Laboratory · Vasai &amp; Vadodara Facilities
                    </p>
                  </div>
                </div>
                <button onClick={handleInitNewForm} className='btn btn-primary fw-bold px-5 py-3 shadow-sm'>
                  <i className='bi bi-plus-lg me-1 fs-5'></i> + New Calibration Certificate
                </button>
              </div>
            </div>

            {/* Stat Counters */}
            <div className='row g-4'>
              <div className='col-md-4'>
                <div className='card border-0 shadow-sm border-top border-4 border-primary h-100'>
                  <div className='card-body p-5 text-center'>
                    <span className='fs-2hx fw-bolder text-primary d-block'>{totalCount}</span>
                    <small className='text-gray-500 fw-bold fs-7 text-uppercase letter-spacing-1'>Total Certs</small>
                  </div>
                </div>
              </div>
              <div className='col-md-4'>
                <div className='card border-0 shadow-sm border-top border-4 border-warning h-100'>
                  <div className='card-body p-5 text-center'>
                    <span className='fs-2hx fw-bolder text-warning d-block'>{dueCount}</span>
                    <small className='text-gray-500 fw-bold fs-7 text-uppercase letter-spacing-1'>Due in 30 Days</small>
                  </div>
                </div>
              </div>
              <div className='col-md-4'>
                <div className='card border-0 shadow-sm border-top border-4 border-danger h-100'>
                  <div className='card-body p-5 text-center'>
                    <span className='fs-2hx fw-bolder text-danger d-block'>{overdueCount}</span>
                    <small className='text-gray-500 fw-bold fs-7 text-uppercase letter-spacing-1'>Overdue</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className='card border-0 shadow-sm'>
              <div className='card-body p-5'>
                <div className='d-flex align-items-center justify-content-between flex-wrap gap-4 mb-4'>
                  {/* Chips Filter */}
                  <div className='d-flex align-items-center gap-2 flex-wrap'>
                    <button
                      onClick={() => setCalFilter('all')}
                      className={`btn btn-sm px-4 py-2 fw-bold rounded-pill ${calFilter === 'all' ? 'btn-primary' : 'btn-light-primary text-gray-700'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setCalFilter('valid')}
                      className={`btn btn-sm px-4 py-2 fw-bold rounded-pill ${calFilter === 'valid' ? 'btn-primary' : 'btn-light-primary text-gray-700'}`}
                    >
                      ✅ Valid
                    </button>
                    <button
                      onClick={() => setCalFilter('due')}
                      className={`btn btn-sm px-4 py-2 fw-bold rounded-pill ${calFilter === 'due' ? 'btn-warning text-white' : 'btn-light-warning text-gray-700'}`}
                    >
                      ⏰ Due Soon
                    </button>
                    <button
                      onClick={() => setCalFilter('overdue')}
                      className={`btn btn-sm px-4 py-2 fw-bold rounded-pill ${calFilter === 'overdue' ? 'btn-danger' : 'btn-light-danger text-gray-700'}`}
                    >
                      ⚠️ Overdue
                    </button>
                  </div>

                  {/* Search and View Mode Switcher */}
                  <div className='d-flex align-items-center gap-3'>
                    <div className='position-relative w-250px w-md-300px'>
                      <span className='position-absolute ms-3 top-50 translate-middle-y text-gray-500 fs-6'>🔍</span>
                      <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='form-control form-control-solid ps-10 py-2 fs-7'
                        placeholder='Search Certificate / Customer / Instrument...'
                      />
                    </div>
                    <div className='btn-group btn-group-sm' role='group'>
                      <button
                        type='button'
                        className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => setViewMode('cards')}
                        title='Card View'
                      >
                        <i className='bi bi-grid-fill fs-6'></i>
                      </button>
                      <button
                        type='button'
                        className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => setViewMode('table')}
                        title='Table View'
                      >
                        <i className='bi bi-list-ul fs-6'></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cards List View */}
                {viewMode === 'cards' && (
                  <div className='row g-4 mt-1'>
                    {loading ? (
                      <div className='col-12 text-center text-gray-500 py-10 fs-6 fw-semibold'>
                        Loading calibration certificates...
                      </div>
                    ) : filteredCals.length === 0 ? (
                      <div className='col-12 text-center text-gray-500 py-10 fs-6 fw-semibold'>
                        No calibration certificates found
                      </div>
                    ) : (
                      filteredCals.map((c) => {
                        const st = calStatusOf(c)
                        return (
                          <div key={c.id} className='col-md-6 col-lg-4'>
                            <div
                              onClick={() => {
                                setActiveCalId(c.id)
                                setViewState('detail')
                              }}
                              className={`card h-100 shadow-sm border-0 cursor-pointer hover-elevate-up transition-all ${st.cardCls}`}
                              style={{ borderRadius: '10px', background: '#ffffff' }}
                            >
                              <div className='card-body p-5 d-flex flex-column justify-content-between'>
                                <div>
                                  <div className='d-flex justify-content-between align-items-start mb-3'>
                                    <div>
                                      <div className='fw-bolder fs-5 text-gray-900 mb-0.5'>{c.id}</div>
                                      <div className='text-gray-600 fs-7 fw-semibold'>{c.instrument || '—'}</div>
                                    </div>
                                    <span className={`badge ${st.cls} fw-bold px-3 py-1 fs-8`}>{st.text}</span>
                                  </div>

                                  <div className='separator border-gray-200 my-3'></div>

                                  <div className='d-flex flex-column gap-2 fs-7'>
                                    <div className='d-flex justify-content-between'>
                                      <span className='text-gray-500'>Customer</span>
                                      <span className='fw-bold text-gray-800 text-end'>{c.customer || '—'}</span>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                      <span className='text-gray-500'>Serial No.</span>
                                      <span className='fw-bold text-gray-800'>{c.serial || '—'}</span>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                      <span className='text-gray-500'>Calibration Date</span>
                                      <span className='fw-bold text-gray-800'>{c.calDate || '—'}</span>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                      <span className='text-gray-500'>Next Due</span>
                                      <span className='fw-bold text-gray-800'>{c.nextDue || '—'}</span>
                                    </div>
                                    <div className='d-flex justify-content-between'>
                                      <span className='text-gray-500'>Lab</span>
                                      <span className='fw-bold text-gray-800'>{c.labLocation || '—'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className='d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-gray-100'>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      printCal(c)
                                    }}
                                    className='btn btn-icon btn-light-info btn-sm'
                                    title='Print Certificate'
                                  >
                                    <i className='bi bi-printer fs-5'></i>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEdit(c)
                                    }}
                                    className='btn btn-icon btn-light-primary btn-sm'
                                    title='Edit Certificate'
                                  >
                                    <i className='bi bi-pencil fs-5'></i>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(c)
                                    }}
                                    className='btn btn-icon btn-light-danger btn-sm'
                                    title='Delete Certificate'
                                  >
                                    <i className='bi bi-trash fs-5'></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                  <div className='table-responsive mt-3'>
                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                      <thead>
                        <tr className='fw-bold text-muted text-uppercase fs-8 border-bottom border-gray-300'>
                          <th>Certificate No / ULR</th>
                          <th>Customer</th>
                          <th>Instrument / Model</th>
                          <th>Serial No</th>
                          <th>Cal Date</th>
                          <th>Next Due</th>
                          <th>Lab</th>
                          <th className='text-end'>Status</th>
                          <th className='text-end'>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={9} className='text-center text-gray-500 py-8'>
                              Loading calibration certificates...
                            </td>
                          </tr>
                        ) : filteredCals.length === 0 ? (
                          <tr>
                            <td colSpan={9} className='text-center text-gray-500 py-8'>
                              No calibration certificates found
                            </td>
                          </tr>
                        ) : (
                          filteredCals.map((c) => {
                            const st = calStatusOf(c)
                            return (
                              <tr key={c.id}>
                                <td>
                                  <span
                                    onClick={() => {
                                      setActiveCalId(c.id)
                                      setViewState('detail')
                                    }}
                                    className='text-gray-900 fw-bolder text-hover-primary cursor-pointer fs-6 d-block'
                                  >
                                    {c.id}
                                  </span>
                                  {c.ulrNo && <span className='text-gray-500 fs-8 d-block'>ULR: {c.ulrNo}</span>}
                                </td>
                                <td>
                                  <span className='text-gray-800 fw-bold fs-7'>{c.customer}</span>
                                </td>
                                <td>
                                  <span className='text-gray-800 fw-semibold fs-7'>{c.instrument}</span>
                                </td>
                                <td>
                                  <span className='text-gray-600 fs-7'>{c.serial}</span>
                                </td>
                                <td>
                                  <span className='text-gray-600 fs-7'>{c.calDate}</span>
                                </td>
                                <td>
                                  <span className='text-gray-600 fs-7'>{c.nextDue}</span>
                                </td>
                                <td>
                                  <span className='badge badge-light-secondary text-gray-700 fs-8'>{c.labLocation}</span>
                                </td>
                                <td className='text-end'>
                                  <span className={`badge ${st.cls} fw-bold px-3 py-1 fs-8`}>{st.text}</span>
                                </td>
                                <td className='text-end'>
                                  <div className='d-flex justify-content-end gap-2'>
                                    <button
                                      onClick={() => printCal(c)}
                                      className='btn btn-icon btn-light-info btn-sm'
                                      title='Print Certificate'
                                    >
                                      <i className='bi bi-printer fs-5'></i>
                                    </button>
                                    <button
                                      onClick={() => handleEdit(c)}
                                      className='btn btn-icon btn-light-primary btn-sm'
                                      title='Edit Certificate'
                                    >
                                      <i className='bi bi-pencil fs-5'></i>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(c)}
                                      className='btn btn-icon btn-light-danger btn-sm'
                                      title='Delete Certificate'
                                    >
                                      <i className='bi bi-trash fs-5'></i>
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
             CALIBRATION CERTIFICATE — NEW / EDIT FORM
        ══════════════════════════════════ */}
        {viewState === 'form' && (
          <div className='card border-0 shadow-sm'>
            {/* Form Header */}
            <div className='card-header border-0 pt-6 d-flex align-items-center justify-content-between'>
              <div className='d-flex align-items-center gap-3'>
                <button onClick={() => setViewState('list')} className='btn btn-icon btn-light btn-sm'>
                  <i className='bi bi-arrow-left fs-4'></i>
                </button>
                <h3 className='card-title fw-bolder text-gray-900 fs-3 m-0'>
                  {isEditing ? `Edit Calibration Certificate — ${formData.id}` : 'New Calibration Certificate'}
                </h3>
              </div>
              <div className='card-toolbar gap-2'>
                <button type='button' onClick={() => printCal()} className='btn btn-light-info btn-sm fw-bold me-2'>
                  🖨️ Print Preview
                </button>
                <button type='button' onClick={() => setViewState('list')} className='btn btn-light btn-sm fw-bold'>
                  Cancel
                </button>
              </div>
            </div>

            <div className='card-body pt-2'>
              {/* Form Custom Header Banner matching app theme */}
              <div
                className='p-6 text-white rounded mb-6'
                style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '10px' }}
              >
                <div className='d-flex align-items-center gap-4 mb-4'>
                  <div
                    className='fw-bolder fs-3 px-3 py-2 text-white bg-white bg-opacity-20 rounded'
                    style={{ letterSpacing: '2px' }}
                  >
                    A·C·I
                  </div>
                  <div>
                    <h3 className='text-white fw-bolder m-0 fs-4'>Archercal Calibration Laboratory</h3>
                    <p className='text-white text-opacity-75 fs-7 m-0'>NABL Accredited · Vasai, Maharashtra</p>
                  </div>
                </div>
                <div
                  className='p-3 text-center text-white fw-bolder fs-5 rounded'
                  style={{ background: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px' }}
                >
                  CALIBRATION CERTIFICATE
                </div>
              </div>

              {/* Section 1: Certificate Details */}
              <div className='border rounded p-5 mb-6 bg-light bg-opacity-50'>
                <h5 className='fw-bolder text-primary fs-5 mb-4 d-flex align-items-center gap-2'>
                  📋 Certificate Details
                </h5>
                <div className='row g-4 mb-4'>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7 required'>Certificate No. *</label>
                    <input
                      type='text'
                      value={formData.id || ''}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='ACI/CAL/2026/001'
                    />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7'>ULR No. (NABL)</label>
                    <input
                      type='text'
                      value={formData.ulrNo || ''}
                      onChange={(e) => setFormData({ ...formData, ulrNo: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='CC123456000000001F'
                    />
                  </div>
                </div>
                <div className='row g-4 mb-4'>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7 required'>Calibration Date *</label>
                    <input
                      type='date'
                      value={formData.calDate || ''}
                      onChange={(e) => setFormData({ ...formData, calDate: e.target.value })}
                      className='form-control form-control-solid'
                    />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7 required'>Next Due Date *</label>
                    <input
                      type='date'
                      value={formData.nextDue || ''}
                      onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })}
                      className='form-control form-control-solid'
                    />
                  </div>
                </div>
                <div className='row g-4'>
                  <div className='col-md-12'>
                    <label className='form-label fw-bold fs-7'>Calibration Lab Location</label>
                    <select
                      value={formData.labLocation || 'Vasai Laboratory'}
                      onChange={(e) => setFormData({ ...formData, labLocation: e.target.value })}
                      className='form-select form-select-solid'
                    >
                      <option value='Vasai Laboratory'>Vasai Laboratory</option>
                      <option value='Vadodara Laboratory'>Vadodara Laboratory</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Customer & Instrument */}
              <div className='border rounded p-5 mb-6 bg-light bg-opacity-50'>
                <h5 className='fw-bolder text-primary fs-5 mb-4 d-flex align-items-center gap-2'>
                  👤 Customer &amp; Instrument
                </h5>
                <div className='mb-4'>
                  <label className='form-label fw-bold fs-7 required'>Customer Name *</label>
                  <input
                    type='text'
                    value={formData.customer || ''}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='Customer / Company Name'
                  />
                </div>
                <div className='mb-4'>
                  <label className='form-label fw-bold fs-7'>Customer Address</label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className='form-control form-control-solid'
                    rows={2}
                    placeholder='Full address...'
                  />
                </div>
                <div className='row g-4 mb-4'>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7 required'>Instrument / Model *</label>
                    <input
                      type='text'
                      value={formData.instrument || ''}
                      onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='e.g. Radwag AS 220.X2'
                    />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7 required'>Serial No. *</label>
                    <input
                      type='text'
                      value={formData.serial || ''}
                      onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='Sr. No.'
                    />
                  </div>
                </div>
                <div className='row g-4'>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7'>Range / Capacity</label>
                    <input
                      type='text'
                      value={formData.range || ''}
                      onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='e.g. 220g'
                    />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7'>Least Count</label>
                    <input
                      type='text'
                      value={formData.leastCount || ''}
                      onChange={(e) => setFormData({ ...formData, leastCount: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='e.g. 0.1mg'
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Traceability */}
              <div className='border rounded p-5 mb-6 bg-light bg-opacity-50'>
                <h5 className='fw-bolder text-primary fs-5 mb-4 d-flex align-items-center gap-2'>
                  秤 Traceability
                </h5>
                <div className='mb-4'>
                  <label className='form-label fw-bold fs-7'>Reference Standard Used</label>
                  <input
                    type='text'
                    value={formData.refStd || ''}
                    onChange={(e) => setFormData({ ...formData, refStd: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='e.g. SS Weight Box Class F1, 1mg-200g'
                  />
                </div>
                <div className='row g-4'>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7'>Std. Cert. No.</label>
                    <input
                      type='text'
                      value={formData.stdCert || ''}
                      onChange={(e) => setFormData({ ...formData, stdCert: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='Reference cert no.'
                    />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7'>Environment Temp/RH</label>
                    <input
                      type='text'
                      value={formData.env || ''}
                      onChange={(e) => setFormData({ ...formData, env: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='e.g. 24°C / 55% RH'
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Calibration Readings */}
              <div className='border rounded p-5 mb-6 bg-light bg-opacity-50'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                  <h5 className='fw-bolder text-primary fs-5 m-0 d-flex align-items-center gap-2'>
                    📊 Calibration Readings
                  </h5>
                  <button type='button' onClick={addReadingRow} className='btn btn-sm btn-light-primary fw-bold'>
                    + Add Row
                  </button>
                </div>
                <div className='table-responsive'>
                  <table className='table table-bordered border-gray-300 align-middle gs-3 gy-2 fs-7'>
                    <thead className='bg-light-primary text-primary fw-bolder'>
                      <tr>
                        <th>Nominal Wt.</th>
                        <th>Observed Reading</th>
                        <th>Error</th>
                        <th>Uncertainty (±)</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.readings || []).map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type='text'
                              value={row.nominal}
                              onChange={(e) => handleReadingChange(idx, 'nominal', e.target.value)}
                              className='form-control form-control-sm form-control-solid'
                              placeholder='e.g. 100g'
                            />
                          </td>
                          <td>
                            <input
                              type='text'
                              value={row.observed}
                              onChange={(e) => handleReadingChange(idx, 'observed', e.target.value)}
                              className='form-control form-control-sm form-control-solid'
                              placeholder='e.g. 100.0012g'
                            />
                          </td>
                          <td>
                            <input
                              type='text'
                              value={row.error}
                              onChange={(e) => handleReadingChange(idx, 'error', e.target.value)}
                              className='form-control form-control-sm form-control-solid'
                              placeholder='e.g. +0.0012g'
                            />
                          </td>
                          <td>
                            <input
                              type='text'
                              value={row.uncertainty}
                              onChange={(e) => handleReadingChange(idx, 'uncertainty', e.target.value)}
                              className='form-control form-control-sm form-control-solid'
                              placeholder='e.g. ±0.0025g'
                            />
                          </td>
                          <td className='text-center'>
                            <button
                              type='button'
                              onClick={() => removeReadingRow(idx)}
                              disabled={(formData.readings || []).length <= 1}
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

              {/* Section 5: Result & Sign-off */}
              <div className='border rounded p-5 mb-6 bg-light bg-opacity-50'>
                <h5 className='fw-bolder text-primary fs-5 mb-4 d-flex align-items-center gap-2'>
                  📝 Result &amp; Sign-off
                </h5>
                <div className='mb-4'>
                  <label className='form-label fw-bold fs-7'>Result</label>
                  <select
                    value={formData.result || 'pass'}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value as any })}
                    className='form-select form-select-solid'
                  >
                    <option value='pass'>Pass — Within Tolerance</option>
                    <option value='fail'>Fail — Out of Tolerance</option>
                    <option value='conditional'>Conditional Pass (with remarks)</option>
                  </select>
                </div>
                <div className='mb-4'>
                  <label className='form-label fw-bold fs-7'>Remarks</label>
                  <textarea
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className='form-control form-control-solid'
                    rows={2}
                    placeholder='Any observations...'
                  />
                </div>
                <div className='row g-4'>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7 required'>Calibrated By *</label>
                    <input
                      type='text'
                      value={formData.calBy || ''}
                      onChange={(e) => setFormData({ ...formData, calBy: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='Engineer name'
                    />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label fw-bold fs-7'>Approved By</label>
                    <input
                      type='text'
                      value={formData.approvedBy || ''}
                      onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                      className='form-control form-control-solid'
                      placeholder='Lab Head'
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className='d-flex flex-wrap align-items-center justify-content-between gap-3 pt-4 border-top'>
                <div className='d-flex gap-3'>
                  <button type='button' onClick={saveCalDraft} className='btn btn-light-primary fw-bold'>
                    💾 Save Draft
                  </button>
                  <button type='button' onClick={submitCal} className='btn btn-primary fw-bold'>
                    ✅ Issue Certificate
                  </button>
                </div>
                <button type='button' onClick={() => printCal()} className='btn btn-outline btn-outline-primary fw-bold'>
                  🖨️ Print / Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
             CALIBRATION CERTIFICATE — VIEW (readonly)
        ══════════════════════════════════ */}
        {viewState === 'detail' && selectedCal && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6 d-flex align-items-center justify-content-between'>
              <div className='d-flex align-items-center gap-3'>
                <button onClick={() => setViewState('list')} className='btn btn-icon btn-light btn-sm'>
                  <i className='bi bi-arrow-left fs-4'></i>
                </button>
                <h3 className='card-title fw-bolder text-gray-900 fs-3 m-0'>Certificate Detail — {selectedCal.id}</h3>
              </div>
              <div className='card-toolbar gap-2'>
                <button onClick={() => handleEdit(selectedCal)} className='btn btn-light-primary btn-sm fw-bold me-2'>
                  ✏️ Edit
                </button>
                <button onClick={() => printCal(selectedCal)} className='btn btn-primary btn-sm fw-bold me-2'>
                  🖨️ Print Certificate
                </button>
                <button onClick={() => handleDelete(selectedCal)} className='btn btn-light-danger btn-sm fw-bold me-2'>
                  🗑️ Delete
                </button>
                <button onClick={() => setViewState('list')} className='btn btn-light btn-sm fw-bold'>
                  Back to List
                </button>
              </div>
            </div>

            <div className='card-body pt-2'>
              {/* Header Banner */}
              <div
                className='p-6 text-white rounded mb-6'
                style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '10px' }}
              >
                <div className='d-flex align-items-center gap-4 mb-3'>
                  <div className='fw-bolder fs-3 px-3 py-2 text-white bg-white bg-opacity-20 rounded'>A·C·I</div>
                  <div>
                    <h3 className='text-white fw-bolder m-0 fs-4'>Archercal Calibration Laboratory</h3>
                    <p className='text-white text-opacity-75 fs-7 m-0'>NABL Accredited · {selectedCal.labLocation}</p>
                  </div>
                </div>
                <div
                  className='p-3 text-center text-white fw-bolder fs-5 rounded'
                  style={{ background: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px' }}
                >
                  CALIBRATION CERTIFICATE — {selectedCal.id}
                </div>
              </div>

              {/* View Sections */}
              <div className='row g-6 mb-6'>
                <div className='col-md-6'>
                  <div className='border rounded p-5 h-100 bg-light bg-opacity-40'>
                    <h6 className='fw-bolder text-primary fs-6 mb-3 border-bottom pb-2'>Certificate Details</h6>
                    <div className='d-flex flex-column gap-2 fs-7'>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Certificate No.</span>
                        <strong className='text-gray-900'>{selectedCal.id}</strong>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>ULR No.</span>
                        <strong className='text-gray-900'>{selectedCal.ulrNo || '—'}</strong>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Calibration Date</span>
                        <strong className='text-gray-900'>{selectedCal.calDate || '—'}</strong>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Next Due Date</span>
                        <strong className='text-gray-900'>{selectedCal.nextDue || '—'}</strong>
                      </div>
                      <div className='d-flex justify-content-between align-items-center'>
                        <span className='text-gray-500'>Status</span>
                        <span className={`badge ${calStatusOf(selectedCal).cls} fw-bold px-3 py-1 fs-8`}>
                          {calStatusOf(selectedCal).text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='col-md-6'>
                  <div className='border rounded p-5 h-100 bg-light bg-opacity-40'>
                    <h6 className='fw-bolder text-primary fs-6 mb-3 border-bottom pb-2'>Customer &amp; Instrument</h6>
                    <div className='d-flex flex-column gap-2 fs-7'>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Customer</span>
                        <strong className='text-gray-900 text-end'>{selectedCal.customer || '—'}</strong>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Address</span>
                        <strong className='text-gray-900 text-end'>{selectedCal.address || '—'}</strong>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Instrument</span>
                        <strong className='text-gray-900'>{selectedCal.instrument || '—'}</strong>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Serial No.</span>
                        <strong className='text-gray-900'>{selectedCal.serial || '—'}</strong>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Range</span>
                        <strong className='text-gray-900'>{selectedCal.range || '—'}</strong>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span className='text-gray-500'>Least Count</span>
                        <strong className='text-gray-900'>{selectedCal.leastCount || '—'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='border rounded p-5 mb-6 bg-light bg-opacity-40'>
                <h6 className='fw-bolder text-primary fs-6 mb-3 border-bottom pb-2'>Traceability</h6>
                <div className='row g-4 fs-7'>
                  <div className='col-md-4'>
                    <span className='text-gray-500 d-block mb-1'>Reference Standard</span>
                    <strong className='text-gray-900'>{selectedCal.refStd || '—'}</strong>
                  </div>
                  <div className='col-md-4'>
                    <span className='text-gray-500 d-block mb-1'>Std. Cert. No.</span>
                    <strong className='text-gray-900'>{selectedCal.stdCert || '—'}</strong>
                  </div>
                  <div className='col-md-4'>
                    <span className='text-gray-500 d-block mb-1'>Environment</span>
                    <strong className='text-gray-900'>{selectedCal.env || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Calibration Readings */}
              <div className='border rounded p-5 mb-6 bg-light bg-opacity-40'>
                <h6 className='fw-bolder text-primary fs-6 mb-3 border-bottom pb-2'>Calibration Readings</h6>
                <div className='table-responsive'>
                  <table className='table table-bordered border-gray-300 align-middle gs-4 gy-2 fs-7 mb-0'>
                    <thead className='bg-light-primary text-primary fw-bolder'>
                      <tr>
                        <th>Nominal</th>
                        <th>Observed</th>
                        <th>Error</th>
                        <th>Uncertainty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCal.readings || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className='text-center text-gray-500'>
                            No readings recorded
                          </td>
                        </tr>
                      ) : (
                        selectedCal.readings.map((r, idx) => (
                          <tr key={idx}>
                            <td className='fw-semibold'>{r.nominal || '—'}</td>
                            <td>{r.observed || '—'}</td>
                            <td>{r.error || '—'}</td>
                            <td>{r.uncertainty || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Result & Signatures */}
              <div className='border rounded p-5 bg-light bg-opacity-40 mb-6'>
                <h6 className='fw-bolder text-primary fs-6 mb-3 border-bottom pb-2'>Result &amp; Sign-off</h6>
                <div className='row g-4 fs-7 mb-3'>
                  <div className='col-md-6'>
                    <span className='text-gray-500 d-block mb-1'>Result Verdict</span>
                    <span
                      className={`badge ${selectedCal.result === 'fail' ? 'badge-light-danger text-danger' : 'badge-light-success text-success'} fw-bolder px-4 py-2 fs-7 text-uppercase`}
                    >
                      {selectedCal.result} — {selectedCal.result === 'pass' ? 'WITHIN TOLERANCE' : ''}
                    </span>
                  </div>
                  <div className='col-md-6'>
                    <span className='text-gray-500 d-block mb-1'>Remarks</span>
                    <strong className='text-gray-900'>{selectedCal.remarks || '—'}</strong>
                  </div>
                </div>
                <div className='row g-4 fs-7 pt-3 border-top'>
                  <div className='col-md-6'>
                    <span className='text-gray-500 d-block mb-1'>Calibrated By</span>
                    <strong className='text-gray-900'>{selectedCal.calBy || '—'}</strong>
                  </div>
                  <div className='col-md-6'>
                    <span className='text-gray-500 d-block mb-1'>Approved By</span>
                    <strong className='text-gray-900'>{selectedCal.approvedBy || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='d-flex justify-content-end gap-3 pt-4 border-top'>
                <button onClick={() => handleEdit(selectedCal)} className='btn btn-light-primary fw-bold'>
                  ✏️ Edit
                </button>
                <button onClick={() => printCal(selectedCal)} className='btn btn-primary fw-bold'>
                  🖨️ Print Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default CalibrationPage
