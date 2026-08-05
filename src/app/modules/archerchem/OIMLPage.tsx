import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { KTIcon } from '../../../_metronic/helpers'
import { createOimlRecord, getOimlRecords } from '../auth/core/_requests'
import toast from 'react-hot-toast'

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

function oimlCalcCore(maxG: number, eG: number) {
  const counts = maxG / eG
  let cls: 'I' | 'II' | 'III' | 'IIII'
  if (counts > 100000) cls = 'I'
  else if (counts > 10000) cls = 'II'
  else if (counts > 1000) cls = 'III'
  else cls = 'IIII'

  let minG: number
  if (cls === 'I') minG = 100 * eG
  else if (cls === 'II') minG = eG >= 0.000001 && eG <= 0.00005 ? 20 * eG : 50 * eG
  else if (cls === 'III') minG = 20 * eG
  else minG = 10 * eG

  const uspMinG = eG * 0.41 * 2000
  const uspMaxG = eG * 0.5 * 2000

  const mpeRanges: { mpe: number; start: number; end: number }[] = []
  const classDefs = {
    I: { limits: [[0, 50000], [50000, 200000], [200000, Infinity]], errs: [0.5, 1, 1.5] },
    II: { limits: [[0, 5000], [5000, 20000], [20000, 100000]], errs: [0.5, 1, 1.5] },
    III: { limits: [[0, 500], [500, 2000], [2000, 10000]], errs: [0.5, 1, 1.5] },
    IIII: { limits: [[0, 50], [50, 200], [200, 1000]], errs: [0.5, 1, 1.5] }
  }
  const def = classDefs[cls]
  def.limits.forEach(([lo, hi], i) => {
    const start = Math.max(lo * eG, minG)
    const end = Math.min(hi * eG, maxG)
    if (start >= end) return
    mpeRanges.push({ mpe: def.errs[i] * eG, start, end })
  })

  return { cls, minG, uspMinG, uspMaxG, mpeRanges }
}

export function calcOimlClassAndMin(maxValStr: string, maxUnit: string, eValStr: string, eUnit: string) {
  const maxVal = parseFloat(maxValStr)
  const eVal = parseFloat(eValStr)
  if (isNaN(maxVal) || isNaN(eVal) || maxVal <= 0 || eVal <= 0) {
    return { cls: '', minWeight: '' }
  }
  const maxG = oimlToGrams(maxVal, maxUnit)
  const eG = oimlToGrams(eVal, eUnit)
  const calc = oimlCalcCore(maxG, eG)
  return {
    cls: `Class ${calc.cls}`,
    minWeight: formatWeight(calc.minG, eUnit)
  }
}

