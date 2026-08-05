import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'
import {
  getQcReports,
  createQcReport,
  updateQcReport,
  deleteQcReport
} from '../auth/core/_requests'

interface EccPoint {
  point: string
  disp: string
  err: string
}

interface RepeatRow {
  disp: string
  err: string
}

interface LinSubRow {
  load: string
  disp: string
  diff: string
}

interface LinTestWeightGroup {
  inc0: LinSubRow
  incMax: LinSubRow
  dec0: LinSubRow
  decMax: LinSubRow
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
  linWeightA: LinTestWeightGroup
  linWeightB: LinTestWeightGroup
  linWeightC: LinTestWeightGroup
  linMaxDiff: string
}

const DEFAULT_LIN_SUBROW = (loadDefault: string = ''): LinSubRow => ({
  load: loadDefault,
  disp: '',
  diff: ''
})

const DEFAULT_LIN_GROUP = (): LinTestWeightGroup => ({
  inc0: DEFAULT_LIN_SUBROW(''),
  incMax: DEFAULT_LIN_SUBROW(''),
  dec0: DEFAULT_LIN_SUBROW('0'),
  decMax: DEFAULT_LIN_SUBROW('Max')
})

const DEFAULT_QC_DATA: QCRecord[] = [
  {
    id: '1000',
    model: 'AE-1000',
    srNo: 'ACI-10045',
    capacity: '1Kg',
    swVer: 'V1.2',
    readability: '0.1g',
    interval: '1g',
    calWt: '500g Std.',
    issueDate: '2026-06-10',
    testedBy: 'Sunita Rane',
    designation: 'QC Engineer',
    remarks: 'Instrument tested and found within tolerance.',
    status: 'submitted',
    eccPoints: [
      { point: 'A', disp: '1000.0g', err: '0.0g' },
      { point: 'B', disp: '1000.1g', err: '+0.1g' },
      { point: 'C', disp: '999.9g', err: '-0.1g' },
      { point: 'D', disp: '1000.0g', err: '0.0g' },
      { point: 'E', disp: '1000.1g', err: '+0.1g' }
    ],
    creepReadings: ['0.0g', '500.0g', '1000.0g', '500.0g', '0.0g'],
    creepDiff: '0.0g',
    repeatLoad: '500g',
    repeatTol: '±0.3g',
    repeatRows: [
      { disp: '500.0g', err: '0.0g' },
      { disp: '500.1g', err: '+0.1g' },
      { disp: '499.9g', err: '-0.1g' },
      { disp: '500.0g', err: '0.0g' },
      { disp: '500.1g', err: '+0.1g' },
      { disp: '500.0g', err: '0.0g' },
      { disp: '499.9g', err: '-0.1g' },
      { disp: '500.0g', err: '0.0g' },
      { disp: '500.1g', err: '+0.1g' },
      { disp: '500.0g', err: '0.0g' }
    ],
    repeatMaxDiff: '0.2g',
    repeatSD: '0.07',
    linWeightA: {
      inc0: { load: '0', disp: '0.0g', diff: '0.0g' },
      incMax: { load: '1000g', disp: '1000.1g', diff: '+0.1g' },
      dec0: { load: '0', disp: '0.0g', diff: '0.0g' },
      decMax: { load: 'Max', disp: '999.9g', diff: '-0.1g' }
    },
    linWeightB: {
      inc0: { load: '0', disp: '0.0g', diff: '0.0g' },
      incMax: { load: '1000g', disp: '1000.0g', diff: '0.0g' },
      dec0: { load: '0', disp: '0.1g', diff: '+0.1g' },
      decMax: { load: 'Max', disp: '999.9g', diff: '-0.1g' }
    },
    linWeightC: {
      inc0: { load: '0', disp: '0.1g', diff: '+0.1g' },
      incMax: { load: '1000g', disp: '1000.0g', diff: '0.0g' },
      dec0: { load: '0', disp: '0.0g', diff: '0.0g' },
      decMax: { load: 'Max', disp: '1000.0g', diff: '0.0g' }
    },
    linMaxDiff: '0.1g'
  },
  {
    id: '1001',
    model: 'AE-2000',
    srNo: 'ACI-2026-901',
    capacity: '2Kg',
    swVer: 'V1.4',
    readability: '0.01g',
    interval: '0.1g',
    calWt: '1000g Std.',
    issueDate: '2026-08-05',
    testedBy: 'Ramesh Patil',
    designation: 'Senior QC Inspector',
    remarks: 'Instrument tested and found within MPE linearity & repeatability limits.',
    status: 'submitted',
    eccPoints: [
      { point: 'A', disp: '1000.00g', err: '0.00g' },
      { point: 'B', disp: '1000.01g', err: '+0.01g' },
      { point: 'C', disp: '999.99g', err: '-0.01g' },
      { point: 'D', disp: '1000.00g', err: '0.00g' },
      { point: 'E', disp: '1000.01g', err: '+0.01g' }
    ],
    creepReadings: ['0.00g', '500.00g', '1000.01g', '500.00g', '0.00g'],
    creepDiff: '0.01g',
    repeatLoad: '500g',
    repeatTol: '±0.05g',
    repeatRows: [
      { disp: '500.00g', err: '0.00g' },
      { disp: '500.01g', err: '+0.01g' },
      { disp: '500.00g', err: '0.00g' },
      { disp: '499.99g', err: '-0.01g' },
      { disp: '500.00g', err: '0.00g' },
      { disp: '500.00g', err: '0.00g' },
      { disp: '500.01g', err: '+0.01g' },
      { disp: '500.00g', err: '0.00g' },
      { disp: '499.99g', err: '-0.01g' },
      { disp: '500.00g', err: '0.00g' }
    ],
    repeatMaxDiff: '0.02g',
    repeatSD: '0.007',
    linWeightA: {
      inc0: { load: '0', disp: '0.00g', diff: '0.00g' },
      incMax: { load: '1000g', disp: '1000.01g', diff: '+0.01g' },
      dec0: { load: '0', disp: '0.00g', diff: '0.00g' },
      decMax: { load: 'Max', disp: '999.99g', diff: '-0.01g' }
    },
    linWeightB: {
      inc0: { load: '0', disp: '0.00g', diff: '0.00g' },
      incMax: { load: '1000g', disp: '1000.00g', diff: '0.00g' },
      dec0: { load: '0', disp: '0.01g', diff: '+0.01g' },
      decMax: { load: 'Max', disp: '999.99g', diff: '-0.01g' }
    },
    linWeightC: {
      inc0: { load: '0', disp: '0.01g', diff: '+0.01g' },
      incMax: { load: '1000g', disp: '1000.00g', diff: '0.00g' },
      dec0: { load: '0', disp: '0.00g', diff: '0.00g' },
      decMax: { load: 'Max', disp: '1000.00g', diff: '0.00g' }
    },
    linMaxDiff: '0.01g'
  }
]

