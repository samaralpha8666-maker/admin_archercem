import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { KTIcon } from '../../../_metronic/helpers'
import { calcOimlClassAndMin } from './OIMLPage'
import { createStampingApplication, getStampingApplications, deleteStampingApplication } from '../auth/core/_requests'
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

export const generateAndPrintStampingPdf = (header: any, itemRows: StampRow[], total: number) => {
  const printWindow = window.open('', '_blank', 'width=1100,height=850')
  if (!printWindow) {
    toast.error('Please allow popups in your browser to print the application PDF.')
    return
  }

  const tableRowsHtml = itemRows
    .map(
      (r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.model || ''}</td>
      <td>${r.make || 'RADWAG'}</td>
      <td>${r.approval || ''}</td>
      <td>${r.cls || ''}</td>
      <td>${r.maxVal ? r.maxVal + ' ' + r.maxUnit : ''}</td>
      <td>${r.minWeight || ''}</td>
      <td>${r.dVal ? r.dVal + ' ' + r.dUnit : ''}</td>
      <td>${r.eVal ? r.eVal + ' ' + r.eUnit : ''}</td>
      <td>${r.qty || 1}</td>
      <td>${r.machine || ''}</td>
      <td>${r.amt || ''}</td>
    </tr>`
    )
    .join('')

  const toLines = (header.to || 'The Inspector of Legal Metrology, Vasai Division (I)').replace(/,\s*/g, '<br>')
  const logoUrl = window.location.origin + '/media/logos/archerchem.png'

  const html = `<!DOCTYPE html><html><head><title>Stamping Application - ${header.appNo}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    @page{size:A4 landscape;margin:10mm}
    body{font-family:Arial,sans-serif;font-size:10px;color:#111;padding:12px;-webkit-print-color-adjust:exact;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
    .logo-adra{font-family:Georgia,serif;font-size:20px;font-weight:900;letter-spacing:2px;color:#222}
    .logo-adra small{display:block;font-size:8px;font-weight:400;letter-spacing:0;color:#666}
    .logo-aci{text-align:right}
    .logo-aci img{max-height:48px;width:auto;object-fit:contain}
    .lic-block{text-align:right;font-size:9px;margin-bottom:12px;line-height:1.6}
    .meta{display:flex;justify-content:space-between;font-size:10px;margin-bottom:6px;font-weight:700}
    .to-block{font-size:10px;margin-bottom:10px;line-height:1.7}
    .subj{font-size:11px;font-weight:700;text-align:center;margin:10px 0;text-decoration:underline}
    .body-text{font-size:10px;margin-bottom:10px;line-height:1.6}
    table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:9.5px}
    th,td{border:1px solid #000;padding:5px 6px;text-align:center;vertical-align:middle}
    th{background:#f0f0f0;font-weight:800;font-size:9px}
    td:nth-child(2),td:nth-child(11){text-align:left}
    .grand-total-row td{font-weight:900;background:#f9f9f9}
    .payment-line{font-size:10px;margin-bottom:6px;line-height:1.8}
    .sign-row{display:flex;justify-content:space-between;margin-top:20px;font-size:10px;font-weight:700}
    .footer{text-align:center;font-size:8px;color:#555;margin-top:16px;border-top:1px solid #ccc;padding-top:6px}
    @media print{body{padding:0}}
  </style></head><body>
  <div class="header">
    <div><div class="logo-adra">ADRA<small>Weighing Accuracy</small></div></div>
    <div class="logo-aci">
      <img src="${logoUrl}" alt="Archerchem Logo" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%2240%22><text y=%2225%22 font-size=%2216%22 font-weight=%22bold%22 fill=%22%231a2b6b%22>⚖️ ARCHERCHEM</text></svg>';">
    </div>
  </div>
  <div class="lic-block">
    MFG.LIC.: ${header.mfgLic || 'LM/MH/LM/400'}<br>
    DLR LIC.: ${header.dlrLic || 'LM/MH/LD/419'}<br>
    REP LIC.: ${header.repLic || 'LM/MH/LR/601'}<br>
    LCR NO: ${header.lcrNo || '260194695'}
  </div>
  <div class="meta">
    <span>Date: ${header.date}</span>
    <span><strong>No. ${header.appNo}</strong></span>
  </div>
  <div class="to-block">
    To,<br>
    ${toLines}
  </div>
  <div class="subj">Sub.: ${header.subject || 'Verification and Stamping of Electronic Weighing scale.'}</div>
  <div class="body-text">
    Dear Sir,<br>
    As required by you we are pleased to provide the following details of Electronic Weighing Scale. We request you to
    kindly verify and stamp the following machine of class. All the machines are made by ${itemRows[0] && itemRows[0].make ? itemRows[0].make : 'RADWAG'}
  </div>
  <table>
    <thead>
      <tr>
        <th>Sr<br>No</th>
        <th>Model no.</th>
        <th>Make</th>
        <th>Model Approval no.</th>
        <th>Class</th>
        <th>Max</th>
        <th>Min</th>
        <th>d</th>
        <th>e</th>
        <th>Qty</th>
        <th>Machine no.</th>
        <th>Amt</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
      <tr class="grand-total-row">
        <td colspan="10" style="border:none;background:none"></td>
        <td style="text-align:right;font-weight:900;text-decoration:underline">GRAND TOTAL</td>
        <td>${total}</td>
      </tr>
    </tbody>
  </table>
  <div class="payment-line">
    We enclose herewith On Line/ Cheque/DD/Pay Order bearing Sr. No. <u>&nbsp;&nbsp;${header.chequeRef || '________'}&nbsp;&nbsp;</u>
    for amount <strong>Rs. ${total} /-</strong><br>
    As verification and stamping Charges Dated <u>${header.date}</u>
  </div>
  <div style="margin-top:10px">Thanking You<br>Yours Faithfully</div>
  <div class="sign-row">
    <span></span>
    <span>Archerchem Instruments.</span>
  </div>
  <div class="footer">
    ANMOL INDUSTRIAL ESTATE-2, GALA NO. 8 & 9, DHANYA SATIVALI NAGARI, VASAI (EAST) - 401208 &nbsp;|&nbsp;
    ANMOL INDUSTRIAL ESTATE-2, GALA NO. 8 & 9, DHANYA SATIVALI NAGARI, VASAI (EAST) - 401208 &nbsp;|&nbsp; ✉ sales@adra-ai.com &nbsp;|&nbsp; 📞 72088 36187
  </div>
  <script>
    function doPrint() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { window.close(); }, 500);
      }, 350);
    }
    if (document.readyState === 'complete') {
      doPrint();
    } else {
      window.onload = doPrint;
    }
  </script>
  </body></html>`

  printWindow.document.write(html)
  printWindow.document.close()
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
  const [savedApplications, setSavedApplications] = useState<any[]>([])
  const [loadingSaved, setLoadingSaved] = useState<boolean>(false)

  const reloadSavedApplications = async () => {
    setLoadingSaved(true)
    try {
      const res = await getStampingApplications()
      if (res.data?.success && Array.isArray(res.data.applications)) {
        setSavedApplications(res.data.applications)
      }
    } catch (err) {
      console.error('Failed to load saved stamping applications:', err)
    } finally {
      setLoadingSaved(false)
    }
  }

  useEffect(() => {
    const total = rows.reduce((acc, row) => acc + (row.amt || 0) * (row.qty || 1), 0)
    setGrandTotal(total)
  }, [rows])

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const res = await getStampingApplications()
        if (res.data?.success && res.data.applications?.length) {
          setSavedApplications(res.data.applications)
          const latest = res.data.applications[0]
          setHeaderForm({
            date: latest.date || new Date().toISOString().split('T')[0],
            appNo: latest.appNo || '093',
            to: latest.to || 'The Inspector of Legal Metrology, Vasai Division (I)',
            subject: latest.subject || 'Verification and Stamping of Electronic Weighing scale.',
            mfgLic: latest.mfgLic || 'LM/MH/LM/400',
            dlrLic: latest.dlrLic || 'LM/MH/LD/419',
            repLic: latest.repLic || 'LM/MH/LR/601',
            lcrNo: latest.lcrNo || '260194695',
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
        handleSaveAndPrint()
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

  const handleSaveOnly = async () => {
    if (!rows.some((r) => r.model)) {
      toast.error('Please enter at least one valid balance model.')
      return
    }

    try {
      const res = await createStampingApplication({
        date: headerForm.date,
        appNo: headerForm.appNo,
        to: headerForm.to,
        subject: headerForm.subject,
        mfgLic: headerForm.mfgLic,
        dlrLic: headerForm.dlrLic,
        repLic: headerForm.repLic,
        lcrNo: headerForm.lcrNo,
        chequeRef: headerForm.chequeRef,
        grandTotal,
        rows
      })
      if (res.data?.success) {
        toast.success('Stamping Application saved to database report list!')
        await reloadSavedApplications()
      } else {
        toast.error(res.data?.error || 'Failed to save stamping application.')
      }
    } catch (err: any) {
      console.error('Failed to save stamping application:', err)
      const msg = err?.response?.data?.error || err?.message || 'Failed to save stamping application.'
      toast.error(msg)
    }
  }

  const handleSaveAndPrint = async () => {
    if (!rows.some((r) => r.model)) {
      toast.error('Please enter at least one valid balance model.')
      return
    }

    try {
      const res = await createStampingApplication({
        date: headerForm.date,
        appNo: headerForm.appNo,
        to: headerForm.to,
        subject: headerForm.subject,
        mfgLic: headerForm.mfgLic,
        dlrLic: headerForm.dlrLic,
        repLic: headerForm.repLic,
        lcrNo: headerForm.lcrNo,
        chequeRef: headerForm.chequeRef,
        grandTotal,
        rows
      })
      if (res.data?.success) {
        toast.success('Stamping Application saved successfully!')
        await reloadSavedApplications()
      }
    } catch (err: any) {
      console.error('Failed to save stamping application:', err)
      const msg = err?.response?.data?.error || err?.message || 'Failed to save stamping application.'
      toast.error(msg)
    }

    generateAndPrintStampingPdf(headerForm, rows, grandTotal)
  }

  const handleDeleteApplication = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this saved stamping application?')) return
    try {
      await deleteStampingApplication(id)
      toast.success('Application deleted successfully')
      await reloadSavedApplications()
    } catch (err) {
      console.error('Failed to delete stamping application:', err)
      toast.error('Failed to delete application')
    }
  }

  const handleLoadApplication = (app: any) => {
    setHeaderForm({
      date: app.date || new Date().toISOString().split('T')[0],
      appNo: app.appNo || '093',
      to: app.to || 'The Inspector of Legal Metrology, Vasai Division (I)',
      subject: app.subject || 'Verification and Stamping of Electronic Weighing scale.',
      mfgLic: app.mfgLic || 'LM/MH/LM/400',
      dlrLic: app.dlrLic || 'LM/MH/LD/419',
      repLic: app.repLic || 'LM/MH/LR/601',
      lcrNo: app.lcrNo || '260194695',
      chequeRef: app.chequeRef || ''
    })
    if (Array.isArray(app.rows) && app.rows.length) {
      setRows(app.rows)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success(`Loaded Stamping Application #${app.appNo || app.id}`)
  }

  const handleReset = () => {
    setHeaderForm({
      date: new Date().toISOString().split('T')[0],
      appNo: (Math.floor(100 + Math.random() * 900)).toString(),
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
    toast.success('Form reset.')
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Legal Metrology Stamping Application</PageTitle>
      <Content>
        <div className='d-flex flex-column gap-6'>
          {/* Hero Banner Card */}
          <div
            className='card border-0 rounded-4 shadow-sm position-relative overflow-hidden'
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
              color: '#ffffff'
            }}
          >
            <div className='card-body p-8 position-relative' style={{ zIndex: 1 }}>
              <div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4'>
                <div>
                  <div className='d-flex align-items-center gap-2 mb-2'>
                    <span className='badge bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-pill fs-8 fw-bold'>
                      📜 Government Verification Form
                    </span>
                    <span className='badge bg-success bg-opacity-90 text-white px-3 py-1.5 rounded-pill fs-8 fw-bold'>
                      Legal Metrology Act 2009
                    </span>
                  </div>
                  <h1 className='fs-2hx fw-extrabold text-white mb-2'>Stamping Application Generator</h1>
                  <p className='text-white text-opacity-80 fw-semibold fs-6 mb-0' style={{ maxWidth: '650px' }}>
                    Generate, print &amp; save official Inspector of Legal Metrology verification forms with multi-balance specs, accuracy classes, and payment references.
                  </p>
                </div>

                <div className='d-flex align-items-center gap-3'>
                  <button onClick={handleReset} className='btn btn-outline btn-outline-white btn-active-light-secondary fw-bold fs-7'>
                    🔄 Reset Form
                  </button>
                  <button onClick={handleSaveOnly} className='btn btn-success fw-bold fs-7 d-flex align-items-center gap-2'>
                    <KTIcon iconName='check-circle' className='fs-4' />
                    Save Only
                  </button>
                  <button onClick={handleSaveAndPrint} className='btn btn-primary fw-bold fs-7 d-flex align-items-center gap-2'>
                    <KTIcon iconName='printer' className='fs-4' />
                    Save &amp; Print PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Header Controls Card */}
          <div className='card card-flush shadow-sm border-0 bg-body'>
            <div className='card-header pt-6 border-0'>
              <h3 className='card-title fw-bolder text-gray-900 fs-4 d-flex align-items-center gap-2'>
                <KTIcon iconName='document' className='fs-3 text-primary' />
                Application Metadata &amp; Inspector Info
              </h3>
            </div>

            <div className='card-body pt-2'>
              <div className='row g-4'>
                <div className='col-12 col-md-3'>
                  <label className='form-label fw-bold fs-7 text-gray-800 required'>Application Date</label>
                  <input
                    type='date'
                    value={headerForm.date}
                    onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                  />
                </div>

                <div className='col-12 col-md-3'>
                  <label className='form-label fw-bold fs-7 text-gray-800 required'>Application No.</label>
                  <input
                    type='text'
                    value={headerForm.appNo}
                    onChange={(e) => setHeaderForm({ ...headerForm, appNo: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                    placeholder='e.g. 093'
                  />
                </div>

                <div className='col-12 col-md-6'>
                  <label className='form-label fw-bold fs-7 text-gray-800 required'>To (Inspector Division)</label>
                  <input
                    type='text'
                    value={headerForm.to}
                    onChange={(e) => setHeaderForm({ ...headerForm, to: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                    placeholder='The Inspector of Legal Metrology, Vasai Division (I)'
                  />
                </div>

                <div className='col-12'>
                  <label className='form-label fw-bold fs-7 text-gray-800 required'>Subject Line</label>
                  <input
                    type='text'
                    value={headerForm.subject}
                    onChange={(e) => setHeaderForm({ ...headerForm, subject: e.target.value })}
                    className='form-control form-control-solid fw-bold fs-7'
                    placeholder='Verification and Stamping of Electronic Weighing scale.'
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

          {/* Bottom Action Toolbar Card */}
          <div className='card border-0 shadow-sm rounded-4 bg-body p-5'>
            <div className='d-flex flex-column flex-sm-row align-items-center justify-content-between gap-4'>
              <div className='d-flex align-items-center gap-2'>
                <span className='badge badge-light-primary p-3 rounded-circle'>
                  <KTIcon iconName='shield-check' className='fs-2 text-primary' />
                </span>
                <div>
                  <h4 className='fw-bolder text-gray-900 fs-5 mb-0'>Ready to Save or Print</h4>
                  <span className='fs-8 text-muted fw-semibold'>Save application record to backend reports or generate printable PDF</span>
                </div>
              </div>

              <div className='d-flex align-items-center gap-3 w-100 w-sm-auto justify-content-end'>
                <button onClick={handleReset} type='button' className='btn btn-light fw-bold fs-7 px-5'>
                  🔄 Reset
                </button>
                <button onClick={handleSaveOnly} type='button' className='btn btn-success fw-extrabold fs-7 px-5 d-flex align-items-center gap-2'>
                  <KTIcon iconName='check-circle' className='fs-4' />
                  Save Application
                </button>
                <button onClick={handleSaveAndPrint} type='button' className='btn btn-primary fw-extrabold fs-7 px-5 d-flex align-items-center gap-2'>
                  <KTIcon iconName='printer' className='fs-4' />
                  Save &amp; Print PDF
                </button>
              </div>
            </div>
          </div>

          {/* Saved Applications History & PDF Archive Table */}
          <div className='card card-flush shadow-sm border-0 bg-body mt-4'>
            <div className='card-header pt-6 border-0 d-flex align-items-center justify-content-between'>
              <div>
                <h3 className='card-title fw-bolder text-gray-900 fs-4 d-flex align-items-center gap-2 mb-1'>
                  <KTIcon iconName='archive' className='fs-3 text-info' />
                  Saved Stamping Applications History &amp; PDF Archive
                </h3>
                <span className='text-muted fs-8 fw-semibold'>View all saved legal metrology applications and re-print PDFs anytime</span>
              </div>
              <button onClick={reloadSavedApplications} className='btn btn-sm btn-light-info fw-bold d-flex align-items-center gap-1'>
                <KTIcon iconName='arrows-loop' className='fs-5' /> Refresh List
              </button>
            </div>

            <div className='card-body pt-2'>
              {loadingSaved ? (
                <div className='text-center py-8 text-muted fs-7'>Loading saved applications...</div>
              ) : savedApplications.length > 0 ? (
                <div className='table-responsive border rounded-3'>
                  <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-3 mb-0 fs-7'>
                    <thead>
                      <tr className='fw-bolder text-muted bg-light text-uppercase fs-8'>
                        <th className='ps-4'>App No</th>
                        <th>Date</th>
                        <th>To / Inspector Division</th>
                        <th>Balances Count</th>
                        <th>Grand Total (₹)</th>
                        <th className='text-end pe-4'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='text-gray-800 fw-semibold'>
                      {savedApplications.map((app, idx) => (
                        <tr key={app.id || idx}>
                          <td className='ps-4 fw-extrabold text-gray-900'>#{app.appNo || app.id}</td>
                          <td>{app.date}</td>
                          <td className='text-truncate max-w-250px'>{app.to || 'Legal Metrology Vasai'}</td>
                          <td>
                            <span className='badge badge-light-primary fw-bold fs-8'>
                              {Array.isArray(app.rows) ? app.rows.length : 1} Balances
                            </span>
                          </td>
                          <td className='fw-extrabold text-primary'>₹ {(app.grandTotal || 0).toLocaleString('en-IN')}</td>
                          <td className='text-end pe-4'>
                            <div className='d-flex align-items-center justify-content-end gap-2'>
                              <button
                                onClick={() => generateAndPrintStampingPdf(app, app.rows || [], app.grandTotal || 0)}
                                className='btn btn-sm btn-light-primary fw-bold fs-8 d-flex align-items-center gap-1'
                                title='Re-Print Official PDF Application'
                              >
                                <KTIcon iconName='printer' className='fs-5' /> Print PDF
                              </button>
                              <button
                                onClick={() => handleLoadApplication(app)}
                                className='btn btn-sm btn-light-info fw-bold fs-8'
                                title='Load into Form'
                              >
                                ✏️ Load
                              </button>
                              <button
                                onClick={() => handleDeleteApplication(app.id)}
                                className='btn btn-sm btn-light-danger fw-bold fs-8'
                                title='Delete Application'
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='text-center py-10 border border-dashed rounded-3 bg-light'>
                  <KTIcon iconName='document' className='fs-3hx text-gray-400 mb-2' />
                  <div className='fw-bold fs-6 text-gray-800'>No Saved Stamping Applications Yet</div>
                  <div className='text-muted fs-8'>Fill in the form above and click "Save Application" or "Save &amp; Print PDF" to archive applications here.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Content>
    </>
  )
}

export default StampingPage