const OIMLPage: FC = () => {
  const [maxCap, setMaxCap] = useState<string>('220')
  const [maxUnit, setMaxUnit] = useState<string>('g')
  const [readability, setReadability] = useState<string>('0.1')
  const [readUnit, setReadUnit] = useState<string>('mg')
  const [displayUnit, setDisplayUnit] = useState<string>('g')

  const [calculationResult, setCalculationResult] = useState<{
    cls: 'I' | 'II' | 'III' | 'IIII'
    minG: number
    uspMinG: number
    uspMaxG: number
    mpeRanges: { mpe: number; start: number; end: number }[]
  } | null>(null)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    const maxVal = parseFloat(maxCap)
    const eVal = parseFloat(readability)

    if (isNaN(maxVal) || isNaN(eVal) || maxVal <= 0 || eVal <= 0) {
      toast.error('Enter valid Max Capacity and Scale Interval (e) values')
      return
    }

    const maxG = oimlToGrams(maxVal, maxUnit)
    const eG = oimlToGrams(eVal, readUnit)
    const result = oimlCalcCore(maxG, eG)

    setCalculationResult(result)

    try {
      await createOimlRecord({
        maxCap: maxVal,
        maxUnit,
        readability: eVal,
        readUnit,
        displayUnit,
        oimlClass: result.cls,
        minG: result.minG,
        uspMinG: result.uspMinG,
        uspMaxG: result.uspMaxG,
        mpeRanges: result.mpeRanges
      })
      toast.success(`Calculated & Saved OIML Class ${result.cls}`)
    } catch (err) {
      console.error('Failed to save OIML calculation to API:', err)
      toast.success(`Calculated OIML Class ${result.cls}`)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        handlePrint()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [calculationResult, maxCap, maxUnit, readability, readUnit, displayUnit])

  const handlePrint = () => {
    if (!calculationResult) {
      toast.error('Please calculate OIML parameters first.')
      return
    }

    const info = getClassInfo(calculationResult.cls)
    const certNo = `AC-OIML-2026-${Math.floor(10000 + Math.random() * 90000)}`
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    const printWindow = window.open('', '_blank', 'width=900,height=1000')
    if (!printWindow) {
      toast.error('Please allow popups in your browser to print the PDF Certificate.')
      return
    }

    const mpeRowsHtml = calculationResult.mpeRanges
      .map(
        (m) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 13px; color: #1e293b;">
          ${formatWeight(m.start, displayUnit)} — ${formatWeight(m.end, displayUnit)}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 800; font-size: 13px; color: #0284c7; text-align: right;">
          ± ${formatWeight(m.mpe, displayUnit)}
        </td>
      </tr>
    `
      )
      .join('')

    const logoUrl = window.location.origin + '/media/logos/archerchem.png'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OIML Certificate - ${certNo}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 20px;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
            }
            .cert-container {
              border: 2px solid #1e293b;
              border-radius: 12px;
              padding: 28px;
              box-sizing: border-box;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 18px;
              margin-bottom: 20px;
            }
            .brand-title {
              font-size: 22px;
              font-weight: 900;
              color: #1e1b4b;
              letter-spacing: -0.5px;
            }
            .brand-sub {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              margin-top: 3px;
            }
            .meta-box {
              text-align: right;
              font-size: 11px;
              color: #475569;
              line-height: 1.5;
            }
            .meta-no {
              font-weight: 800;
              color: #4338ca;
              font-size: 13px;
            }
            .cert-banner {
              background: linear-gradient(135deg, ${info.color} 0%, ${info.color}dd 100%);
              color: #ffffff;
              padding: 16px 20px;
              border-radius: 10px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .cert-banner-title {
              font-size: 20px;
              font-weight: 900;
            }
            .cert-banner-sub {
              font-size: 12px;
              opacity: 0.9;
              margin-top: 2px;
            }
            .sec-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #334155;
              margin-bottom: 10px;
              margin-top: 18px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 16px;
            }
            .card {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 14px;
              background: #f8fafc;
            }
            .card-lbl {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 4px;
            }
            .card-val {
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
            }
            .card-sub {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              overflow: hidden;
            }
            th {
              background: #f1f5f9;
              padding: 10px 14px;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              color: #475569;
              text-align: left;
              border-bottom: 1px solid #cbd5e1;
            }
            .footer-sign {
              display: flex;
              justify-content: space-between;
              margin-top: 36px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
            }
            .sign-box {
              text-align: center;
              width: 180px;
            }
            .sign-line {
              border-bottom: 1px solid #94a3b8;
              margin-bottom: 8px;
              height: 35px;
            }
            .sign-lbl {
              font-size: 11px;
              font-weight: 700;
              color: #334155;
            }
            .sign-sub {
              font-size: 10px;
              color: #64748b;
            }
            .disclaimer {
              font-size: 10px;
              color: #94a3b8;
              margin-top: 20px;
              text-align: center;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="cert-container">
            <div class="header">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="${logoUrl}" alt="Archerchem Logo" style="max-height:48px;width:auto;object-fit:contain" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%2240%22><text y=%2225%22 font-size=%2216%22 font-weight=%22bold%22 fill=%22%231a2b6b%22>⚖️ ARCHERCHEM</text></svg>';">
                <div>
                  <div class="brand-title">ARCHERCHEM INSTRUMENTS</div>
                  <div class="brand-sub">Vasai Factory · Metrology & Calibration Laboratory (ISO 17025 Accredited)</div>
                </div>
              </div>
              <div class="meta-box">
                <div>Certificate Ref: <span class="meta-no">${certNo}</span></div>
                <div>Date of Evaluation: <strong>${today}</strong></div>
                <div>Standard: <strong>OIML R76 / USP &lt;41&gt;</strong></div>
              </div>
            </div>

            <div class="cert-banner">
              <div>
                <div class="cert-banner-title">Accuracy Classification: ${info.label}</div>
                <div class="cert-banner-sub">${info.sub}</div>
              </div>
              <div style="font-size: 30px;">⚖️</div>
            </div>

            <div class="sec-title">1. Instrument Specifications</div>
            <div class="grid-2">
              <div class="card">
                <div class="card-lbl">Maximum Capacity (Max)</div>
                <div class="card-val">${maxCap} ${maxUnit}</div>
                <div class="card-sub">Equivalent: ${oimlToGrams(parseFloat(maxCap), maxUnit)} g</div>
              </div>
              <div class="card">
                <div class="card-lbl">Scale Interval / Readability (e)</div>
                <div class="card-val">${readability} ${readUnit}</div>
                <div class="card-sub">Scale Divisions n = ${Math.round(oimlToGrams(parseFloat(maxCap), maxUnit) / oimlToGrams(parseFloat(readability), readUnit)).toLocaleString()}</div>
              </div>
            </div>

            <div class="sec-title">2. Minimum Operating Weight Limits</div>
            <div class="grid-2">
              <div class="card" style="border-left: 4px solid #4338ca;">
                <div class="card-lbl">OIML Minimum Weight (Min)</div>
                <div class="card-val" style="color: #4338ca;">${formatWeight(calculationResult.minG, displayUnit)}</div>
                <div class="card-sub">Minimum load required for verified legal trade</div>
              </div>
              <div class="card" style="border-left: 4px solid #059669;">
                <div class="card-lbl">USP &lt;41&gt; Operating Range</div>
                <div class="card-val" style="color: #059669; font-size: 16px;">
                  ${formatWeight(calculationResult.uspMinG, displayUnit)} – ${formatWeight(calculationResult.uspMaxG, displayUnit)}
                </div>
                <div class="card-sub">Required minimum sample weight range for pharma USP compliance</div>
              </div>
            </div>

            <div class="sec-title">3. Maximum Permissible Error (MPE) Table</div>
            <table>
              <thead>
                <tr>
                  <th>Test Load Range (${displayUnit})</th>
                  <th style="text-align: right;">Maximum Permissible Error MPE (±)</th>
                </tr>
              </thead>
              <tbody>
                ${mpeRowsHtml}
              </tbody>
            </table>

            <div class="footer-sign">
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-lbl">Evaluated By</div>
                <div class="sign-sub">Metrology Engineer</div>
              </div>
              <div style="text-align: center; margin-top: 6px;">
                <div style="font-size: 22px;">🛡️</div>
                <div style="font-size: 10px; font-weight: 800; color: #4338ca; text-transform: uppercase; margin-top: 2px;">ISO 17025 Certified Lab</div>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-lbl">Authorized Signatory</div>
                <div class="sign-sub">QC & Technical Manager</div>
              </div>
            </div>

            <div class="disclaimer">
              This official evaluation report certifies that the instrument parameters specified above conform to OIML R76 non-automatic weighing instrument tolerances and USP &lt;41&gt; operating specifications. Issued by Archerchem Instruments Metrology Department.
            </div>
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
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const getClassInfo = (cls: string) => {
    switch (cls) {
      case 'I':
        return { label: 'Class I', sub: 'Ultra-high precision (Analytical / Micro balance)', color: '#4338ca', bg: 'bg-primary' }
      case 'II':
        return { label: 'Class II', sub: 'High precision (Laboratory balance)', color: '#0284c7', bg: 'bg-info' }
      case 'III':
        return { label: 'Class III', sub: 'Medium precision (Industrial / Commercial scale)', color: '#059669', bg: 'bg-success' }
      default:
        return { label: 'Class IIII', sub: 'Ordinary precision (Rough weighing)', color: '#d97706', bg: 'bg-warning' }
    }
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>OIML / USP Weight Calculator</PageTitle>
      <Content>
        <div className='d-flex flex-column gap-6'>
          {/* Hero Banner */}
          <div
            className='card border-0 rounded-4 shadow-sm position-relative overflow-hidden'
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
              color: '#ffffff'
            }}
          >
            <div className='card-body p-8 position-relative' style={{ zIndex: 1 }}>
              <div className='d-flex align-items-center gap-4'>
                <div className='p-4 bg-white bg-opacity-10 rounded-circle text-white'>
                  <KTIcon iconName='calculator' className='fs-2hx' />
                </div>
                <div>
                  <span className='badge bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-pill fs-8 fw-bold mb-2 d-inline-block'>
                    ⚖️ Metrology Standard R76
                  </span>
                  <h1 className='fs-2hx fw-extrabold text-white mb-1'>OIML / USP Weight Calculator</h1>
                  <p className='text-white text-opacity-80 fw-semibold fs-6 mb-0'>
                    Determine accuracy class, minimum operating weight &amp; maximum permissible error (MPE) tolerances under OIML R76 &amp; USP &lt;41&gt; guidelines.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='row g-6'>
            {/* Input Form Column */}
            <div className='col-12 col-lg-5'>
              <div className='card card-flush shadow-sm border-0 bg-body'>
                <div className='card-header pt-6 border-0'>
                  <h3 className='card-title fw-bolder text-gray-900 fs-4 d-flex align-items-center gap-2'>
                    <KTIcon iconName='element-11' className='fs-3 text-primary' />
                    Instrument Parameters
                  </h3>
                </div>

                <div className='card-body pt-2'>
                  <form onSubmit={handleCalculate} className='d-flex flex-column gap-4'>
                    <div>
                      <label className='form-label fw-bold fs-7 text-gray-800 required'>Maximum Capacity (Max)</label>
                      <div className='input-group'>
                        <input
                          type='number'
                          step='any'
                          value={maxCap}
                          onChange={(e) => setMaxCap(e.target.value)}
                          className='form-control form-control-solid fw-bold fs-6'
                          placeholder='e.g. 220'
                          required
                        />
                        <select
                          value={maxUnit}
                          onChange={(e) => setMaxUnit(e.target.value)}
                          className='form-select form-select-solid fw-bold fs-6 w-100px'
                        >
                          <option value='mg'>mg</option>
                          <option value='g'>g</option>
                          <option value='kg'>kg</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className='form-label fw-bold fs-7 text-gray-800 required'>Scale Interval / Readability (e)</label>
                      <div className='input-group'>
                        <input
                          type='number'
                          step='any'
                          value={readability}
                          onChange={(e) => setReadability(e.target.value)}
                          className='form-control form-control-solid fw-bold fs-6'
                          placeholder='e.g. 0.1'
                          required
                        />
                        <select
                          value={readUnit}
                          onChange={(e) => setReadUnit(e.target.value)}
                          className='form-select form-select-solid fw-bold fs-6 w-100px'
                        >
                          <option value='mg'>mg</option>
                          <option value='g'>g</option>
                          <option value='kg'>kg</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className='form-label fw-bold fs-7 text-gray-800'>Display Results Unit</label>
                      <select
                        value={displayUnit}
                        onChange={(e) => setDisplayUnit(e.target.value)}
                        className='form-select form-select-solid fw-bold fs-6'
                      >
                        <option value='mg'>mg</option>
                        <option value='g'>g</option>
                        <option value='kg'>kg</option>
                      </select>
                    </div>

                    <button type='submit' className='btn btn-primary fw-bold fs-6 py-3 mt-2 shadow-sm d-flex align-items-center justify-content-center gap-2'>
                      <KTIcon iconName='calculator' className='fs-3' />
                      Calculate OIML &amp; USP Parameters
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className='col-12 col-lg-7'>
              {calculationResult ? (
                <div className='d-flex flex-column gap-5'>
                  {/* Accuracy Class Banner */}
                  {(() => {
                    const info = getClassInfo(calculationResult.cls)
                    return (
                      <div
                        className='card border-0 shadow-sm text-white rounded-4 p-6'
                        style={{ background: `linear-gradient(135deg, ${info.color} 0%, ${info.color}dd 100%)` }}
                      >
                        <div className='d-flex align-items-center justify-content-between'>
                          <div>
                            <span className='badge bg-white bg-opacity-20 text-white px-3 py-1 rounded-pill fs-8 fw-bold mb-2'>
                              Official Accuracy Class
                            </span>
                            <h2 className='fs-2hx fw-extrabold text-white mb-1'>{info.label}</h2>
                            <p className='text-white text-opacity-90 fw-semibold fs-7 mb-0'>{info.sub}</p>
                          </div>
                          <span className='fs-3hx me-2'>⚖️</span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Minimum Weight Cards */}
                  <div className='row g-4'>
                    <div className='col-12 col-sm-6'>
                      <div className='card card-flush shadow-sm border-0 bg-body p-5 h-100'>
                        <span className='text-gray-500 fs-8 fw-bold text-uppercase mb-1'>📏 Minimum Weight (OIML)</span>
                        <span className='fs-2hx fw-extrabold text-primary mb-1'>
                          {formatWeight(calculationResult.minG, displayUnit)}
                        </span>
                        <span className='text-muted fs-8 fw-semibold'>Calculated based on class division rules</span>
                      </div>
                    </div>

                    <div className='col-12 col-sm-6'>
                      <div className='card card-flush shadow-sm border-0 bg-body p-5 h-100'>
                        <span className='text-gray-500 fs-8 fw-bold text-uppercase mb-1'>🧪 Minimum Weight (USP &lt;41&gt;)</span>
                        <span className='fs-2x fw-extrabold text-success mb-1'>
                          {formatWeight(calculationResult.uspMinG, displayUnit)} – {formatWeight(calculationResult.uspMaxG, displayUnit)}
                        </span>
                        <span className='text-muted fs-8 fw-semibold'>Pharma USP operating range requirement</span>
                      </div>
                    </div>
                  </div>

                  {/* MPE Table */}
                  <div className='card card-flush shadow-sm border-0 bg-body'>
                    <div className='card-header pt-5 border-0'>
                      <h4 className='card-title fw-extrabold text-gray-900 fs-5 d-flex align-items-center gap-2'>
                        <KTIcon iconName='shield-tick' className='fs-3 text-info' />
                        Maximum Permissible Error (MPE) Table
                      </h4>
                    </div>

                    <div className='card-body pt-2'>
                      <div className='table-responsive border rounded-3'>
                        <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-3 mb-0 fs-7'>
                          <thead>
                            <tr className='fw-bolder text-muted bg-light text-uppercase fs-8'>
                              <th className='ps-4'>Load Range</th>
                              <th className='text-end pe-4'>Tolerance MPE (±)</th>
                            </tr>
                          </thead>
                          <tbody className='text-gray-800 fw-semibold'>
                            {calculationResult.mpeRanges.length > 0 ? (
                              calculationResult.mpeRanges.map((m, idx) => (
                                <tr key={idx}>
                                  <td className='ps-4 fw-bold'>
                                    {formatWeight(m.start, displayUnit)} — {formatWeight(m.end, displayUnit)}
                                  </td>
                                  <td className='text-end pe-4 fw-extrabold text-primary'>
                                    ± {formatWeight(m.mpe, displayUnit)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className='text-center py-4 text-muted fs-8'>
                                  No MPE ranges calculated for current parameters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className='mt-4 d-flex justify-content-end'>
                        <button onClick={handlePrint} className='btn btn-light-primary fw-bold fs-7 d-flex align-items-center gap-2'>
                          <KTIcon iconName='printer' className='fs-4' />
                          Print / Save OIML Certificate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='card card-flush shadow-sm border-0 bg-body p-10 text-center d-flex flex-column align-items-center justify-content-center min-h-350px'>
                  <div className='symbol symbol-75px mb-4'>
                    <div className='symbol-label bg-light-primary text-primary rounded-circle'>
                      <KTIcon iconName='calculator' className='fs-3hx' />
                    </div>
                  </div>
                  <h3 className='fw-bolder text-gray-900 mb-1'>Ready to Calculate</h3>
                  <p className='text-muted fs-7 max-w-400px mb-0'>
                    Enter the Max Capacity and Scale Interval (e) in the form to generate accuracy class, min weights &amp; MPE tolerance ranges.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Content>
    </>
  )
}

export default OIMLPage