/* Printable PDF Generator matching screenshot 1:1 */
function printQCReport(c: QCRecord) {
  if (!c) return

  const eccRows = (c.eccPoints || [])
    .map(
      (p, i) => `
      <tr>
        <td style="text-align:center">${i + 1}.</td>
        <td style="text-align:center">${p.point || ''}</td>
        <td style="text-align:center">${p.disp || ''}</td>
        <td style="text-align:center">${p.err || ''}</td>
      </tr>`
    )
    .join('')

  const creepLabels = [
    '0 (Zero)',
    'Half Load (50%)',
    'Full Load (100%)',
    'Half Load (50%)',
    '0 (Zero)'
  ]
  const creepRows = creepLabels
    .map(
      (lbl, i) => `
      <tr>
        <td style="text-align:center">${i + 1}.</td>
        <td style="text-align:center">${lbl}</td>
        <td style="text-align:center">${c.creepReadings ? c.creepReadings[i] || '' : ''}</td>
      </tr>`
    )
    .join('')

  const repeatRowsHtml = (c.repeatRows || [])
    .slice(0, 10)
    .map(
      (r, i) => `
      <tr>
        <td style="text-align:center">${i + 1}.</td>
        <td style="text-align:center">${r.disp || ''}</td>
        <td style="text-align:center">${r.err || ''}</td>
      </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Q.C. TEST REPORT - ${c.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#fff;padding:12px;font-size:10px}
    .page-box{border:1.5px solid #1e3a8a;border-radius:4px;padding:12px;max-width:900px;margin:0 auto}
    .hdr-table{width:100%;border-collapse:collapse;margin-bottom:6px;border-bottom:2px solid #1e3a8a}
    .hdr-table td{vertical-align:middle;padding-bottom:6px}
    .company-title{font-size:16px;font-weight:900;color:#1e3a8a;letter-spacing:1px;text-align:center}
    .company-addr{font-size:8.5px;color:#333;text-align:center;margin-top:2px}
    .contact-row{display:flex;justify-content:center;gap:12px;font-size:8px;color:#444;margin-top:2px}
    .report-no-tag{text-align:right;font-size:9.5px;font-weight:800;color:#64748b}
    
    .title-banner{text-align:center;font-size:14px;font-weight:900;color:#475569;margin:8px 0 10px;text-decoration:underline;letter-spacing:1.5px}

    .info-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:6px 12px;border:1px solid #94a3b8;border-radius:4px;padding:8px 10px;margin-bottom:8px;background:#f8fafc}
    .info-item{display:flex;gap:4px;font-size:9.5px;border-bottom:1px dotted #94a3b8;padding-bottom:2px}
    .info-lbl{font-weight:800;color:#1e293b;white-space:nowrap}
    .info-val{font-weight:700;color:#0f172a;flex:1}

    .note-line{font-size:8.5px;font-style:italic;color:#334155;margin-bottom:8px;font-weight:600}

    .sec-flex{display:flex;gap:8px;margin-bottom:8px}
    .sec-block{border:1px solid #1e3a8a;border-radius:4px;overflow:hidden;flex:1}
    .sec-title-bar{background:#f1f5f9;color:#1e3a8a;font-size:9.5px;font-weight:900;padding:4px 8px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between;align-items:center}
    
    table.data-tbl{width:100%;border-collapse:collapse;font-size:9px}
    table.data-tbl th{border:1px solid #94a3b8;background:#f8fafc;padding:3px 4px;font-weight:800;text-align:center;color:#1e293b}
    table.data-tbl td{border:1px solid #94a3b8;padding:3px 4px;text-align:center}

    .pan-diagram-box{border:1px solid #1e3a8a;border-radius:4px;width:240px;flex-shrink:0;padding:6px;background:#fff}
    .pan-title{font-size:9px;font-weight:900;color:#64748b;text-align:center;margin-bottom:6px}
    .pan-layout{display:flex;justify-content:space-around;align-items:center}
    .pan-shape{text-align:center}
    .pan-shape-lbl{font-size:8px;font-weight:800;color:#334155;margin-bottom:4px}
    .circle-pan{width:56px;height:56px;border:1.5px solid #1e3a8a;border-radius:50%;position:relative;margin:0 auto}
    .square-pan{width:54px;height:54px;border:1.5px solid #1e3a8a;border-radius:2px;position:relative;margin:0 auto}
    .pt-dot{position:absolute;font-weight:900;font-size:8px;color:#0f172a}

    .summary-row{background:#f8fafc;font-weight:800;font-size:9px}

    .lin-table-wrap{margin-bottom:8px}
    .lin-table-wrap table{width:100%;border-collapse:collapse;font-size:9px;border:1px solid #1e3a8a}
    .lin-table-wrap th{border:1px solid #1e3a8a;background:#f8fafc;padding:3px 4px;font-weight:800;text-align:center}
    .lin-table-wrap td{border:1px solid #1e3a8a;padding:3px 4px;text-align:center}

    .bottom-sign{margin-top:10px;border-top:1px solid #94a3b8;padding-top:8px;display:flex;justify-content:space-between;align-items:flex-end}
    .remarks-box{font-size:9px;color:#1e293b}
    .remarks-box strong{font-weight:800}
    .sign-box{text-align:left;font-size:8.5px}
    .sign-box .title{font-weight:800;color:#1e293b;margin-bottom:16px}
    .sign-line{border-bottom:1px solid #94a3b8;width:150px;margin-bottom:4px}

    @media print{ body{padding:0} .page-box{border-width:1px} }
  </style>
</head>
<body>
  <div class="page-box">
    <!-- Header -->
    <table class="hdr-table">
      <tr>
        <td style="width:70px">
          <svg width="50" height="50" viewBox="0 0 100 100" fill="none">
            <polygon points="50,10 90,85 10,85" stroke="#5b21b6" stroke-width="8" fill="none"/>
            <polygon points="50,28 75,75 25,75" fill="#5b21b6"/>
          </svg>
        </td>
        <td>
          <div class="company-title">ARCHERCHEM INSTRUMENTS</div>
          <div class="company-addr">ANMOL INDUSTRIAL ESTATE-2, GALA NO. 8 &amp; 9, DHANYA SATIVALI NAGARI, VASAI (EAST) - 401208</div>
          <div class="contact-row">
            <span>✉ sales@adra-ai.com</span>
            <span>📞 72088 36187</span>
          </div>
        </td>
        <td style="width:100px">
          <div class="report-no-tag">Report No: ${c.id || '1000'}</div>
        </td>
      </tr>
    </table>

    <div class="title-banner">Q.C. TEST REPORT</div>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-item"><span class="info-lbl">Model</span><span class="info-val">${c.model || '—'}</span></div>
      <div class="info-item"><span class="info-lbl">Sr. No.</span><span class="info-val">${c.srNo || '—'}</span></div>
      <div class="info-item"><span class="info-lbl">Date of Issue</span><span class="info-val">${c.issueDate || '—'}</span></div>
      
      <div class="info-item"><span class="info-lbl">Max. Capacity</span><span class="info-val">${c.capacity || '—'}</span></div>
      <div class="info-item"><span class="info-lbl">Software Version</span><span class="info-val">${c.swVer || '—'}</span></div>
      <div class="info-item"><span class="info-lbl">Calibrated By</span><span class="info-val">${c.testedBy || '—'}</span></div>

      <div class="info-item"><span class="info-lbl">Readability (d)</span><span class="info-val">${c.readability || '—'}</span></div>
      <div class="info-item"><span class="info-lbl">Scale of Interval (e)</span><span class="info-val">${c.interval || '—'}</span></div>
      <div class="info-item"><span class="info-lbl">Calibration Weight</span><span class="info-val">${c.calWt || '—'}</span></div>
    </div>

    <div class="note-line">The above Balance / Scale has been tested with the standard weights and the readings obtained as under.</div>

    <!-- Sec 1: Eccentricity & Pan Diagram -->
    <div class="sec-flex">
      <div class="sec-block">
        <div class="sec-title-bar">1. ECCENTRICITY TEST</div>
        <table class="data-tbl">
          <thead>
            <tr>
              <th style="width:40px">Sr. No.</th>
              <th>Test Point</th>
              <th>Displayed Weight</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            ${eccRows || '<tr><td colSpan="4">No data</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="pan-diagram-box">
        <div class="pan-title">PAN DIAGRAM</div>
        <div class="pan-layout">
          <div class="pan-shape">
            <div class="pan-shape-lbl">Round Pan</div>
            <div class="circle-pan">
              <span class="pt-dot" style="top:22px;left:23px">A</span>
              <span class="pt-dot" style="top:10px;left:38px">B</span>
              <span class="pt-dot" style="top:36px;left:38px">C</span>
              <span class="pt-dot" style="top:36px;left:10px">D</span>
              <span class="pt-dot" style="top:10px;left:10px">E</span>
            </div>
          </div>
          <div class="pan-shape">
            <div class="pan-shape-lbl">Square Pan</div>
            <div class="square-pan">
              <span class="pt-dot" style="top:20px;left:22px">A</span>
              <span class="pt-dot" style="top:4px;left:6px">B</span>
              <span class="pt-dot" style="top:4px;right:6px">C</span>
              <span class="pt-dot" style="bottom:4px;left:6px">E</span>
              <span class="pt-dot" style="bottom:4px;right:6px">D</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sec 2 & Sec 3: Creep & Repeatability -->
    <div class="sec-flex">
      <div class="sec-block">
        <div class="sec-title-bar">2. CREEP TEST</div>
        <table class="data-tbl">
          <thead>
            <tr>
              <th style="width:40px">Sr. No.</th>
              <th>Weight Applied</th>
              <th>Displayed Weight</th>
            </tr>
          </thead>
          <tbody>
            ${creepRows}
            <tr class="summary-row">
              <td colSpan="2" style="text-align:left;padding-left:8px">Difference between 50% WT</td>
              <td>${c.creepDiff || '0.0g'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sec-block">
        <div class="sec-title-bar">
          <span>3. REPEATABILITY TEST</span>
          <span style="font-size:8px">Load: ${c.repeatLoad || '500g'} | Tol ±: ${c.repeatTol || '±0.3g'}</span>
        </div>
        <table class="data-tbl">
          <thead>
            <tr>
              <th style="width:40px">Sr. No.</th>
              <th>Displayed Weight</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            ${repeatRowsHtml}
            <tr class="summary-row">
              <td colSpan="2" style="text-align:right">Max. Difference</td>
              <td>${c.repeatMaxDiff || '0.2g'}</td>
            </tr>
            <tr class="summary-row">
              <td colSpan="2" style="text-align:right">S.D. (Standard Deviation)</td>
              <td>${c.repeatSD || '0.07'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sec 4: Linearity Test -->
    <div class="sec-block lin-table-wrap">
      <div class="sec-title-bar">4. LINEARITY TEST</div>
      <table>
        <thead>
          <tr>
            <th rowspan="2">Test Point</th>
            <th colspan="2">Load (g)</th>
            <th colspan="2">Displayed Weight (g)</th>
            <th colspan="2">Difference (g)</th>
            <th rowspan="2">Max. Difference</th>
          </tr>
          <tr>
            <th>Increasing</th>
            <th>Decreasing</th>
            <th>Increasing</th>
            <th>Decreasing</th>
            <th>Increasing</th>
            <th>Decreasing</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="2" style="font-weight:800">TW (A)</td>
            <td>${c.linWeightA?.inc0?.load || '0'}</td>
            <td>${c.linWeightA?.dec0?.load || '0'}</td>
            <td>${c.linWeightA?.inc0?.disp || '0.0g'}</td>
            <td>${c.linWeightA?.dec0?.disp || '0.0g'}</td>
            <td>${c.linWeightA?.inc0?.diff || '0.0g'}</td>
            <td>${c.linWeightA?.dec0?.diff || '0.0g'}</td>
            <td>${c.linWeightA?.inc0?.diff || '0.0g'}</td>
          </tr>
          <tr>
            <td>${c.linWeightA?.incMax?.load || 'Max'}</td>
            <td>${c.linWeightA?.decMax?.load || 'Max'}</td>
            <td>${c.linWeightA?.incMax?.disp || '1000.1g'}</td>
            <td>${c.linWeightA?.decMax?.disp || '999.9g'}</td>
            <td>${c.linWeightA?.incMax?.diff || '+0.1g'}</td>
            <td>${c.linWeightA?.decMax?.diff || '-0.1g'}</td>
            <td>${c.linWeightA?.incMax?.diff || '+0.1g'}</td>
          </tr>
          <tr>
            <td rowspan="2" style="font-weight:800">TW (B)</td>
            <td>${c.linWeightB?.inc0?.load || '0'}</td>
            <td>${c.linWeightB?.dec0?.load || '0'}</td>
            <td>${c.linWeightB?.inc0?.disp || '0.0g'}</td>
            <td>${c.linWeightB?.dec0?.disp || '0.1g'}</td>
            <td>${c.linWeightB?.inc0?.diff || '0.0g'}</td>
            <td>${c.linWeightB?.dec0?.diff || '+0.1g'}</td>
            <td>${c.linWeightB?.dec0?.diff || '+0.1g'}</td>
          </tr>
          <tr>
            <td>${c.linWeightB?.incMax?.load || 'Max'}</td>
            <td>${c.linWeightB?.decMax?.load || 'Max'}</td>
            <td>${c.linWeightB?.incMax?.disp || '1000.0g'}</td>
            <td>${c.linWeightB?.decMax?.disp || '999.9g'}</td>
            <td>${c.linWeightB?.incMax?.diff || '0.0g'}</td>
            <td>${c.linWeightB?.decMax?.diff || '-0.1g'}</td>
            <td>${c.linWeightB?.decMax?.diff || '-0.1g'}</td>
          </tr>
          <tr>
            <td rowspan="2" style="font-weight:800">TW (C)</td>
            <td>${c.linWeightC?.inc0?.load || '0'}</td>
            <td>${c.linWeightC?.dec0?.load || '0'}</td>
            <td>${c.linWeightC?.inc0?.disp || '0.1g'}</td>
            <td>${c.linWeightC?.dec0?.disp || '0.0g'}</td>
            <td>${c.linWeightC?.inc0?.diff || '+0.1g'}</td>
            <td>${c.linWeightC?.dec0?.diff || '0.0g'}</td>
            <td>${c.linWeightC?.inc0?.diff || '+0.1g'}</td>
          </tr>
          <tr>
            <td>${c.linWeightC?.incMax?.load || 'Max'}</td>
            <td>${c.linWeightC?.decMax?.load || 'Max'}</td>
            <td>${c.linWeightC?.incMax?.disp || '1000.0g'}</td>
            <td>${c.linWeightC?.decMax?.disp || '1000.0g'}</td>
            <td>${c.linWeightC?.incMax?.diff || '0.0g'}</td>
            <td>${c.linWeightC?.decMax?.diff || '0.0g'}</td>
            <td>${c.linWeightC?.incMax?.diff || '0.0g'}</td>
          </tr>
          <tr class="summary-row">
            <td colspan="7" style="text-align:right">Max. Difference</td>
            <td>${c.linMaxDiff || '0.1g'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bottom Signatures -->
    <div class="bottom-sign">
      <div class="remarks-box">
        <div><strong>Remarks:</strong></div>
        <div>${c.remarks || 'Instrument tested and found within tolerance.'}</div>
      </div>
      <div class="sign-box">
        <div class="title">Tested By (Authorized Signatory)</div>
        <div class="sign-line"></div>
        <div><strong>Name:</strong> ${c.testedBy || 'Sunita Rane'}</div>
        <div><strong>Designation:</strong> ${c.designation || 'QC Engineer'}</div>
      </div>
    </div>
  </div>
  <script>window.onload=function(){window.print()}</script>
</body>
</html>`

  const printWin = window.open('', '_blank')
  if (printWin) {
    printWin.document.write(html)
    printWin.document.close()
  } else {
    toast.error('Could not open print window. Please allow popups.')
  }
}

const QCPage: FC = () => {
  const [qcList, setQcList] = useState<QCRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [viewState, setViewState] = useState<'list' | 'form' | 'detail'>('list')
  const [activeQcId, setActiveQcId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form State matching exact uploaded screenshots
  const [formData, setFormData] = useState<Partial<QCRecord>>({
    id: '1000',
    model: '',
    srNo: '',
    capacity: '',
    swVer: '',
    readability: '',
    interval: '',
    calWt: '',
    issueDate: new Date().toISOString().split('T')[0],
    testedBy: '',
    designation: 'QC Engineer',
    remarks: '',
    status: 'draft',
    eccPoints: [
      { point: 'A', disp: '', err: '' },
      { point: 'B', disp: '', err: '' },
      { point: 'C', disp: '', err: '' },
      { point: 'D', disp: '', err: '' },
      { point: 'E', disp: '', err: '' }
    ],
    creepReadings: ['', '', '', '', ''],
    creepDiff: '',
    repeatLoad: '',
    repeatTol: '',
    repeatRows: Array(10).fill(null).map(() => ({ disp: '', err: '' })),
    repeatMaxDiff: '',
    repeatSD: '',
    linWeightA: DEFAULT_LIN_GROUP(),
    linWeightB: DEFAULT_LIN_GROUP(),
    linWeightC: DEFAULT_LIN_GROUP(),
    linMaxDiff: ''
  })

  useEffect(() => {
    fetchQcReports()
  }, [])

  const fetchQcReports = async () => {
    setLoading(true)
    try {
      const res = await getQcReports()
      if (res.data && res.data.success && Array.isArray(res.data.reports)) {
        if (res.data.reports.length > 0) {
          setQcList(res.data.reports)
        } else {
          // If fresh tenant database has 0 reports, seed default reports to API backend
          await seedDefaultQcReports()
        }
      } else {
        setQcList(DEFAULT_QC_DATA)
      }
    } catch (e) {
      console.warn('API fetch QC reports failed:', e)
      setQcList(DEFAULT_QC_DATA)
    } finally {
      setLoading(false)
    }
  }

  const seedDefaultQcReports = async () => {
    setQcList(DEFAULT_QC_DATA)
    try {
      for (const r of DEFAULT_QC_DATA) {
        await createQcReport(r)
      }
      // Re-fetch clean list from API backend
      const res = await getQcReports()
      if (res.data && res.data.success && Array.isArray(res.data.reports) && res.data.reports.length > 0) {
        setQcList(res.data.reports)
      }
    } catch (e) {
      console.warn('Seeding QC records to API failed:', e)
    }
  }

  const handleInitNewForm = () => {
    const nextId = String(1000 + qcList.length)
    setFormData({
      id: nextId,
      model: '',
      srNo: '',
      capacity: '',
      swVer: '',
      readability: '',
      interval: '',
      calWt: '',
      issueDate: new Date().toISOString().split('T')[0],
      testedBy: '',
      designation: 'QC Engineer',
      remarks: '',
      status: 'draft',
      eccPoints: [
        { point: 'A', disp: '', err: '' },
        { point: 'B', disp: '', err: '' },
        { point: 'C', disp: '', err: '' },
        { point: 'D', disp: '', err: '' },
        { point: 'E', disp: '', err: '' }
      ],
      creepReadings: ['', '', '', '', ''],
      creepDiff: '',
      repeatLoad: '',
      repeatTol: '',
      repeatRows: Array(10).fill(null).map(() => ({ disp: '', err: '' })),
      repeatMaxDiff: '',
      repeatSD: '',
      linWeightA: DEFAULT_LIN_GROUP(),
      linWeightB: DEFAULT_LIN_GROUP(),
      linWeightC: DEFAULT_LIN_GROUP(),
      linMaxDiff: ''
    })
    setActiveQcId(null)
    setViewState('form')
  }

  const handleEdit = (r: QCRecord) => {
    setFormData({ ...r })
    setActiveQcId(r.id)
    setViewState('form')
  }

  const handleDelete = async (r: QCRecord) => {
    if (!window.confirm(`Delete QC Report ${r.id}?`)) return
    try {
      await deleteQcReport(r.id)
      toast.success(`Deleted QC Report ${r.id}`)
    } catch (e) {
      console.warn('API delete failed:', e)
    }
    await fetchQcReports()
    if (viewState === 'detail') setViewState('list')
  }

  // Handlers for dynamic input changes inside Form UI
  const handleEccChange = (index: number, field: 'disp' | 'err', val: string) => {
    const updated = [...(formData.eccPoints || [])]
    updated[index] = { ...updated[index], [field]: val }
    setFormData({ ...formData, eccPoints: updated })
  }

  const handleCreepReadingChange = (index: number, val: string) => {
    const updated = [...(formData.creepReadings || ['', '', '', '', ''])]
    updated[index] = val
    setFormData({ ...formData, creepReadings: updated })
  }

  const handleRepeatRowChange = (index: number, field: 'disp' | 'err', val: string) => {
    const updated = [...(formData.repeatRows || [])]
    updated[index] = { ...updated[index], [field]: val }

    // Auto calculate standard deviation and max diff if disp values entered
    const dispValues = updated
      .map((r) => parseFloat(r.disp))
      .filter((v) => !isNaN(v))

    let maxDiffStr = formData.repeatMaxDiff || ''
    let sdStr = formData.repeatSD || ''

    if (dispValues.length > 0) {
      const max = Math.max(...dispValues)
      const min = Math.min(...dispValues)
      maxDiffStr = (max - min).toFixed(2)

      if (dispValues.length > 1) {
        const mean = dispValues.reduce((a, b) => a + b, 0) / dispValues.length
        const sumSq = dispValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0)
        sdStr = Math.sqrt(sumSq / (dispValues.length - 1)).toFixed(2)
      }
    }

    setFormData({
      ...formData,
      repeatRows: updated,
      repeatMaxDiff: maxDiffStr,
      repeatSD: sdStr
    })
  }

  const handleLinGroupChange = (
    groupKey: 'linWeightA' | 'linWeightB' | 'linWeightC',
    subRowKey: 'inc0' | 'incMax' | 'dec0' | 'decMax',
    field: 'load' | 'disp' | 'diff',
    val: string
  ) => {
    const group = { ...(formData[groupKey] || DEFAULT_LIN_GROUP()) }
    group[subRowKey] = { ...group[subRowKey], [field]: val }
    setFormData({ ...formData, [groupKey]: group })
  }

  const handleSaveDraft = async () => {
    const reportId = formData.id || String(1000 + qcList.length)
    const rec: QCRecord = {
      ...(formData as QCRecord),
      id: reportId,
      status: 'draft'
    }

    try {
      const existing = qcList.find((x) => x.id === reportId)
      if (existing) {
        await updateQcReport(reportId, rec)
      } else {
        await createQcReport(rec)
      }
    } catch (e) {
      console.warn('API sync draft failed:', e)
    }

    await fetchQcReports()
    toast.success(`💾 QC Report Draft saved: ${rec.id}`)
    setViewState('list')
  }

  const handleSubmitReport = async () => {
    if (!formData.model || !formData.srNo) {
      toast.error('MODEL and SR. NO. are required!')
      return
    }

    const reportId = formData.id || String(1000 + qcList.length)
    const rec: QCRecord = {
      ...(formData as QCRecord),
      id: reportId,
      status: 'submitted'
    }

    try {
      const existing = qcList.find((x) => x.id === reportId)
      if (existing) {
        await updateQcReport(reportId, rec)
      } else {
        await createQcReport(rec)
      }
    } catch (e) {
      console.warn('API submit failed:', e)
    }

    await fetchQcReports()
    toast.success(`✅ QC Test Report ${rec.id} submitted!`)
    setViewState('list')
  }

  const filteredQCs = qcList.filter(
    (q) =>
      (q.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.srNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.testedBy || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedQC = qcList.find((q) => q.id === activeQcId)

  return (
    <>
      <PageTitle breadcrumbs={[]}>QC Test Reports</PageTitle>
      <Content>
        {/* ══════════════════════════════════
             QC REPORTS — LIST DIRECTORY
        ══════════════════════════════════ */}
        {viewState === 'list' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6 d-flex justify-content-between align-items-center flex-wrap gap-4'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold text-gray-900 fs-3'>Quality Control Test Reports</span>
                <span className='text-gray-500 mt-1 fw-semibold fs-7'>
                  Eccentricity, creep drift, repeatability, and linearity compliance inspection logs
                </span>
              </h3>
              <div className='card-toolbar gap-3'>
                <div className='position-relative w-250px'>
                  <span className='position-absolute ms-3 top-50 translate-middle-y text-gray-500 fs-6'>🔍</span>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='form-control form-control-solid ps-10 py-2 fs-7'
                    placeholder='Search Report No, Model, S/N...'
                  />
                </div>
                <button onClick={handleInitNewForm} className='btn btn-primary btn-sm fw-bold'>
                  <i className='bi bi-plus-lg me-1'></i> + New QC Report
                </button>
              </div>
            </div>

            <div className='card-body pt-2'>
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8 border-bottom border-gray-300'>
                      <th>Report No</th>
                      <th>Model / Machine</th>
                      <th>Serial No (S/N)</th>
                      <th>Date of Issue</th>
                      <th>Tested By</th>
                      <th className='text-end'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && qcList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className='text-center text-gray-500 py-8'>
                          Loading QC test reports...
                        </td>
                      </tr>
                    ) : filteredQCs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className='text-center text-gray-500 py-8'>
                          No QC test reports recorded.
                        </td>
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
                              className='text-gray-900 fw-bolder text-hover-primary cursor-pointer fs-6 d-block'
                            >
                              Report No: {q.id}
                            </span>
                          </td>
                          <td>
                            <span className='text-gray-900 fw-bold fs-7'>{q.model}</span>
                            <span className='text-muted fs-8 d-block'>Cap: {q.capacity}</span>
                          </td>
                          <td>
                            <span className='text-gray-800 fw-semibold fs-7'>{q.srNo}</span>
                          </td>
                          <td>
                            <span className='text-gray-600 fs-7'>{q.issueDate}</span>
                          </td>
                          <td>
                            <span className='text-gray-800 fw-semibold fs-7'>{q.testedBy}</span>
                            <span className='text-muted fs-8 d-block'>{q.designation}</span>
                          </td>
                          <td className='text-end'>
                            <div className='d-flex justify-content-end gap-2'>
                              <button
                                onClick={() => printQCReport(q)}
                                className='btn btn-icon btn-light-info btn-sm'
                                title='Print PDF Report'
                              >
                                <i className='bi bi-printer fs-5'></i>
                              </button>
                              <button
                                onClick={() => handleEdit(q)}
                                className='btn btn-icon btn-light-primary btn-sm'
                                title='Edit Report'
                              >
                                <i className='bi bi-pencil fs-5'></i>
                              </button>
                              <button
                                onClick={() => handleDelete(q)}
                                className='btn btn-icon btn-light-danger btn-sm'
                                title='Delete Report'
                              >
                                <i className='bi bi-trash fs-5'></i>
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

        {/* ══════════════════════════════════
             QC REPORT — FORM (FULL PAGE METRONIC WIDTH)
        ══════════════════════════════════ */}
        {viewState === 'form' && (
          <div className='d-flex flex-column gap-5'>
            {/* Header Banner - Full Page Width */}
            <div
              className='card border-0 shadow-sm overflow-hidden'
              style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '12px' }}
            >
              <div className='card-body p-6 text-white d-flex align-items-center justify-content-between flex-wrap gap-4'>
                <div className='d-flex align-items-center gap-4'>
                  <div className='fw-bolder fs-2 px-4 py-2 bg-white bg-opacity-20 rounded text-white' style={{ letterSpacing: '1px' }}>
                    A·C·I
                  </div>
                  <div>
                    <h2 className='text-white fw-bolder mb-1 fs-2'>Archerchem Instruments</h2>
                    <p className='text-white text-opacity-75 fs-7 m-0 fw-semibold'>
                      211, L.N. Estate, Mulund Link Road, Malad (W), Mumbai · Q.C. TEST REPORT FORM
                    </p>
                  </div>
                </div>
                <div className='d-flex gap-3'>
                  <button type='button' onClick={() => setViewState('list')} className='btn btn-light-secondary text-gray-800 fw-bold px-4 py-2'>
                    ← Back to List
                  </button>
                </div>
              </div>
            </div>

            {/* Main Form Card - Full Width Metronic Standard */}
            <div className='card border-0 shadow-sm'>
              <div className='card-body p-6 p-lg-8'>
                {/* 📋 Instrument Details */}
                <div className='border rounded p-6 mb-6 bg-light bg-opacity-40'>
                  <h4 className='fw-bolder text-primary fs-4 mb-5 d-flex align-items-center gap-2'>
                    📋 Instrument Details
                  </h4>
                  <div className='row g-4 mb-4'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700 required'>MODEL *</label>
                      <input
                        type='text'
                        value={formData.model || ''}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. AE-1000'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700 required'>SR. NO. *</label>
                      <input
                        type='text'
                        value={formData.srNo || ''}
                        onChange={(e) => setFormData({ ...formData, srNo: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='Serial Number'
                      />
                    </div>
                  </div>

                  <div className='row g-4 mb-4'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>MAX. CAPACITY</label>
                      <input
                        type='text'
                        value={formData.capacity || ''}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. 30Kg'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>SOFTWARE VERSION</label>
                      <input
                        type='text'
                        value={formData.swVer || ''}
                        onChange={(e) => setFormData({ ...formData, swVer: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. V1.2'
                      />
                    </div>
                  </div>

                  <div className='row g-4 mb-4'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>READABILITY (D)</label>
                      <input
                        type='text'
                        value={formData.readability || ''}
                        onChange={(e) => setFormData({ ...formData, readability: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. 0.1g'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>CALIBRATED BY</label>
                      <input
                        type='text'
                        value={formData.testedBy || ''}
                        onChange={(e) => setFormData({ ...formData, testedBy: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='Name'
                      />
                    </div>
                  </div>

                  <div className='row g-4 mb-4'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>SCALE OF INTERVAL (E)</label>
                      <input
                        type='text'
                        value={formData.interval || ''}
                        onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. 1g'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>CALIBRATION WEIGHT</label>
                      <input
                        type='text'
                        value={formData.calWt || ''}
                        onChange={(e) => setFormData({ ...formData, calWt: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. 20Kg Std.'
                      />
                    </div>
                  </div>

                  <div className='row g-4'>
                    <div className='col-md-12'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>DATE OF ISSUE</label>
                      <input
                        type='date'
                        value={formData.issueDate || ''}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        className='form-control form-control-solid fs-7'
                      />
                    </div>
                  </div>
                </div>

                {/* 1️⃣ Eccentricity Test */}
                <div className='border rounded p-6 mb-6 bg-light bg-opacity-40'>
                  <h4 className='fw-bolder text-primary fs-4 mb-4'>1️⃣ Eccentricity Test</h4>
                  <div className='table-responsive'>
                    <table className='table table-bordered border-gray-300 align-middle gs-4 gy-3 fs-7 mb-2'>
                      <thead className='bg-light-primary text-primary fw-bolder'>
                        <tr>
                          <th style={{ width: '60px' }}>Sr.</th>
                          <th style={{ width: '80px' }}>Point</th>
                          <th>Displayed Wt.</th>
                          <th>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.eccPoints || []).map((pt, idx) => (
                          <tr key={idx}>
                            <td className='fw-bold text-center'>{idx + 1}</td>
                            <td className='fw-bold text-center'>{pt.point}</td>
                            <td>
                              <input
                                type='text'
                                value={pt.disp}
                                onChange={(e) => handleEccChange(idx, 'disp', e.target.value)}
                                className='form-control form-control-solid fs-7'
                              />
                            </td>
                            <td>
                              <input
                                type='text'
                                value={pt.err}
                                onChange={(e) => handleEccChange(idx, 'err', e.target.value)}
                                className='form-control form-control-solid fs-7'
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className='text-gray-500 fs-8 italic mt-1'>
                    Pan Points: B,C (back) · A (center) · E,D (front) — Round or Square Pan
                  </div>
                </div>

                {/* 2️⃣ Creep Test */}
                <div className='border rounded p-6 mb-6 bg-light bg-opacity-40'>
                  <h4 className='fw-bolder text-primary fs-4 mb-4'>2️⃣ Creep Test</h4>
                  <div className='table-responsive'>
                    <table className='table table-bordered border-gray-300 align-middle gs-4 gy-3 fs-7 mb-0'>
                      <thead className='bg-light-primary text-primary fw-bolder'>
                        <tr>
                          <th style={{ width: '60px' }}>Sr.</th>
                          <th>Weight Applied</th>
                          <th>Displayed Wt.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          '0 (Zero)',
                          'Half Load (50%)',
                          'Full Load (100%)',
                          'Half Load (50%)',
                          '0 (Zero)'
                        ].map((lbl, idx) => (
                          <tr key={idx}>
                            <td className='fw-bold text-center'>{idx + 1}</td>
                            <td className='fw-semibold'>{lbl}</td>
                            <td>
                              <input
                                type='text'
                                value={(formData.creepReadings || [])[idx] || ''}
                                onChange={(e) => handleCreepReadingChange(idx, e.target.value)}
                                className='form-control form-control-solid fs-7'
                              />
                            </td>
                          </tr>
                        ))}
                        <tr className='bg-light fw-bold'>
                          <td colSpan={2} className='text-end pe-4'>Difference between 50% WT</td>
                          <td>
                            <input
                              type='text'
                              value={formData.creepDiff || ''}
                              onChange={(e) => setFormData({ ...formData, creepDiff: e.target.value })}
                              className='form-control form-control-solid fs-7'
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3️⃣ Repeatability Test */}
                <div className='border rounded p-6 mb-6 bg-light bg-opacity-40'>
                  <h4 className='fw-bolder text-primary fs-4 mb-4'>3️⃣ Repeatability Test</h4>
                  <div className='row g-4 mb-4'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>LOAD APPLIED</label>
                      <input
                        type='text'
                        value={formData.repeatLoad || ''}
                        onChange={(e) => setFormData({ ...formData, repeatLoad: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. 10Kg'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>TOLERANCE ±</label>
                      <input
                        type='text'
                        value={formData.repeatTol || ''}
                        onChange={(e) => setFormData({ ...formData, repeatTol: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. 0.5g'
                      />
                    </div>
                  </div>

                  <div className='table-responsive'>
                    <table className='table table-bordered border-gray-300 align-middle gs-4 gy-3 fs-7 mb-0'>
                      <thead className='bg-light-primary text-primary fw-bolder'>
                        <tr>
                          <th style={{ width: '60px' }}>Sr.</th>
                          <th>Displayed Wt.</th>
                          <th>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.repeatRows || []).slice(0, 10).map((r, idx) => (
                          <tr key={idx}>
                            <td className='fw-bold text-center'>{idx + 1}.</td>
                            <td>
                              <input
                                type='text'
                                value={r.disp}
                                onChange={(e) => handleRepeatRowChange(idx, 'disp', e.target.value)}
                                className='form-control form-control-solid fs-7'
                              />
                            </td>
                            <td>
                              <input
                                type='text'
                                value={r.err}
                                onChange={(e) => handleRepeatRowChange(idx, 'err', e.target.value)}
                                className='form-control form-control-solid fs-7'
                              />
                            </td>
                          </tr>
                        ))}
                        <tr className='bg-light fw-bold'>
                          <td colSpan={2} className='text-end pe-4'>Max. Difference</td>
                          <td>
                            <input
                              type='text'
                              value={formData.repeatMaxDiff || ''}
                              onChange={(e) => setFormData({ ...formData, repeatMaxDiff: e.target.value })}
                              className='form-control form-control-solid fs-7'
                            />
                          </td>
                        </tr>
                        <tr className='bg-light fw-bold'>
                          <td colSpan={2} className='text-end pe-4'>S.D. (Standard Deviation)</td>
                          <td>
                            <input
                              type='text'
                              value={formData.repeatSD || ''}
                              onChange={(e) => setFormData({ ...formData, repeatSD: e.target.value })}
                              className='form-control form-control-solid fs-7'
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4️⃣ Linearity Test */}
                <div className='border rounded p-6 mb-6 bg-light bg-opacity-40'>
                  <h4 className='fw-bolder text-primary fs-4 mb-1'>4️⃣ Linearity Test</h4>
                  <p className='text-muted fs-7 mb-5'>
                    For each Test Weight (A/B/C), fill Load, Displayed Wt. and Difference — Increasing &amp; Decreasing
                  </p>

                  {/* Test Weight A */}
                  <div className='border rounded p-5 mb-5 bg-white'>
                    <h5 className='fw-bolder text-primary fs-5 mb-4'>
                      Test Weight (A)
                    </h5>
                    <div className='row g-3 text-muted fw-bold fs-8 text-uppercase mb-2 text-center'>
                      <div className='col-3'></div>
                      <div className='col-3'>LOAD (G)</div>
                      <div className='col-3'>DISPLAYED WT. (G)</div>
                      <div className='col-3'>DIFFERENCE (G)</div>
                    </div>

                    <div className='d-flex flex-column gap-3'>
                      {/* Inc 0 */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Inc 0</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.inc0?.load || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'inc0', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.inc0?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'inc0', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.inc0?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'inc0', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Inc Max */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Inc Max</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.incMax?.load || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'incMax', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.incMax?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'incMax', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.incMax?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'incMax', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Dec 0 */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Dec 0</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.dec0?.load || '0'}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'dec0', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.dec0?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'dec0', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.dec0?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'dec0', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Dec Max */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Dec Max</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.decMax?.load || 'Max'}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'decMax', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.decMax?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'decMax', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightA?.decMax?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightA', 'decMax', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Weight B */}
                  <div className='border rounded p-5 mb-5 bg-white'>
                    <h5 className='fw-bolder text-primary fs-5 mb-4'>
                      Test Weight (B)
                    </h5>
                    <div className='row g-3 text-muted fw-bold fs-8 text-uppercase mb-2 text-center'>
                      <div className='col-3'></div>
                      <div className='col-3'>LOAD (G)</div>
                      <div className='col-3'>DISPLAYED WT. (G)</div>
                      <div className='col-3'>DIFFERENCE (G)</div>
                    </div>

                    <div className='d-flex flex-column gap-3'>
                      {/* Inc 0 */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Inc 0</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.inc0?.load || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'inc0', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.inc0?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'inc0', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.inc0?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'inc0', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Inc Max */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Inc Max</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.incMax?.load || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'incMax', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.incMax?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'incMax', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.incMax?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'incMax', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Dec 0 */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Dec 0</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.dec0?.load || '0'}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'dec0', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.dec0?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'dec0', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.dec0?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'dec0', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Dec Max */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Dec Max</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.decMax?.load || 'Max'}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'decMax', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.decMax?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'decMax', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightB?.decMax?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightB', 'decMax', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Weight C */}
                  <div className='border rounded p-5 mb-5 bg-white'>
                    <h5 className='fw-bolder text-primary fs-5 mb-4'>
                      Test Weight (C)
                    </h5>
                    <div className='row g-3 text-muted fw-bold fs-8 text-uppercase mb-2 text-center'>
                      <div className='col-3'></div>
                      <div className='col-3'>LOAD (G)</div>
                      <div className='col-3'>DISPLAYED WT. (G)</div>
                      <div className='col-3'>DIFFERENCE (G)</div>
                    </div>

                    <div className='d-flex flex-column gap-3'>
                      {/* Inc 0 */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Inc 0</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.inc0?.load || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'inc0', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.inc0?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'inc0', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.inc0?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'inc0', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Inc Max */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Inc Max</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.incMax?.load || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'incMax', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.incMax?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'incMax', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.incMax?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'incMax', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Dec 0 */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Dec 0</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.dec0?.load || '0'}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'dec0', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.dec0?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'dec0', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.dec0?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'dec0', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>

                      {/* Dec Max */}
                      <div className='row g-3 align-items-center fs-7'>
                        <div className='col-3 fw-bold text-gray-800'>Dec Max</div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.decMax?.load || 'Max'}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'decMax', 'load', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.decMax?.disp || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'decMax', 'disp', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                        <div className='col-3'>
                          <input
                            type='text'
                            value={formData.linWeightC?.decMax?.diff || ''}
                            onChange={(e) => handleLinGroupChange('linWeightC', 'decMax', 'diff', e.target.value)}
                            className='form-control form-control-solid fs-7'
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Max Difference Linearity */}
                  <div>
                    <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>
                      MAX. DIFFERENCE (LINEARITY)
                    </label>
                    <input
                      type='text'
                      value={formData.linMaxDiff || ''}
                      onChange={(e) => setFormData({ ...formData, linMaxDiff: e.target.value })}
                      className='form-control form-control-solid fs-7'
                      placeholder='Overall max difference'
                    />
                  </div>
                </div>

                {/* 📝 Remarks & Sign-off */}
                <div className='border rounded p-6 mb-6 bg-light bg-opacity-40'>
                  <h4 className='fw-bolder text-primary fs-4 mb-4'>📝 Remarks &amp; Sign-off</h4>
                  <div className='mb-4'>
                    <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>REMARKS</label>
                    <textarea
                      value={formData.remarks || ''}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className='form-control form-control-solid fs-7'
                      rows={3}
                      placeholder='Any remarks...'
                    />
                  </div>
                  <div className='row g-4'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700 required'>
                        TESTED BY (NAME) *
                      </label>
                      <input
                        type='text'
                        value={formData.testedBy || ''}
                        onChange={(e) => setFormData({ ...formData, testedBy: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='Authorized Signatory'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-gray-700'>DESIGNATION</label>
                      <input
                        type='text'
                        value={formData.designation || ''}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className='form-control form-control-solid fs-7'
                        placeholder='e.g. QC Engineer'
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons matching standard Metronic Theme */}
                <div className='d-flex flex-wrap align-items-center justify-content-between gap-4 pt-4 border-top'>
                  <div className='d-flex gap-3'>
                    <button
                      type='button'
                      onClick={handleSaveDraft}
                      className='btn btn-light-primary fw-bold px-6 py-3 fs-6'
                    >
                      💾 Save Draft
                    </button>
                    <button
                      type='button'
                      onClick={handleSubmitReport}
                      className='btn btn-primary fw-bold px-6 py-3 fs-6'
                    >
                      ✅ Submit Report
                    </button>
                  </div>
                  <button
                    type='button'
                    onClick={() => printQCReport(formData as QCRecord)}
                    className='btn btn-outline btn-outline-primary fw-bold px-6 py-3 fs-6'
                  >
                    🖨️ Print / Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
             QC REPORT — DETAIL VIEW
        ══════════════════════════════════ */}
        {viewState === 'detail' && selectedQC && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6 d-flex justify-content-between align-items-center'>
              <div className='d-flex align-items-center gap-3'>
                <button onClick={() => setViewState('list')} className='btn btn-icon btn-light btn-sm'>
                  <i className='bi bi-arrow-left fs-4'></i>
                </button>
                <h3 className='card-title fw-bolder text-gray-900 fs-3 m-0'>QC Report — Report No: {selectedQC.id}</h3>
              </div>
              <div className='card-toolbar gap-2'>
                <button onClick={() => printQCReport(selectedQC)} className='btn btn-primary btn-sm fw-bold me-2'>
                  🖨️ Print / Download PDF
                </button>
                <button onClick={() => handleEdit(selectedQC)} className='btn btn-light-primary btn-sm fw-bold me-2'>
                  ✏️ Edit Report
                </button>
                <button onClick={() => handleDelete(selectedQC)} className='btn btn-light-danger btn-sm fw-bold me-2'>
                  🗑️ Delete
                </button>
                <button onClick={() => setViewState('list')} className='btn btn-light btn-sm fw-bold'>
                  Back to List
                </button>
              </div>
            </div>

            {/* Formatted Report Sheet Preview matching screenshot */}
            <div className='card-body pt-2 d-flex justify-content-center'>
              <div
                className='border rounded p-8 bg-white shadow-lg w-100'
                style={{
                  maxWidth: '850px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  color: '#0f172a'
                }}
              >
                {/* Header */}
                <div className='d-flex justify-content-between align-items-center border-bottom border-primary border-2 pb-3 mb-2'>
                  <div className='d-flex align-items-center gap-2'>
                    <svg width='45' height='45' viewBox='0 0 100 100' fill='none'>
                      <polygon points='50,10 90,85 10,85' stroke='#5b21b6' strokeWidth='8' fill='none' />
                      <polygon points='50,28 75,75 25,75' fill='#5b21b6' />
                    </svg>
                  </div>
                  <div className='text-center flex-grow-1 px-4'>
                    <h2 className='fw-bolder fs-3 text-primary m-0 letter-spacing-1'>ARCHERCHEM INSTRUMENTS</h2>
                    <div className='fs-9 text-dark mt-1'>
                      ANMOL INDUSTRIAL ESTATE-2, GALA NO. 8 &amp; 9, DHANYA SATIVALI NAGARI, VASAI (EAST) - 401208
                    </div>
                    <div className='d-flex justify-content-center gap-4 fs-9 text-muted mt-0.5'>
                      <span>✉ sales@adra-ai.com</span>
                      <span>📞 72088 36187</span>
                    </div>
                  </div>
                  <div className='text-end fs-8 fw-bolder text-muted'>
                    Report No: {selectedQC.id}
                  </div>
                </div>

                <div className='text-center fs-4 fw-bolder text-secondary text-uppercase text-decoration-underline mb-4 letter-spacing-2'>
                  Q.C. TEST REPORT
                </div>

                {/* 3 Column Grid with Dotted underlines */}
                <div className='row g-3 fs-8 p-3 border rounded bg-light mb-3'>
                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Model:</strong>
                    <span>{selectedQC.model}</span>
                  </div>
                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Sr. No.:</strong>
                    <span>{selectedQC.srNo}</span>
                  </div>
                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Date of Issue:</strong>
                    <span>{selectedQC.issueDate}</span>
                  </div>

                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Max. Capacity:</strong>
                    <span>{selectedQC.capacity}</span>
                  </div>
                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Software Version:</strong>
                    <span>{selectedQC.swVer}</span>
                  </div>
                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Calibrated By:</strong>
                    <span>{selectedQC.testedBy}</span>
                  </div>

                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Readability (d):</strong>
                    <span>{selectedQC.readability}</span>
                  </div>
                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Scale of Interval (e):</strong>
                    <span>{selectedQC.interval}</span>
                  </div>
                  <div className='col-4 d-flex border-bottom border-secondary border-dotted pb-1'>
                    <strong className='text-dark me-2'>Calibration Weight:</strong>
                    <span>{selectedQC.calWt}</span>
                  </div>
                </div>

                <div className='fs-9 italic text-muted mb-3 fw-semibold'>
                  The above Balance / Scale has been tested with the standard weights and the readings obtained as under.
                </div>

                {/* Sec 1: Eccentricity & Pan Diagram */}
                <div className='row g-3 mb-3'>
                  <div className='col-7'>
                    <div className='border border-primary rounded overflow-hidden h-100'>
                      <div className='bg-light-primary text-primary fw-bolder fs-8 px-3 py-1 border-bottom border-primary'>
                        1. ECCENTRICITY TEST
                      </div>
                      <table className='table table-bordered border-gray-400 gs-2 gy-1 fs-9 mb-0 align-middle text-center'>
                        <thead className='bg-light'>
                          <tr className='fw-bold'>
                            <th style={{ width: '40px' }}>Sr. No.</th>
                            <th>Test Point</th>
                            <th>Displayed Weight</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedQC.eccPoints.map((p, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}.</td>
                              <td>{p.point}</td>
                              <td>{p.disp}</td>
                              <td>{p.err}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className='col-5'>
                    <div className='border border-primary rounded p-2 h-100 bg-white text-center'>
                      <div className='fw-bolder fs-8 text-muted mb-2'>PAN DIAGRAM</div>
                      <div className='d-flex justify-content-around align-items-center pt-1'>
                        <div>
                          <div className='fs-9 fw-bold text-dark mb-1'>Round Pan</div>
                          <div
                            className='border border-primary rounded-circle position-relative mx-auto'
                            style={{ width: '56px', height: '56px' }}
                          >
                            <span className='position-absolute fw-bold fs-9' style={{ top: '22px', left: '23px' }}>A</span>
                            <span className='position-absolute fw-bold fs-9' style={{ top: '10px', left: '38px' }}>B</span>
                            <span className='position-absolute fw-bold fs-9' style={{ top: '36px', left: '38px' }}>C</span>
                            <span className='position-absolute fw-bold fs-9' style={{ top: '36px', left: '10px' }}>D</span>
                            <span className='position-absolute fw-bold fs-9' style={{ top: '10px', left: '10px' }}>E</span>
                          </div>
                        </div>
                        <div>
                          <div className='fs-9 fw-bold text-dark mb-1'>Square Pan</div>
                          <div
                            className='border border-primary rounded position-relative mx-auto'
                            style={{ width: '54px', height: '54px' }}
                          >
                            <span className='position-absolute fw-bold fs-9' style={{ top: '20px', left: '22px' }}>A</span>
                            <span className='position-absolute fw-bold fs-9' style={{ top: '4px', left: '6px' }}>B</span>
                            <span className='position-absolute fw-bold fs-9' style={{ top: '4px', right: '6px' }}>C</span>
                            <span className='position-absolute fw-bold fs-9' style={{ bottom: '4px', left: '6px' }}>E</span>
                            <span className='position-absolute fw-bold fs-9' style={{ bottom: '4px', right: '6px' }}>D</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sec 2 & Sec 3: Creep & Repeatability */}
                <div className='row g-3 mb-3'>
                  <div className='col-6'>
                    <div className='border border-primary rounded overflow-hidden h-100'>
                      <div className='bg-light-primary text-primary fw-bolder fs-8 px-3 py-1 border-bottom border-primary'>
                        2. CREEP TEST
                      </div>
                      <table className='table table-bordered border-gray-400 gs-2 gy-1 fs-9 mb-0 text-center align-middle'>
                        <thead className='bg-light'>
                          <tr className='fw-bold'>
                            <th style={{ width: '40px' }}>Sr. No.</th>
                            <th>Weight Applied</th>
                            <th>Displayed Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            '0 (Zero)',
                            'Half Load (50%)',
                            'Full Load (100%)',
                            'Half Load (50%)',
                            '0 (Zero)'
                          ].map((lbl, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}.</td>
                              <td>{lbl}</td>
                              <td>{(selectedQC.creepReadings || [])[idx] || '—'}</td>
                            </tr>
                          ))}
                          <tr className='fw-bold bg-light'>
                            <td colSpan={2} className='text-start ps-2'>Difference between 50% WT</td>
                            <td>{selectedQC.creepDiff || '0.0g'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className='col-6'>
                    <div className='border border-primary rounded overflow-hidden h-100'>
                      <div className='bg-light-primary text-primary fw-bolder fs-8 px-3 py-1 border-bottom border-primary d-flex justify-content-between'>
                        <span>3. REPEATABILITY TEST</span>
                        <span className='fs-9'>Load: {selectedQC.repeatLoad} | Tol ±: {selectedQC.repeatTol}</span>
                      </div>
                      <table className='table table-bordered border-gray-400 gs-2 gy-1 fs-9 mb-0 text-center align-middle'>
                        <thead className='bg-light'>
                          <tr className='fw-bold'>
                            <th style={{ width: '40px' }}>Sr. No.</th>
                            <th>Displayed Weight</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedQC.repeatRows || []).slice(0, 10).map((r, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}.</td>
                              <td>{r.disp}</td>
                              <td>{r.err || '—'}</td>
                            </tr>
                          ))}
                          <tr className='fw-bold bg-light'>
                            <td colSpan={2} className='text-end me-2'>Max. Difference</td>
                            <td>{selectedQC.repeatMaxDiff}</td>
                          </tr>
                          <tr className='fw-bold bg-light'>
                            <td colSpan={2} className='text-end me-2'>S.D. (Standard Deviation)</td>
                            <td>{selectedQC.repeatSD}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sec 4: Linearity Test */}
                <div className='border border-primary rounded overflow-hidden mb-4'>
                  <div className='bg-light-primary text-primary fw-bolder fs-8 px-3 py-1 border-bottom border-primary'>
                    4. LINEARITY TEST
                  </div>
                  <table className='table table-bordered border-primary gs-2 gy-1 fs-9 mb-0 text-center align-middle'>
                    <thead className='bg-light'>
                      <tr className='fw-bold'>
                        <th rowSpan={2}>Test Point</th>
                        <th colSpan={2}>Load (g)</th>
                        <th colSpan={2}>Displayed Weight (g)</th>
                        <th colSpan={2}>Difference (g)</th>
                        <th rowSpan={2}>Max. Difference</th>
                      </tr>
                      <tr className='fw-bold'>
                        <th>Increasing</th>
                        <th>Decreasing</th>
                        <th>Increasing</th>
                        <th>Decreasing</th>
                        <th>Increasing</th>
                        <th>Decreasing</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td rowSpan={2} className='fw-bold'>TW (A)</td>
                        <td>{selectedQC.linWeightA?.inc0?.load || '0'}</td>
                        <td>{selectedQC.linWeightA?.dec0?.load || '0'}</td>
                        <td>{selectedQC.linWeightA?.inc0?.disp || '0.0g'}</td>
                        <td>{selectedQC.linWeightA?.dec0?.disp || '0.0g'}</td>
                        <td>{selectedQC.linWeightA?.inc0?.diff || '0.0g'}</td>
                        <td>{selectedQC.linWeightA?.dec0?.diff || '0.0g'}</td>
                        <td>{selectedQC.linWeightA?.inc0?.diff || '0.0g'}</td>
                      </tr>
                      <tr>
                        <td>{selectedQC.linWeightA?.incMax?.load || 'Max'}</td>
                        <td>{selectedQC.linWeightA?.decMax?.load || 'Max'}</td>
                        <td>{selectedQC.linWeightA?.incMax?.disp || '1000.1g'}</td>
                        <td>{selectedQC.linWeightA?.decMax?.disp || '999.9g'}</td>
                        <td>{selectedQC.linWeightA?.incMax?.diff || '+0.1g'}</td>
                        <td>{selectedQC.linWeightA?.decMax?.diff || '-0.1g'}</td>
                        <td>{selectedQC.linWeightA?.incMax?.diff || '+0.1g'}</td>
                      </tr>
                      <tr>
                        <td rowSpan={2} className='fw-bold'>TW (B)</td>
                        <td>{selectedQC.linWeightB?.inc0?.load || '0'}</td>
                        <td>{selectedQC.linWeightB?.dec0?.load || '0'}</td>
                        <td>{selectedQC.linWeightB?.inc0?.disp || '0.0g'}</td>
                        <td>{selectedQC.linWeightB?.dec0?.disp || '0.1g'}</td>
                        <td>{selectedQC.linWeightB?.inc0?.diff || '0.0g'}</td>
                        <td>{selectedQC.linWeightB?.dec0?.diff || '+0.1g'}</td>
                        <td>{selectedQC.linWeightB?.dec0?.diff || '+0.1g'}</td>
                      </tr>
                      <tr>
                        <td>{selectedQC.linWeightB?.incMax?.load || 'Max'}</td>
                        <td>{selectedQC.linWeightB?.decMax?.load || 'Max'}</td>
                        <td>{selectedQC.linWeightB?.incMax?.disp || '1000.0g'}</td>
                        <td>{selectedQC.linWeightB?.decMax?.disp || '999.9g'}</td>
                        <td>{selectedQC.linWeightB?.incMax?.diff || '0.0g'}</td>
                        <td>{selectedQC.linWeightB?.decMax?.diff || '-0.1g'}</td>
                        <td>{selectedQC.linWeightB?.decMax?.diff || '-0.1g'}</td>
                      </tr>
                      <tr>
                        <td rowSpan={2} className='fw-bold'>TW (C)</td>
                        <td>{selectedQC.linWeightC?.inc0?.load || '0'}</td>
                        <td>{selectedQC.linWeightC?.dec0?.load || '0'}</td>
                        <td>{selectedQC.linWeightC?.inc0?.disp || '0.1g'}</td>
                        <td>{selectedQC.linWeightC?.dec0?.disp || '0.0g'}</td>
                        <td>{selectedQC.linWeightC?.inc0?.diff || '+0.1g'}</td>
                        <td>{selectedQC.linWeightC?.dec0?.diff || '0.0g'}</td>
                        <td>{selectedQC.linWeightC?.inc0?.diff || '+0.1g'}</td>
                      </tr>
                      <tr>
                        <td>{selectedQC.linWeightC?.incMax?.load || 'Max'}</td>
                        <td>{selectedQC.linWeightC?.decMax?.load || 'Max'}</td>
                        <td>{selectedQC.linWeightC?.incMax?.disp || '1000.0g'}</td>
                        <td>{selectedQC.linWeightC?.decMax?.disp || '1000.0g'}</td>
                        <td>{selectedQC.linWeightC?.incMax?.diff || '0.0g'}</td>
                        <td>{selectedQC.linWeightC?.decMax?.diff || '0.0g'}</td>
                        <td>{selectedQC.linWeightC?.incMax?.diff || '0.0g'}</td>
                      </tr>
                      <tr className='fw-bold bg-light'>
                        <td colSpan={7} className='text-end pe-3'>Max. Difference</td>
                        <td>{selectedQC.linMaxDiff || '0.1g'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Sign-off */}
                <div className='pt-3 border-top border-secondary border-dotted d-flex justify-content-between align-items-end fs-8'>
                  <div>
                    <strong>Remarks:</strong>
                    <div className='text-dark mt-1'>{selectedQC.remarks}</div>
                  </div>
                  <div className='text-end'>
                    <div className='fw-bold text-dark mb-6'>Tested By (Authorized Signatory)</div>
                    <div className='border-bottom border-dark w-150px ms-auto mb-1'></div>
                    <div><strong>Name:</strong> {selectedQC.testedBy}</div>
                    <div><strong>Designation:</strong> {selectedQC.designation}</div>
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
