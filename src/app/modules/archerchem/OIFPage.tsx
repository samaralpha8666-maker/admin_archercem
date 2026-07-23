import { FC, useState, useEffect, Fragment } from 'react'
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
    prepDate: new Date().toISOString().split('T')[0],
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
  const handleSubmit = async (e: React.FormEvent | null, printAfterSave = false) => {
    if (e) e.preventDefault()
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

      let savedId = activeOifId
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
          if (res.data.order) {
            savedId = res.data.order.id
          }
        }
      }
      await fetchOifs()

      if (printAfterSave && savedId) {
        setActiveOifId(savedId)
        setViewState('detail')
        setTimeout(() => {
          window.print()
        }, 300)
      } else {
        setViewState('list')
        setActiveOifId(null)
      }
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
          <div className='d-flex flex-column gap-5'>
            {/* Header Toolbar */}
            <div className='d-flex align-items-center justify-content-between mb-2'>
              <div className='d-flex align-items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setViewState('list')}
                  className='btn btn-icon btn-light-primary btn-sm rounded-circle me-2'
                >
                  <i className='bi bi-arrow-left fs-3'></i>
                </button>
                <h1 className='text-gray-900 fw-bold m-0 fs-2'>New OIF</h1>
              </div>
              <div>
                <button
                  type='button'
                  onClick={() => window.print()}
                  className='btn btn-icon btn-light-primary btn-sm rounded-circle'
                  title='Print Sheet'
                >
                  <i className='bi bi-printer fs-4'></i>
                </button>
              </div>
            </div>

            {/* Top Brand Banner */}
            <div className='card border-0 shadow-sm overflow-hidden'>
              <div
                className='d-flex flex-column align-items-center justify-content-center p-8 text-white'
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                }}
              >
                <div className='d-flex align-items-center gap-3 mb-2'>
                  <i className='bi bi-scale text-white fs-1 me-2'></i>
                  <div className='text-start'>
                    <h4 className='m-0 fw-bold text-white fs-3'>Archerchem Instruments</h4>
                    <span className='fs-8 text-white-50'>Vasai Factory</span>
                  </div>
                </div>
                <div
                  className='w-100 my-4'
                  style={{borderTop: '1px solid rgba(255, 255, 255, 0.15)'}}
                ></div>
                <h5 className='m-0 fw-bolder text-white tracking-widest text-uppercase fs-6'>
                  ORDER INTIMATION FORM
                </h5>
              </div>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className='form d-flex flex-column gap-6'>
              {/* Card 1: OIF Details */}
              <div className='card border-0 shadow-sm'>
                <div className='card-header border-0 pt-6'>
                  <h3 className='card-title align-items-start'>
                    <span className='card-label fw-bold text-gray-800 fs-4'>
                      <i className='bi bi-calendar3 text-primary fs-4 me-2'></i> OIF Details
                    </span>
                  </h3>
                </div>
                <div className='card-body pt-2'>
                  <div className='row g-6'>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>OIF NO. (AUTO-GENERATED)</label>
                      <input
                        type='text'
                        value={formData.oifNo || 'OIF-XXX'}
                        className='form-control form-control-solid bg-light'
                        disabled
                        readOnly
                      />
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>PO NO.</label>
                      <input
                        type='text'
                        value={formData.poNo || ''}
                        onChange={(e) => setFormData({...formData, poNo: e.target.value})}
                        className='form-control form-control-solid'
                        placeholder='PO-2026-XXX'
                      />
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700 required'>ORDER DATE</label>
                      <div className='position-relative'>
                        <input
                          type='date'
                          value={formData.orderDate || ''}
                          onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                          className='form-control form-control-solid'
                        />
                      </div>
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>DISPATCH DATE</label>
                      <input
                        type='date'
                        value={formData.dispatchDate || ''}
                        onChange={(e) => setFormData({...formData, dispatchDate: e.target.value})}
                        className='form-control form-control-solid'
                      />
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>BRAND</label>
                      <select
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className='form-select form-select-solid'
                      >
                        <option value='Archerchem'>Archerchem</option>
                        <option value='Radwag'>Radwag</option>
                        <option value='Tapson'>Tapson</option>
                        <option value='ADRA'>ADRA</option>
                      </select>
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>STATUS</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className='form-select form-select-solid'
                      >
                        <option value='pending'>Pending</option>
                        <option value='dispatched'>Dispatched</option>
                        <option value='completed'>Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Customer Details */}
              <div className='card border-0 shadow-sm'>
                <div className='card-header border-0 pt-6 d-flex align-items-center justify-content-between'>
                  <h3 className='card-title align-items-start'>
                    <span className='card-label fw-bold text-gray-800 fs-4 me-2'>
                      <i className='bi bi-person text-primary fs-4 me-2'></i> Customer Details
                    </span>
                  </h3>
                  <span className='badge badge-light-primary fw-bold px-3 py-2 fs-8'>
                    🔒 Internal Only — Not Printed
                  </span>
                </div>
                <div className='card-body pt-2'>
                  {/* Alert banner */}
                  <div className='alert alert-dismissible bg-light-primary border border-primary border-dashed d-flex p-5 mb-6 rounded-3'>
                    <i className='ki-duotone ki-information-5 fs-2hx text-primary me-4'>
                      <span className='path1'></span>
                      <span className='path2'></span>
                      <span className='path3'></span>
                    </i>
                    <div className='d-flex flex-column'>
                      <span className='text-primary fw-bold fs-6'>Note</span>
                      <span className='text-gray-700 fw-semibold fs-7 mt-1'>
                        These details are saved in your records, but will not appear on the printed OIF sent to customers.
                      </span>
                    </div>
                  </div>

                  <div className='row g-6 mb-6'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-gray-700 required'>CUSTOMER NAME</label>
                      <input
                        type='text'
                        value={formData.customer || ''}
                        onChange={(e) => setFormData({...formData, customer: e.target.value})}
                        className='form-control form-control-solid'
                        placeholder='Customer / Company Name'
                      />
                    </div>
                    <div className='col-md-3'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>CONTACT PERSON</label>
                      <input
                        type='text'
                        value={formData.contact || ''}
                        onChange={(e) => setFormData({...formData, contact: e.target.value})}
                        className='form-control form-control-solid'
                        placeholder='Name'
                      />
                    </div>
                    <div className='col-md-3'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>CONTACT NO.</label>
                      <input
                        type='text'
                        value={formData.contactNo || ''}
                        onChange={(e) => setFormData({...formData, contactNo: e.target.value})}
                        className='form-control form-control-solid'
                        placeholder='Mobile'
                      />
                    </div>
                  </div>

                  <div className='row g-6'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>BILLING ADDRESS</label>
                      <textarea
                        value={formData.billing || ''}
                        onChange={(e) => setFormData({...formData, billing: e.target.value})}
                        className='form-control form-control-solid'
                        rows={3}
                        placeholder='Full billing address...'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>SHIPPING ADDRESS</label>
                      <textarea
                        value={formData.shipping || ''}
                        onChange={(e) => setFormData({...formData, shipping: e.target.value})}
                        className='form-control form-control-solid'
                        rows={3}
                        placeholder='Full shipping address (if different)...'
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Products / Models */}
              <div className='card border-0 shadow-sm'>
                <div className='card-header border-0 pt-6 d-flex align-items-center justify-content-between'>
                  <h3 className='card-title align-items-start'>
                    <span className='card-label fw-bold text-gray-800 fs-4'>
                      <i className='bi bi-box-seam text-primary fs-4 me-2'></i> Products / Models
                    </span>
                  </h3>
                  <button
                    type='button'
                    onClick={addProductRow}
                    className='btn btn-light-primary btn-sm fw-bold'
                  >
                    + Add Product
                  </button>
                </div>
                <div className='card-body pt-2 d-flex flex-column gap-6'>
                  {(formData.products || []).map((prod, idx) => (
                    <div
                      key={idx}
                      className='p-6 rounded-3 border border-gray-200 bg-light-neutral position-relative'
                      style={{backgroundColor: '#f8f9fa'}}
                    >
                      <div className='d-flex align-items-center justify-content-between mb-4 border-bottom border-gray-200 pb-3'>
                        <span className='fw-bold text-gray-700 fs-6'>Model {idx + 1}</span>
                        {formData.products && formData.products.length > 1 && (
                          <button
                            type='button'
                            onClick={() => removeProductRow(idx)}
                            className='btn btn-icon btn-light-danger btn-xs rounded-circle'
                            title='Remove Model'
                          >
                            <i className='bi bi-trash fs-7'></i>
                          </button>
                        )}
                      </div>

                      <div className='row g-5 mb-4'>
                        <div className='col-md-4'>
                          <label className='form-label fw-bold fs-8 text-gray-600 required'>MODEL</label>
                          <input
                            type='text'
                            value={prod.model}
                            onChange={(e) => handleProductChange(idx, 'model', e.target.value)}
                            className='form-control form-control-solid form-control-sm'
                            placeholder='e.g. AE-1000'
                          />
                        </div>
                        <div className='col-md-2'>
                          <label className='form-label fw-bold fs-8 text-gray-600'>CAPACITY</label>
                          <input
                            type='text'
                            value={prod.capacity}
                            onChange={(e) => handleProductChange(idx, 'capacity', e.target.value)}
                            className='form-control form-control-solid form-control-sm'
                            placeholder='e.g. 1Kg'
                          />
                        </div>
                        <div className='col-md-2'>
                          <label className='form-label fw-bold fs-8 text-gray-600'>READABILITY</label>
                          <input
                            type='text'
                            value={prod.readability}
                            onChange={(e) => handleProductChange(idx, 'readability', e.target.value)}
                            className='form-control form-control-solid form-control-sm'
                            placeholder='e.g. 0.1g'
                          />
                        </div>
                        <div className='col-md-2'>
                          <label className='form-label fw-bold fs-8 text-gray-600'>OVERALL DIMENSION</label>
                          <input
                            type='text'
                            value={prod.dimension}
                            onChange={(e) => handleProductChange(idx, 'dimension', e.target.value)}
                            className='form-control form-control-solid form-control-sm'
                            placeholder='e.g. 250x200x80mm'
                          />
                        </div>
                        <div className='col-md-2'>
                          <label className='form-label fw-bold fs-8 text-gray-600'>DISPLAY</label>
                          <input
                            type='text'
                            value={prod.display}
                            onChange={(e) => handleProductChange(idx, 'display', e.target.value)}
                            className='form-control form-control-solid form-control-sm'
                            placeholder='e.g. 7 Segment LCD'
                          />
                        </div>
                      </div>

                      <div className='row g-5'>
                        <div className='col-12'>
                          <label className='form-label fw-bold fs-8 text-gray-600'>SPECIAL INSTRUCTION</label>
                          <textarea
                            value={prod.instruction}
                            onChange={(e) => handleProductChange(idx, 'instruction', e.target.value)}
                            className='form-control form-control-solid form-control-sm'
                            rows={2}
                            placeholder='Any special instruction for this model...'
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Additional Details */}
              <div className='card border-0 shadow-sm'>
                <div className='card-header border-0 pt-6'>
                  <h3 className='card-title align-items-start'>
                    <span className='card-label fw-bold text-gray-800 fs-4'>
                      <i className='bi bi-truck text-primary fs-4 me-2'></i> Additional Details
                    </span>
                  </h3>
                </div>
                <div className='card-body pt-2'>
                  <div className='row g-6 mb-6'>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>SEPARATE POLE</label>
                      <select
                        value={formData.pole}
                        onChange={(e) => setFormData({...formData, pole: e.target.value})}
                        className='form-select form-select-solid'
                      >
                        <option value='No'>No</option>
                        <option value='Yes'>Yes</option>
                        <option value='Optional'>Optional</option>
                      </select>
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>PRINTER</label>
                      <select
                        value={formData.printer}
                        onChange={(e) => setFormData({...formData, printer: e.target.value})}
                        className='form-select form-select-solid'
                      >
                        <option value='No'>No</option>
                        <option value='Yes'>Yes</option>
                        <option value='In-built'>In-built</option>
                      </select>
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>STAMPING</label>
                      <select
                        value={formData.stamping}
                        onChange={(e) => setFormData({...formData, stamping: e.target.value})}
                        className='form-select form-select-solid'
                      >
                        <option value='No'>No</option>
                        <option value='Yes'>Yes</option>
                        <option value='NABL Cert'>NABL Cert</option>
                      </select>
                    </div>
                  </div>

                  <div className='row g-6 mb-6'>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>TRANSPORT</label>
                      <input
                        type='text'
                        value={formData.transport || ''}
                        onChange={(e) => setFormData({...formData, transport: e.target.value})}
                        className='form-control form-control-solid'
                        placeholder='Transporter name'
                      />
                    </div>
                    <div className='col-md-6'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>COURIER</label>
                      <input
                        type='text'
                        value={formData.courier || ''}
                        onChange={(e) => setFormData({...formData, courier: e.target.value})}
                        className='form-control form-control-solid'
                        placeholder='Courier service'
                      />
                    </div>
                  </div>

                  <div className='row g-6'>
                    <div className='col-12'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>REMARKS</label>
                      <textarea
                        value={formData.remarks || ''}
                        onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                        className='form-control form-control-solid'
                        rows={3}
                        placeholder='Any special instructions or remarks...'
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Prepared By */}
              <div className='card border-0 shadow-sm'>
                <div className='card-header border-0 pt-6'>
                  <h3 className='card-title align-items-start'>
                    <span className='card-label fw-bold text-gray-800 fs-4'>
                      <i className='bi bi-pencil-square text-primary fs-4 me-2'></i> Prepared By
                    </span>
                  </h3>
                </div>
                <div className='card-body pt-2'>
                  <div className='row g-6'>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700 required'>NAME</label>
                      <input
                        type='text'
                        value={formData.preparedBy || ''}
                        onChange={(e) => setFormData({...formData, preparedBy: e.target.value})}
                        className='form-control form-control-solid'
                        placeholder='Your name'
                      />
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700 required'>DATE</label>
                      <input
                        type='date'
                        value={formData.prepDate || ''}
                        onChange={(e) => setFormData({...formData, prepDate: e.target.value})}
                        className='form-control form-control-solid'
                      />
                    </div>
                    <div className='col-md-4'>
                      <label className='form-label fw-bold fs-7 text-gray-700'>DIGITAL SIGNATURE / DESIGNATION</label>
                      <input
                        type='text'
                        value={formData.sign || ''}
                        onChange={(e) => setFormData({...formData, sign: e.target.value})}
                        className='form-control form-control-solid'
                        placeholder='e.g. Sales Manager'
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='d-flex flex-column gap-3 mb-10'>
                <div className='d-flex justify-content-between align-items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => setViewState('list')}
                    className='btn btn-outline-secondary fw-bold px-8'
                    style={{borderColor: '#ccc'}}
                  >
                    Cancel
                  </button>
                  <div className='d-flex gap-3'>
                    <button
                      type='button'
                      onClick={() => handleSubmit(null, false)}
                      className='btn btn-outline-primary fw-bold px-8'
                      style={{
                        color: '#312e81',
                        borderColor: '#312e81',
                      }}
                    >
                      <i className='bi bi-file-earmark-arrow-down fs-5 me-2'></i> Save Draft
                    </button>
                    <button
                      type='submit'
                      className='btn text-white fw-bold px-8'
                      style={{
                        backgroundColor: '#312e81',
                      }}
                    >
                      <i className='bi bi-check-circle fs-5 me-2'></i> Submit OIF
                    </button>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={(e) => handleSubmit(null, true)}
                  className='btn w-100 text-white fw-bold mt-2 py-4'
                  style={{
                    backgroundColor: '#0d9488',
                  }}
                >
                  <i className='bi bi-printer fs-4 me-2'></i> Print / Download PDF
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
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>
                    <i className='bi bi-gear-fill text-primary fs-4 me-2'></i> OIF Options
                  </h3>
                </div>
                <div className='card-body d-flex flex-column gap-4'>
                  <div>
                    <label className='form-label fw-bold fs-7 text-gray-700'>Status Actions</label>
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
                        <i className='bi bi-truck fs-5 me-1'></i> Dispatch
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
                        <i className='bi bi-check-circle fs-5 me-1'></i> Complete
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className='form-label fw-bold fs-7 text-gray-700'>Print Design Theme</label>
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
                    <i className='bi bi-printer fs-4 me-2'></i> Open Print Panel
                  </button>

                  <button
                    onClick={() => triggerEdit(selectedOIF)}
                    className='btn btn-light-primary fw-bold w-100'
                  >
                    <i className='bi bi-pencil fs-4 me-2'></i> Edit Details
                  </button>

                  <button
                    onClick={() => {
                      setViewState('list')
                      setActiveOifId(null)
                    }}
                    className='btn btn-light w-100'
                  >
                    <i className='bi bi-arrow-left fs-4 me-2'></i> Back to List
                  </button>
                </div>
              </div>

              {/* Detail list card (customer details etc, which are not printed on final sheet) */}
              <div className='card border-0 shadow-sm'>
                <div className='card-header pt-6'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>
                    <i className='bi bi-shield-lock text-danger fs-4 me-2'></i> Private Billing Info
                  </h3>
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
                className='card bg-white shadow-lg'
                style={{
                  minHeight: '297mm', // A4 aspect height ratio
                  fontFamily: "Arial, sans-serif",
                  color: '#222',
                  border: `2px solid ${getThemeStyles(printTheme).accent}`,
                  padding: '40px',
                  borderRadius: '8px'
                }}
              >
                {/* Header */}
                <div className='text-center mb-8'>
                  <h1
                    className='fw-bold text-uppercase m-0'
                    style={{
                      color: getThemeStyles(printTheme).accent,
                      fontSize: '24px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {printTheme === 'Radwag'
                      ? 'Radwag Weighing Systems'
                      : printTheme === 'ADRA'
                      ? 'ADRA Instruments'
                      : printTheme === 'Tapson'
                      ? 'Tapson Analytics'
                      : 'Archerchem Instruments'}
                  </h1>
                  <h5
                    className='fw-bold m-0 mt-1'
                    style={{
                      color: getThemeStyles(printTheme).accent,
                      fontSize: '14px',
                    }}
                  >
                    {printTheme === 'Radwag' ? 'Mumbai · Andheri HQ' : 'Vasai Factory'}
                  </h5>
                  <h4
                    className='fw-semibold text-uppercase mt-6 mb-2 text-center'
                    style={{
                      color: '#94a3b8',
                      fontSize: '15px',
                      letterSpacing: '1px',
                    }}
                  >
                    ORDER INTIMATION FORM
                  </h4>
                </div>

                {/* Order Details block */}
                <div className='mb-6'>
                  <span className='fw-bold text-uppercase fs-8 text-gray-500 d-block mb-2'>
                    ORDER DETAILS
                  </span>
                  <div
                    className='border rounded-3 p-4'
                    style={{borderColor: '#cbd5e1', backgroundColor: '#f8f9fa'}}
                  >
                    <div className='row align-items-center'>
                      <div className='col-6'>
                        <span className='fw-semibold text-muted'>OIE : </span>
                        <strong className='text-gray-800 fs-7'>{selectedOIF.oifNo}</strong>
                      </div>
                      <div className='col-6'>
                        <span className='fw-semibold text-muted'>PO. NO. : </span>
                        <strong className='text-gray-800 fs-7'>{selectedOIF.poNo || '—'}</strong>
                      </div>
                    </div>
                    <div
                      className='border-top border-dashed my-3'
                      style={{borderColor: '#cbd5e1'}}
                    ></div>
                    <div className='row align-items-center'>
                      <div className='col-6'>
                        <span className='fw-semibold text-muted'>ORDER DATE : </span>
                        <strong className='text-gray-800 fs-7'>{selectedOIF.orderDate}</strong>
                      </div>
                      <div className='col-6'>
                        <span className='fw-semibold text-muted'>DISPATCH DATE : </span>
                        <strong className='text-gray-800 fs-7'>{selectedOIF.dispatchDate || '—'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table: Products + Checklist */}
                <div className='mb-6 table-responsive'>
                  <table
                    className='table table-bordered align-middle gs-4 gy-3 fs-7'
                    style={{
                      borderColor: '#cbd5e1',
                      borderCollapse: 'collapse',
                    }}
                  >
                    <thead>
                      <tr
                        className='fw-bold text-gray-500 bg-light'
                        style={{
                          fontSize: '11px',
                          borderBottom: '2px solid #cbd5e1',
                        }}
                      >
                        <th style={{width: '60px'}} className='text-center'>
                          Sr. No.
                        </th>
                        <th style={{width: '320px'}}>Details</th>
                        <th>Information / Specification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOIF.products.map((p, idx) => (
                        <Fragment key={idx}>
                          {/* Model row */}
                          <tr
                            className='border-bottom'
                            style={{
                              borderTop: idx > 0 ? '2px solid #cbd5e1' : 'none',
                            }}
                          >
                            <td
                              className='text-center fw-bold text-dark'
                              rowSpan={p.instruction ? 6 : 5}
                              style={{
                                verticalAlign: 'top',
                                paddingTop: '10px',
                              }}
                            >
                              {idx + 1}
                            </td>
                            <td className='fw-bold text-gray-800'>Model</td>
                            <td className='fw-bold text-gray-800'>{p.model}</td>
                          </tr>
                          <tr className='border-bottom'>
                            <td className='text-muted'>Capacity</td>
                            <td>{p.capacity || '—'}</td>
                          </tr>
                          <tr className='border-bottom'>
                            <td className='text-muted'>Readability</td>
                            <td>{p.readability || '—'}</td>
                          </tr>
                          <tr className='border-bottom'>
                            <td className='text-muted'>
                              Overall Dimension of Pan or P/F (L x W x H)
                            </td>
                            <td>{p.dimension || '—'}</td>
                          </tr>
                          <tr className='border-bottom'>
                            <td className='text-muted'>Display</td>
                            <td>{p.display || '—'}</td>
                          </tr>
                          {p.instruction && (
                            <tr className='border-bottom'>
                              <td className='text-muted fw-semibold'>Special Instruction</td>
                              <td className='text-muted italic'>{p.instruction}</td>
                            </tr>
                          )}
                        </Fragment>
                      ))}

                      {/* Checklist options */}
                      <tr
                        className='border-bottom'
                        style={{borderTop: '2px solid #cbd5e1'}}
                      >
                        <td></td>
                        <td className='text-muted'>Separate Pole / Attached Pole</td>
                        <td className='fw-bold'>{selectedOIF.pole}</td>
                      </tr>
                      <tr className='border-bottom'>
                        <td></td>
                        <td className='text-muted'>Printer (TVS/Epson)</td>
                        <td className='fw-bold'>{selectedOIF.printer}</td>
                      </tr>
                      <tr className='border-bottom'>
                        <td></td>
                        <td className='text-muted'>Stamping</td>
                        <td className='fw-bold'>{selectedOIF.stamping}</td>
                      </tr>
                      <tr className='border-bottom'>
                        <td></td>
                        <td className='text-muted'>
                          Transport (Payable by – Client / ADRA)
                        </td>
                        <td className='fw-bold'>{selectedOIF.transport || '—'}</td>
                      </tr>
                      <tr className='border-bottom'>
                        <td></td>
                        <td className='text-muted'>Transport (By Hand/Road/Air/Train)</td>
                        <td>—</td>
                      </tr>
                      <tr className='border-bottom'>
                        <td></td>
                        <td className='text-muted'>Courier / Transport to be used</td>
                        <td className='fw-bold'>{selectedOIF.courier || '—'}</td>
                      </tr>
                      <tr className='border-bottom'>
                        <td></td>
                        <td className='text-muted'>Remarks</td>
                        <td className='fw-bold'>{selectedOIF.remarks || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Prepared By block at the bottom */}
                <div
                  className='border rounded-3 p-4 mt-auto'
                  style={{borderColor: '#cbd5e1'}}
                >
                  <div className='d-flex flex-column gap-2'>
                    <div className='row align-items-center'>
                      <div className='col-3 text-muted fw-semibold'>Name</div>
                      <div className='col-9 text-gray-800 fw-bold'>
                        : {selectedOIF.preparedBy}
                      </div>
                    </div>
                    <div
                      className='border-top border-gray-200 my-2'
                      style={{borderTopStyle: 'dashed'}}
                    ></div>
                    <div className='row align-items-center'>
                      <div className='col-3 text-muted fw-semibold'>Date</div>
                      <div className='col-9 text-gray-800 fw-bold'>
                        : {selectedOIF.prepDate}
                      </div>
                    </div>
                    <div
                      className='border-top border-gray-200 my-2'
                      style={{borderTopStyle: 'dashed'}}
                    ></div>
                    <div className='row align-items-center'>
                      <div className='col-3 text-muted fw-semibold'>Sign</div>
                      <div className='col-9 text-gray-800 fw-bold'>
                        : {selectedOIF.sign || '—'}
                      </div>
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
