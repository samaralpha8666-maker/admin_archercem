import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { getOifs, createOif, updateOif } from '../auth/core/_requests'
import { toast } from 'react-hot-toast'

interface ProductRow {
  model: string
  capacity: string
  readability: string
  dimension: string
  display: string
  instruction: string
}

interface OIFRecord {
  id: number | string
  oifNo: string
  poNo: string
  orderDate: string
  dispatchDate: string
  brand: string
  status: 'pending' | 'dispatched' | 'completed'
  customer: string
  contact: string
  contactNo: string
  billing: string
  shipping: string
  products: ProductRow[]
  pole: string
  printer: string
  stamping: string
  transport: string
  courier: string
  remarks: string
  preparedBy: string
  prepDate: string
  sign: string
}

const OIFPage: FC = () => {
  const [oifList, setOifList] = useState<OIFRecord[]>([])
  const [viewState, setViewState] = useState<'list' | 'form' | 'detail'>('list')
  const [activeOifId, setActiveOifId] = useState<number | string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'dispatched' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState<Partial<OIFRecord>>({
    brand: 'Archerchem',
    status: 'pending',
    products: [{ model: '', capacity: '', readability: '', dimension: '', display: 'LCD', instruction: '' }],
    pole: 'No',
    printer: 'No',
    stamping: 'No',
    orderDate: new Date().toISOString().split('T')[0],
  })

  // Selected theme for print layout
  const [printTheme, setPrintTheme] = useState<'Radwag' | 'ADRA' | 'Archerchem' | 'Tapson'>('Archerchem')

  const fetchOifs = async () => {
    setLoading(true)
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const res = await getOifs(activeBranch)
      if (res.data && res.data.success) {
        setOifList(res.data.orders || [])
      }
    } catch (e) {
      console.error('Fetch OIFs error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOifs()
    window.addEventListener('branch_changed', fetchOifs)
    return () => {
      window.removeEventListener('branch_changed', fetchOifs)
    }
  }, [])

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer) {
      toast.error('Customer name is required.')
      return
    }

    try {
      const cleanedProducts = (formData.products || []).filter((p) => p.model)
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const payload = {
        ...formData,
        products: cleanedProducts,
        branch: activeBranch
      }

      if (activeOifId) {
        // Edit API Call
        const res = await updateOif(activeOifId, payload)
        if (res.data && res.data.success) {
          toast.success('OIF Record updated successfully.')
        }
      } else {
        // Create API Call
        const res = await createOif(payload)
        if (res.data && res.data.success) {
          toast.success('OIF Record created successfully.')
        }
      }
      fetchOifs()
      setViewState('list')
      setActiveOifId(null)
    } catch (err: any) {
      console.error('Submit OIF error:', err)
      toast.error(err.response?.data?.error || 'Failed to save OIF record.')
    }
  }

  // Product Dynamic Rows Handlers
  const handleProductChange = (index: number, field: keyof ProductRow, val: string) => {
    const updatedProds = [...(formData.products || [])]
    updatedProds[index] = { ...updatedProds[index], [field]: val }
    setFormData({ ...formData, products: updatedProds })
  }

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [
        ...(formData.products || []),
        { model: '', capacity: '', readability: '', dimension: '', display: 'LCD', instruction: '' },
      ],
    })
  }

  const removeProductRow = (index: number) => {
    const updatedProds = (formData.products || []).filter((_, i) => i !== index)
    setFormData({ ...formData, products: updatedProds })
  }

  // Edit Mode Trigger
  const triggerEdit = (rec: OIFRecord) => {
    setFormData(rec)
    setActiveOifId(rec.id)
    setPrintTheme((rec.brand as any) || 'Archerchem')
    setViewState('form')
  }

  // OIF Detail selection
  const selectedOIF = oifList.find((o) => o.id === activeOifId)

  // Filter list
  const filteredOIF = oifList.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const matchesSearch =
      o.oifNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Theme Coloring Helper
  const getThemeStyles = (themeName: string) => {
    switch (themeName.toLowerCase()) {
      case 'radwag':
        return { accent: '#ea580c', bg: '#fff7ed', text: '#ea580c' }
      case 'adra':
        return { accent: '#0d9488', bg: '#f0fdfa', text: '#0d9488' }
      case 'tapson':
        return { accent: '#d97706', bg: '#fef3c7', text: '#d97706' }
      default:
        return { accent: '#3730a3', bg: '#e0e7ff', text: '#3730a3' }
    }
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Order Intimation Form (OIF)</PageTitle>
      <Content>
        {/* VIEW 1: OIF LIST */}
        {viewState === 'list' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold text-gray-900 fs-3'>Order Intimation Records</span>
                <span className='text-gray-500 mt-1 fw-semibold fs-7'>Generate and print OIF sheets for branch dispatches</span>
              </h3>
              <div className='card-toolbar'>
                <button
                  onClick={() => {
                    setFormData({
                      brand: 'Archerchem',
                      status: 'pending',
                      products: [{ model: '', capacity: '', readability: '', dimension: '', display: 'LCD', instruction: '' }],
                      pole: 'No',
                      printer: 'No',
                      stamping: 'No',
                      orderDate: new Date().toISOString().split('T')[0],
                    })
                    setActiveOifId(null)
                    setViewState('form')
                  }}
                  className='btn btn-primary btn-sm fw-bold'
                >
                  <i className='bi bi-plus-lg me-2'></i> New OIF Record
                </button>
              </div>
            </div>

            <div className='card-body pt-2'>
              {/* Filter controls */}
              <div className='d-flex align-items-center justify-content-between flex-wrap gap-4 mb-6'>
                <div className='d-flex align-items-center gap-2'>
                  {(['all', 'pending', 'dispatched', 'completed'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`btn btn-sm px-4 py-2 fw-bold text-capitalize ${
                        statusFilter === status ? 'btn-primary' : 'btn-light'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className='position-relative w-250px'>
                  <span className='position-absolute ms-3 top-50 translate-middle-y'>🔍</span>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='form-control form-control-solid ps-10 py-2 fs-7'
                    placeholder='Search Customer or OIF No...'
                  />
                </div>
              </div>

              {/* Table */}
              <div className='table-responsive'>
                {loading ? (
                  <div className='text-center py-10'>
                    <span className='spinner-border spinner-border-sm align-middle me-2'></span>
                    Loading orders from database...
                  </div>
                ) : (
                  <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                    <thead>
                      <tr className='fw-bold text-muted text-uppercase fs-8'>
                        <th className='min-w-100px'>OIF No</th>
                        <th className='min-w-150px'>Customer</th>
                        <th className='min-w-100px'>Brand</th>
                        <th className='min-w-100px'>PO Number</th>
                        <th className='min-w-100px text-end'>Order Date</th>
                        <th className='min-w-100px text-end'>Status</th>
                        <th className='min-w-120px text-end'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOIF.length === 0 ? (
                        <tr>
                          <td colSpan={7} className='text-center text-muted py-8'>
                            No OIF records found.
                          </td>
                        </tr>
                      ) : (
                        filteredOIF.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <span
                                onClick={() => {
                                  setActiveOifId(o.id)
                                  setPrintTheme(o.brand as any || 'Archerchem')
                                  setViewState('detail')
                                }}
                                className='text-gray-900 fw-bold text-hover-primary cursor-pointer fs-6'
                              >
                                {o.oifNo}
                              </span>
                            </td>
                            <td>
                              <div className='d-flex flex-column'>
                                <span className='text-gray-900 fw-bold fs-6'>{o.customer}</span>
                                <span className='text-muted fs-7'>{o.contact || 'No contact'}</span>
                              </div>
                            </td>
                            <td>
                              <span className='text-gray-800 fw-semibold'>{o.brand}</span>
                            </td>
                            <td>
                              <span className='text-gray-800 fw-semibold'>{o.poNo || '—'}</span>
                            </td>
                            <td className='text-end text-muted fw-semibold fs-7'>{o.orderDate}</td>
                            <td className='text-end'>
                              <span
                                className={`badge badge-light-${
                                  o.status === 'completed'
                                    ? 'success'
                                    : o.status === 'dispatched'
                                    ? 'info'
                                    : 'warning'
                                } fw-bold px-3 py-1`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className='text-end'>
                              <div className='d-flex justify-content-end gap-2'>
                                <button
                                  onClick={() => {
                                    setActiveOifId(o.id)
                                    setPrintTheme(o.brand as any || 'Archerchem')
                                    setViewState('detail')
                                  }}
                                  className='btn btn-icon btn-light-info btn-sm'
                                  title='View / Print Sheet'
                                >
                                  <i className='bi bi-printer fs-5'></i>
                                </button>
                                <button
                                  onClick={() => triggerEdit(o)}
                                  className='btn btn-icon btn-light-primary btn-sm'
                                  title='Edit Record'
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
                )}
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
                  {activeOifId ? `Edit Record ${formData.oifNo}` : 'Create Order Intimation Form (OIF)'}
                </span>
                <span className='text-gray-500 mt-1 fw-semibold fs-7'>Specify billing/shipping parameters and scale specifications</span>
              </h3>
              <div className='card-toolbar'>
                <button onClick={() => setViewState('list')} className='btn btn-sm btn-light fw-bold'>
                  Cancel
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='form card-body pt-4'>
              {/* Row 1: Brand, Status, Dates */}
              <div className='row g-6 mb-6'>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Company Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className='form-select form-select-solid'
                  >
                    <option value='Archerchem'>Archerchem Instruments</option>
                    <option value='Radwag'>Radwag Weighing Systems</option>
                    <option value='Tapson'>Tapson Analytics</option>
                    <option value='ADRA'>ADRA Instruments</option>
                  </select>
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>PO Number</label>
                  <input
                    type='text'
                    value={formData.poNo || ''}
                    onChange={(e) => setFormData({ ...formData, poNo: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='e.g. PO-2026-880'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7 required'>Order Date</label>
                  <input
                    type='date'
                    value={formData.orderDate || ''}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className='form-control form-control-solid'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Est. Dispatch Date</label>
                  <input
                    type='date'
                    value={formData.dispatchDate || ''}
                    onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                    className='form-control form-control-solid'
                  />
                </div>
              </div>

              {/* Row 2: Customer Contacts */}
              <div className='row g-6 mb-6'>
                <div className='col-md-4'>
                  <label className='form-label fw-bold fs-7 required'>Customer / Company Name</label>
                  <input
                    type='text'
                    value={formData.customer || ''}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='Sunrise Pharma Ltd'
                  />
                </div>
                <div className='col-md-4'>
                  <label className='form-label fw-bold fs-7'>Contact Person</label>
                  <input
                    type='text'
                    value={formData.contact || ''}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='Name'
                  />
                </div>
                <div className='col-md-4'>
                  <label className='form-label fw-bold fs-7'>Contact Telephone</label>
                  <input
                    type='text'
                    value={formData.contactNo || ''}
                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='Number'
                  />
                </div>
              </div>

              {/* Row 3: Billing & Shipping Address */}
              <div className='row g-6 mb-6'>
                <div className='col-md-6'>
                  <label className='form-label fw-bold fs-7'>Billing Address</label>
                  <textarea
                    value={formData.billing || ''}
                    onChange={(e) => setFormData({ ...formData, billing: e.target.value })}
                    className='form-control form-control-solid'
                    rows={2}
                    placeholder='Billing detailed address...'
                  />
                </div>
                <div className='col-md-6'>
                  <label className='form-label fw-bold fs-7'>Shipping / Dispatch Address</label>
                  <textarea
                    value={formData.shipping || ''}
                    onChange={(e) => setFormData({ ...formData, shipping: e.target.value })}
                    className='form-control form-control-solid'
                    rows={2}
                    placeholder='Shipping address (leave blank if same as billing)...'
                  />
                </div>
              </div>

              {/* Dynamic Product Specification Rows */}
              <div className='card border border-dashed border-gray-300 mb-6 bg-light-neutral p-6'>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                  <span className='fw-bold text-gray-800 fs-5'>Products / Models Specifications</span>
                  <button type='button' onClick={addProductRow} className='btn btn-light-primary btn-sm fw-bold'>
                    + Add Product Line
                  </button>
                </div>

                {(formData.products || []).map((prod, idx) => (
                  <div key={idx} className='row g-4 mb-4 align-items-end border-bottom border-gray-200 pb-4'>
                    <div className='col-md-3'>
                      <label className='form-label fw-bold fs-8 text-muted'>Model *</label>
                      <input
                        type='text'
                        value={prod.model}
                        onChange={(e) => handleProductChange(idx, 'model', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='e.g. AE-1000'
                      />
                    </div>
                    <div className='col-md-2'>
                      <label className='form-label fw-bold fs-8 text-muted'>Capacity</label>
                      <input
                        type='text'
                        value={prod.capacity}
                        onChange={(e) => handleProductChange(idx, 'capacity', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='e.g. 1Kg'
                      />
                    </div>
                    <div className='col-md-2'>
                      <label className='form-label fw-bold fs-8 text-muted'>Readability (d)</label>
                      <input
                        type='text'
                        value={prod.readability}
                        onChange={(e) => handleProductChange(idx, 'readability', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='e.g. 0.1g'
                      />
                    </div>
                    <div className='col-md-2'>
                      <label className='form-label fw-bold fs-8 text-muted'>Dimension</label>
                      <input
                        type='text'
                        value={prod.dimension}
                        onChange={(e) => handleProductChange(idx, 'dimension', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='e.g. 200x200mm'
                      />
                    </div>
                    <div className='col-md-2'>
                      <label className='form-label fw-bold fs-8 text-muted'>Display type</label>
                      <select
                        value={prod.display}
                        onChange={(e) => handleProductChange(idx, 'display', e.target.value)}
                        className='form-select form-select-solid form-select-sm'
                      >
                        <option value='LCD'>LCD</option>
                        <option value='LCD Backlit'>LCD Backlit</option>
                        <option value='7 Segment'>7 Segment</option>
                        <option value='LED Panel'>LED Panel</option>
                      </select>
                    </div>
                    <div className='col-md-11 mt-2'>
                      <input
                        type='text'
                        value={prod.instruction}
                        onChange={(e) => handleProductChange(idx, 'instruction', e.target.value)}
                        className='form-control form-control-solid form-control-sm'
                        placeholder='Special packing/calibration/engraving instructions for this line...'
                      />
                    </div>
                    <div className='col-md-1 mt-2 text-end'>
                      <button
                        type='button'
                        onClick={() => removeProductRow(idx)}
                        disabled={(formData.products || []).length <= 1}
                        className='btn btn-icon btn-light-danger btn-sm'
                      >
                        <i className='bi bi-trash fs-6'></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Extra checklist details: pole, printer, stamping, transport */}
              <div className='row g-6 mb-6'>
                <div className='col-md-2'>
                  <label className='form-label fw-bold fs-7'>Separate Pole?</label>
                  <select
                    value={formData.pole}
                    onChange={(e) => setFormData({ ...formData, pole: e.target.value })}
                    className='form-select form-select-solid'
                  >
                    <option value='No'>No</option>
                    <option value='Yes'>Yes</option>
                    <option value='Optional'>Optional</option>
                  </select>
                </div>
                <div className='col-md-2'>
                  <label className='form-label fw-bold fs-7'>Printer Required?</label>
                  <select
                    value={formData.printer}
                    onChange={(e) => setFormData({ ...formData, printer: e.target.value })}
                    className='form-select form-select-solid'
                  >
                    <option value='No'>No</option>
                    <option value='Yes'>Yes</option>
                    <option value='In-built'>In-built</option>
                  </select>
                </div>
                <div className='col-md-2'>
                  <label className='form-label fw-bold fs-7'>Stamping Required?</label>
                  <select
                    value={formData.stamping}
                    onChange={(e) => setFormData({ ...formData, stamping: e.target.value })}
                    className='form-select form-select-solid'
                  >
                    <option value='No'>No</option>
                    <option value='Yes'>Yes</option>
                    <option value='NABL Cert'>NABL Cert</option>
                  </select>
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Transport Transporter</label>
                  <input
                    type='text'
                    value={formData.transport || ''}
                    onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='e.g. Safe Cargo'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Courier agent</label>
                  <input
                    type='text'
                    value={formData.courier || ''}
                    onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='e.g. DHL/BlueDart'
                  />
                </div>
              </div>

              {/* Remarks, Signatures */}
              <div className='row g-6 mb-6'>
                <div className='col-md-6'>
                  <label className='form-label fw-bold fs-7'>Special Remarks / Packaging instructions</label>
                  <input
                    type='text'
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='e.g. Fragile handle with care'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Prepared By *</label>
                  <input
                    type='text'
                    value={formData.preparedBy || ''}
                    onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='Ramesh Patil'
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label fw-bold fs-7'>Designation / Signature</label>
                  <input
                    type='text'
                    value={formData.sign || ''}
                    onChange={(e) => setFormData({ ...formData, sign: e.target.value })}
                    className='form-control form-control-solid'
                    placeholder='Sales Manager'
                  />
                </div>
              </div>

              {/* Submits */}
              <div className='d-flex justify-content-end gap-3 pt-6 border-top'>
                <button
                  type='button'
                  onClick={() => setViewState('list')}
                  className='btn btn-light fw-bold'
                >
                  Cancel
                </button>
                <button type='submit' className='btn btn-primary fw-bold'>
                  💾 Save OIF Document
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: DETAIL & PRINT SHEETS PREVIEW */}
        {viewState === 'detail' && selectedOIF && (
          <div className='row g-6'>
            <div className='col-lg-4'>
              <div className='card border-0 shadow-sm mb-6'>
                <div className='card-header pt-6'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>OIF Options</h3>
                </div>
                <div className='card-body d-flex flex-column gap-4'>
                  <div>
                    <label className='form-label fw-bold fs-7'>Status Actions</label>
                    <div className='d-flex gap-2'>
                      <button
                        onClick={async () => {
                          try {
                            const res = await updateOif(selectedOIF.id, { status: 'dispatched' })
                            if (res.data.success) {
                              toast.success('Order status marked as Dispatched.')
                              fetchOifs()
                            }
                          } catch (e: any) {
                            console.error(e)
                            toast.error(e.response?.data?.error || 'Failed to update order status.')
                          }
                        }}
                        disabled={selectedOIF.status === 'dispatched'}
                        className='btn btn-light-info btn-sm flex-grow-1 fw-bold'
                      >
                        🚚 Dispatch
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await updateOif(selectedOIF.id, { status: 'completed' })
                            if (res.data.success) {
                              toast.success('Order marked as Completed.')
                              fetchOifs()
                            }
                          } catch (e: any) {
                            console.error(e)
                            toast.error(e.response?.data?.error || 'Failed to update order status.')
                          }
                        }}
                        disabled={selectedOIF.status === 'completed'}
                        className='btn btn-light-success btn-sm flex-grow-1 fw-bold'
                      >
                        ✅ Complete
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className='form-label fw-bold fs-7'>Print Design Theme</label>
                    <select
                      value={printTheme}
                      onChange={(e) => setPrintTheme(e.target.value as any)}
                      className='form-select form-select-solid'
                    >
                      <option value='Archerchem'>Archerchem (Indigo Theme)</option>
                      <option value='Radwag'>Radwag (Orange Theme)</option>
                      <option value='Tapson'>Tapson (Amber Theme)</option>
                      <option value='ADRA'>ADRA (Teal Theme)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className='btn btn-primary fw-bold w-100 mt-2'
                  >
                    🖨️ Open Browser Print Panel
                  </button>

                  <button
                    onClick={() => triggerEdit(selectedOIF)}
                    className='btn btn-light-primary fw-bold w-100'
                  >
                    ✏️ Edit Order Details
                  </button>

                  <button
                    onClick={() => {
                      setViewState('list')
                      setActiveOifId(null)
                    }}
                    className='btn btn-light w-100'
                  >
                    ← Back to List
                  </button>
                </div>
              </div>

              {/* Detail list card (customer details etc, which are not printed on final sheet) */}
              <div className='card border-0 shadow-sm'>
                <div className='card-header pt-6'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>👤 Private Billing Info</h3>
                </div>
                <div className='card-body pt-2'>
                  <p className='text-danger fs-7 fw-bold mb-4'>🔒 Internal only — hidden from the printed invoice sheet</p>
                  <div className='d-flex flex-column gap-3 fs-7'>
                    <div>
                      <span className='text-muted d-block'>Customer</span>
                      <strong className='text-gray-800'>{selectedOIF.customer}</strong>
                    </div>
                    <div>
                      <span className='text-muted d-block'>Contact Person</span>
                      <strong className='text-gray-800'>{selectedOIF.contact || '—'}</strong>
                    </div>
                    <div>
                      <span className='text-muted d-block'>Phone</span>
                      <strong className='text-gray-800'>{selectedOIF.contactNo || '—'}</strong>
                    </div>
                    <div>
                      <span className='text-muted d-block'>Billing Address</span>
                      <strong className='text-gray-800'>{selectedOIF.billing || '—'}</strong>
                    </div>
                    <div>
                      <span className='text-muted d-block'>Shipping Address</span>
                      <strong className='text-gray-800'>{selectedOIF.shipping || 'Same as Billing'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Sheet visual wrapper */}
            <div className='col-lg-8' id='printable-area'>
              <div
                className='card border shadow-lg p-10 rounded bg-white'
                style={{
                  minHeight: '297mm', // A4 aspect height ratio
                  fontFamily: "'Georgia', serif",
                  color: '#222',
                  borderTop: `8px solid ${getThemeStyles(printTheme).accent}`,
                }}
              >
                {/* Header */}
                <div className='d-flex justify-content-between align-items-start border-bottom pb-6 mb-6'>
                  <div>
                    <h1
                      className='fw-bold fs-2 m-0'
                      style={{ color: getThemeStyles(printTheme).accent }}
                    >
                      {printTheme === 'Radwag'
                        ? 'Radwag Weighing Systems'
                        : printTheme === 'ADRA'
                        ? 'ADRA Instruments'
                        : printTheme === 'Tapson'
                        ? 'Tapson Analytics'
                        : 'Archerchem Instruments'}
                    </h1>
                    <span className='text-muted fs-7 d-block mt-1'>
                      {printTheme === 'Radwag' ? 'Mumbai · Andheri HQ' : 'Vasai Factory, Maharashtra'}
                    </span>
                  </div>
                  <div
                    className='text-center p-3 fw-bold rounded fs-6 text-uppercase'
                    style={{
                      backgroundColor: getThemeStyles(printTheme).bg,
                      color: getThemeStyles(printTheme).accent,
                      border: `1.5px solid ${getThemeStyles(printTheme).accent}`,
                    }}
                  >
                    Order Intimation Form
                  </div>
                </div>

                {/* Info row */}
                <div className='row g-6 mb-6 fs-7 pb-4 border-bottom'>
                  <div className='col-4'>
                    <span className='text-muted d-block'>OIF Number</span>
                    <strong className='fs-6 text-dark'>{selectedOIF.oifNo}</strong>
                  </div>
                  <div className='col-4'>
                    <span className='text-muted d-block'>PO Number</span>
                    <strong className='fs-6 text-dark'>{selectedOIF.poNo || '—'}</strong>
                  </div>
                  <div className='col-4'>
                    <span className='text-muted d-block'>Order / Dispatch Dates</span>
                    <strong className='fs-6 text-dark'>
                      {selectedOIF.orderDate} / {selectedOIF.dispatchDate || 'TBD'}
                    </strong>
                  </div>
                </div>

                {/* Customer name (for print sheet) */}
                <div className='mb-6'>
                  <span className='text-muted d-block fs-7'>Customer / Consignee:</span>
                  <span className='fs-5 fw-bold text-dark'>{selectedOIF.customer}</span>
                </div>

                {/* Table: Products */}
                <div className='mb-8'>
                  <span className='text-muted d-block fs-7 mb-2 fw-bold text-uppercase' style={{ color: getThemeStyles(printTheme).accent }}>
                    🛠️ Scale / Product Specifications
                  </span>
                  <div className='table-responsive'>
                    <table className='table table-bordered border-gray-400 align-middle gs-4 gy-3 fs-7'>
                      <thead style={{ backgroundColor: getThemeStyles(printTheme).bg }}>
                        <tr className='fw-bold text-dark border-bottom border-gray-400'>
                          <th style={{ width: '40px' }} className='text-center'>Sr</th>
                          <th>Model</th>
                          <th>Capacity</th>
                          <th>Readability</th>
                          <th>Dimensions</th>
                          <th>Display</th>
                          <th>Special Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOIF.products.map((p, idx) => (
                          <tr key={idx} className='text-gray-900 border-bottom'>
                            <td className='text-center fw-bold'>{idx + 1}</td>
                            <td className='fw-bold'>{p.model}</td>
                            <td>{p.capacity}</td>
                            <td>{p.readability}</td>
                            <td>{p.dimension}</td>
                            <td>{p.display}</td>
                            <td className='text-muted italic'>{p.instruction || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Checklist options */}
                <div className='row g-6 mb-8 fs-7'>
                  <div className='col-md-6'>
                    <span className='text-muted d-block fs-7 mb-2 fw-bold text-uppercase' style={{ color: getThemeStyles(printTheme).accent }}>
                      📦 Accessories Checklist
                    </span>
                    <ul className='list-group list-group-flush border rounded p-4'>
                      <li className='d-flex justify-content-between py-1'>
                        <span>Separate mounting pole:</span>
                        <strong>{selectedOIF.pole}</strong>
                      </li>
                      <li className='d-flex justify-content-between py-1'>
                        <span>Printer module:</span>
                        <strong>{selectedOIF.printer}</strong>
                      </li>
                      <li className='d-flex justify-content-between py-1'>
                        <span>Legal stamping:</span>
                        <strong>{selectedOIF.stamping}</strong>
                      </li>
                    </ul>
                  </div>

                  <div className='col-md-6'>
                    <span className='text-muted d-block fs-7 mb-2 fw-bold text-uppercase' style={{ color: getThemeStyles(printTheme).accent }}>
                      🚚 Transport Logistics
                    </span>
                    <ul className='list-group list-group-flush border rounded p-4'>
                      <li className='d-flex justify-content-between py-1'>
                        <span>Transporter agent:</span>
                        <strong>{selectedOIF.transport || '—'}</strong>
                      </li>
                      <li className='d-flex justify-content-between py-1'>
                        <span>Courier / Docket:</span>
                        <strong>{selectedOIF.courier || '—'}</strong>
                      </li>
                      <li className='d-flex justify-content-between py-1'>
                        <span>Additional Remarks:</span>
                        <strong>{selectedOIF.remarks || '—'}</strong>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Sign off bottom */}
                <div className='mt-auto pt-10 border-top row g-6 fs-7 text-center'>
                  <div className='col-4 offset-8 text-end'>
                    <div className='mb-15'>
                      <span className='text-muted d-block'>Authorized Signatory</span>
                      <strong className='text-gray-900'>{selectedOIF.preparedBy}</strong>
                    </div>
                    <div style={{ borderTop: '1px solid #ddd', paddingTop: '5px' }}>
                      <span className='text-muted'>{selectedOIF.sign} · {selectedOIF.prepDate}</span>
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

export default OIFPage
