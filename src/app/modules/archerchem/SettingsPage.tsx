import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { getBranches, createBranch, getBrands, createBrand } from '../auth/core/_requests'
import toast from 'react-hot-toast'

interface BranchRecord {
  id: number
  name: string
  code: string
  location: string
}

interface BrandRecord {
  id: number
  name: string
  code: string
  description: string
}

const SettingsPage: FC = () => {
  const [branches, setBranches] = useState<BranchRecord[]>([])
  const [brands, setBrands] = useState<BrandRecord[]>([])
  const [loading, setLoading] = useState(false)

  // Branch Modals & Form
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: '', code: '', location: '' })

  // Brand Modals & Form
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [brandForm, setBrandForm] = useState({ name: '', code: '', description: '' })

  const loadData = async () => {
    setLoading(true)
    try {
      const [branchRes, brandRes] = await Promise.all([getBranches(), getBrands()])
      if (branchRes.data?.success) setBranches(branchRes.data.branches || [])
      if (brandRes.data?.success) setBrands(brandRes.data.brands || [])
    } catch (error) {
      console.error('Error loading settings data:', error)
      toast.error('Failed to load branches and brands.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchForm.name) {
      toast.error('Branch Name is required.')
      return
    }

    try {
      const res = await createBranch(branchForm)
      if (res.data?.success) {
        toast.success(`Branch "${res.data.branch.name}" created successfully.`)
        setShowBranchModal(false)
        setBranchForm({ name: '', code: '', location: '' })
        loadData()
        // Notify other navbar / layouts to reload branches list
        window.dispatchEvent(new Event('branch_changed'))
      }
    } catch (err: any) {
      console.error('Create branch error:', err)
      toast.error(err.response?.data?.error || 'Failed to create branch.')
    }
  }

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandForm.name) {
      toast.error('Brand Name is required.')
      return
    }

    try {
      const res = await createBrand(brandForm)
      if (res.data?.success) {
        toast.success(`Brand "${res.data.brand.name}" registered successfully.`)
        setShowBrandModal(false)
        setBrandForm({ name: '', code: '', description: '' })
        loadData()
      }
    } catch (err: any) {
      console.error('Create brand error:', err)
      toast.error(err.response?.data?.error || 'Failed to create brand.')
    }
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Company Configurations &amp; Settings</PageTitle>
      <Content>
        {loading && (
          <div className='d-flex align-items-center justify-content-center p-10'>
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading configurations...</span>
            </div>
          </div>
        )}

        {!loading && (
          <div className='row g-5 g-xl-8'>
            {/* Branches Card */}
            <div className='col-xl-6'>
              <div className='card card-xl-stretch border-0 shadow-sm bg-body mb-5 mb-xl-8'>
                <div className='card-header border-0 pt-5'>
                  <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold text-gray-900 fs-3'>Dynamic Branches</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Manage office, store, factory and laboratory locations</span>
                  </h3>
                  <div className='card-toolbar'>
                    <button
                      onClick={() => setShowBranchModal(true)}
                      className='btn btn-sm btn-light-success fw-bold'
                    >
                      🏢 Add Branch
                    </button>
                  </div>
                </div>

                <div className='card-body py-3'>
                  <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                      <thead>
                        <tr className='fw-bold text-muted'>
                          <th className='min-w-150px'>Branch Name</th>
                          <th className='min-w-100px'>Code</th>
                          <th className='min-w-150px'>Location / Region</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branches.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <span className='text-gray-900 fw-bold fs-6'>{b.name}</span>
                            </td>
                            <td>
                              <span className='badge badge-light-primary fw-bold fs-7'>{b.code}</span>
                            </td>
                            <td>
                              <span className='text-gray-600 fw-semibold fs-6'>{b.location || 'N/A'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Brands Card */}
            <div className='col-xl-6'>
              <div className='card card-xl-stretch border-0 shadow-sm bg-body mb-5 mb-xl-8'>
                <div className='card-header border-0 pt-5'>
                  <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold text-gray-900 fs-3'>Scale Brands</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Manage weighing instrument manufacture brands</span>
                  </h3>
                  <div className='card-toolbar'>
                    <button
                      onClick={() => setShowBrandModal(true)}
                      className='btn btn-sm btn-light-primary fw-bold'
                    >
                      ⚖️ Add Brand
                    </button>
                  </div>
                </div>

                <div className='card-body py-3'>
                  <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                      <thead>
                        <tr className='fw-bold text-muted'>
                          <th className='min-w-150px'>Brand Name</th>
                          <th className='min-w-100px'>Code</th>
                          <th className='min-w-150px'>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brands.map((br) => (
                          <tr key={br.id}>
                            <td>
                              <span className='text-gray-900 fw-bold fs-6'>{br.name}</span>
                            </td>
                            <td>
                              <span className='badge badge-light-info fw-bold fs-7'>{br.code}</span>
                            </td>
                            <td>
                              <span className='text-gray-600 fw-semibold fs-6'>{br.description || 'N/A'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Branch */}
        {showBranchModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content border-0 shadow-lg rounded bg-body'>
                <div className='modal-header border-0 pt-5 px-6'>
                  <h5 className='modal-title fw-bold fs-3 text-gray-900'>🏢 Create Branch</h5>
                  <button type='button' className='btn-close' onClick={() => setShowBranchModal(false)}></button>
                </div>

                <form onSubmit={handleBranchSubmit}>
                  <div className='modal-body px-6 py-4'>
                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 text-gray-800 required'>Branch Name</label>
                      <input
                        type='text'
                        value={branchForm.name}
                        onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. Vadodara Office'
                        required
                      />
                    </div>
                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 text-gray-800'>Branch Code</label>
                      <input
                        type='text'
                        value={branchForm.code}
                        onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. VADODARA (Auto-generated if empty)'
                      />
                    </div>
                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 text-gray-800'>Location / Address</label>
                      <input
                        type='text'
                        value={branchForm.location}
                        onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. GIDC Industrial Area'
                      />
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-5 px-6 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowBranchModal(false)}>Cancel</button>
                    <button type='submit' className='btn btn-success fw-bold fs-7'>Save Branch</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Brand */}
        {showBrandModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content border-0 shadow-lg rounded bg-body'>
                <div className='modal-header border-0 pt-5 px-6'>
                  <h5 className='modal-title fw-bold fs-3 text-gray-900'>⚖️ Register Brand</h5>
                  <button type='button' className='btn-close' onClick={() => setShowBrandModal(false)}></button>
                </div>

                <form onSubmit={handleBrandSubmit}>
                  <div className='modal-body px-6 py-4'>
                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 text-gray-800 required'>Brand Name</label>
                      <input
                        type='text'
                        value={brandForm.name}
                        onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. Mettler Toledo'
                        required
                      />
                    </div>
                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 text-gray-800'>Brand Code</label>
                      <input
                        type='text'
                        value={brandForm.code}
                        onChange={(e) => setBrandForm({ ...brandForm, code: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. METTLER (Auto-generated if empty)'
                      />
                    </div>
                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 text-gray-800'>Description</label>
                      <textarea
                        value={brandForm.description}
                        onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. Laboratory precision weight metrics'
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-5 px-6 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowBrandModal(false)}>Cancel</button>
                    <button type='submit' className='btn btn-primary fw-bold fs-7'>Save Brand</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default SettingsPage
