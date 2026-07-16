import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { 
  getBranches, createBranch, updateBranch, deleteBranch, 
  getBrands, createBrand, updateBrand, deleteBrand 
} from '../auth/core/_requests'
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

const BrandsPage: FC = () => {
  const [branches, setBranches] = useState<BranchRecord[]>([])
  const [brands, setBrands] = useState<BrandRecord[]>([])
  const [activeTab, setActiveTab] = useState<'brands' | 'branches'>('brands')
  const [loading, setLoading] = useState(false)

  // Edit states
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null)
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null)

  // Loading indicator states for modal save buttons
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false)
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false)

  // Branch Modals & Form
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: '', code: '', location: '' })

  // Brand Modals & Form
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [brandForm, setBrandForm] = useState({ name: '', code: '', description: '' })

  const loadData = async () => {
    setLoading(true)
    try {
      const [brandRes, branchRes] = await Promise.all([getBrands(), getBranches()])
      if (brandRes.data?.success) setBrands(brandRes.data.brands || [])
      if (branchRes.data?.success) setBranches(branchRes.data.branches || [])
    } catch (e) {
      console.error('Error loading brand/branch data:', e)
      toast.error('Failed to fetch brands and branches.')
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

    setIsSubmittingBranch(true)
    try {
      if (editingBranchId) {
        const res = await updateBranch(editingBranchId, branchForm)
        if (res.data?.success) {
          toast.success(`Branch "${res.data.branch.name}" updated successfully.`)
          closeBranchModal()
          loadData()
          window.dispatchEvent(new Event('branch_changed'))
        }
      } else {
        const res = await createBranch(branchForm)
        if (res.data?.success) {
          toast.success(`Branch "${res.data.branch.name}" created successfully.`)
          closeBranchModal()
          loadData()
          window.dispatchEvent(new Event('branch_changed'))
        }
      }
    } catch (err: any) {
      console.error('Save branch error:', err)
      toast.error(err.response?.data?.error || 'Failed to save branch.')
    } finally {
      setIsSubmittingBranch(false)
    }
  }

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandForm.name) {
      toast.error('Brand Name is required.')
      return
    }

    setIsSubmittingBrand(true)
    try {
      if (editingBrandId) {
        const res = await updateBrand(editingBrandId, brandForm)
        if (res.data?.success) {
          toast.success(`Brand "${res.data.brand.name}" updated successfully.`)
          closeBrandModal()
          loadData()
        }
      } else {
        const res = await createBrand(brandForm)
        if (res.data?.success) {
          toast.success(`Brand "${res.data.brand.name}" registered successfully.`)
          closeBrandModal()
          loadData()
        }
      }
    } catch (err: any) {
      console.error('Save brand error:', err)
      toast.error(err.response?.data?.error || 'Failed to save brand.')
    } finally {
      setIsSubmittingBrand(false)
    }
  }

  const handleBranchDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete branch "${name}"?`)) return
    try {
      const res = await deleteBranch(id)
      if (res.data?.success) {
        toast.success(`Branch "${name}" deleted successfully.`)
        loadData()
        window.dispatchEvent(new Event('branch_changed'))
      }
    } catch (err: any) {
      console.error('Delete branch error:', err)
      toast.error(err.response?.data?.error || 'Failed to delete branch.')
    }
  }

  const handleBrandDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete brand "${name}"?`)) return
    try {
      const res = await deleteBrand(id)
      if (res.data?.success) {
        toast.success(`Brand "${name}" deleted successfully.`)
        loadData()
      }
    } catch (err: any) {
      console.error('Delete brand error:', err)
      toast.error(err.response?.data?.error || 'Failed to delete brand.')
    }
  }

  const startEditBranch = (b: BranchRecord) => {
    setBranchForm({ name: b.name, code: b.code, location: b.location })
    setEditingBranchId(b.id)
    setShowBranchModal(true)
  }

  const startEditBrand = (br: BrandRecord) => {
    setBrandForm({ name: br.name, code: br.code, description: br.description })
    setEditingBrandId(br.id)
    setShowBrandModal(true)
  }

  const closeBranchModal = () => {
    setShowBranchModal(false)
    setEditingBranchId(null)
    setBranchForm({ name: '', code: '', location: '' })
  }

  const closeBrandModal = () => {
    setShowBrandModal(false)
    setEditingBrandId(null)
    setBrandForm({ name: '', code: '', description: '' })
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Brands &amp; Branches Directory</PageTitle>
      <Content>
        {/* Navigation Tabs */}
        <div className='d-flex justify-content-between align-items-center mb-6 flex-wrap gap-4'>
          <ul className='nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bold'>
            <li className='nav-item'>
              <button
                onClick={() => {
                  setActiveTab('brands')
                  loadData()
                }}
                className={`nav-link text-active-primary py-3 px-4 me-6 border-0 bg-transparent ${
                  activeTab === 'brands' ? 'active' : ''
                }`}
              >
                ⚖️ Weighing Brands
              </button>
            </li>
            <li className='nav-item'>
              <button
                onClick={() => {
                  setActiveTab('branches')
                  loadData()
                }}
                className={`nav-link text-active-primary py-3 px-4 border-0 bg-transparent ${
                  activeTab === 'branches' ? 'active' : ''
                }`}
              >
                🏢 Corporate Branches
              </button>
            </li>
          </ul>

          <div className='d-flex gap-3'>
            {activeTab === 'brands' ? (
              <button onClick={() => setShowBrandModal(true)} className='btn btn-primary fw-bold fs-7 py-2.5 px-4'>
                ➕ Add New Brand
              </button>
            ) : (
              <button onClick={() => setShowBranchModal(true)} className='btn btn-success fw-bold fs-7 py-2.5 px-4'>
                ➕ Onboard New Branch
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className='d-flex align-items-center justify-content-center p-10'>
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading data...</span>
            </div>
          </div>
        )}

        {!loading && activeTab === 'brands' && (
          <div className='row g-6'>
            {brands.length === 0 ? (
              <div className='col-12'>
                <div className='card border-0 shadow-sm p-10 text-center text-muted fs-6 bg-body'>
                  No scale brands registered. Click "Add New Brand" to register one.
                </div>
              </div>
            ) : (
              brands.map((brand) => (
                <div className='col-md-6 col-lg-3 d-flex flex-column' key={brand.id}>
                  <div className='card card-flush h-100 border-0 shadow-sm bg-body hover-elevate-up d-flex flex-column justify-content-between'>
                    <div className='p-7 pb-2 d-flex flex-column'>
                      <div className='d-flex align-items-center mb-2 gap-3'>
                        <span className='fs-1'>⚖️</span>
                        <span className='fs-3 fw-bold text-gray-900'>{brand.name}</span>
                      </div>
                      <span className='badge badge-light-primary align-self-start fw-bold fs-8 px-2 py-0.5'>{brand.code}</span>
                    </div>
                    <div className='card-body pt-2 pb-7 d-flex flex-column justify-content-between h-100'>
                      <p className='text-gray-600 fs-7 line-clamp-3 mb-5'>
                        {brand.description || 'Precision weighing instruments manufacturer.'}
                      </p>
                      <div className='d-flex gap-2 pt-3 border-top border-gray-150'>
                        <button onClick={() => startEditBrand(brand)} className='btn btn-xs btn-light-primary fw-bold py-1 px-3 fs-8'>
                          Edit
                        </button>
                        <button onClick={() => handleBrandDelete(brand.id, brand.name)} className='btn btn-xs btn-light-danger fw-bold py-1 px-3 fs-8'>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'branches' && (
          <div className='row g-6'>
            {branches.length === 0 ? (
              <div className='col-12'>
                <div className='card border-0 shadow-sm p-10 text-center text-muted fs-6 bg-body'>
                  No corporate branches registered. Click "Onboard New Branch" to register one.
                </div>
              </div>
            ) : (
              branches.map((branch) => (
                <div className='col-md-6 col-lg-4' key={branch.id}>
                  <div className='card card-flush border-0 shadow-sm bg-body hover-elevate-up d-flex flex-column justify-content-between h-100'>
                    <div className='p-6 pb-2 d-flex flex-column'>
                      <span className='fs-3 fw-bold text-gray-900 mb-2'>{branch.name}</span>
                      <span className='badge badge-light-success fw-bold px-2 py-0.5 fs-8 align-self-start'>{branch.code}</span>
                    </div>
                    <div className='card-body pb-6 d-flex flex-column justify-content-between h-100'>
                      <div className='d-flex align-items-center gap-2 text-gray-600 fs-7 mb-5'>
                        <span>📍</span>
                        <span>{branch.location || 'No location address listed.'}</span>
                      </div>
                      <div className='d-flex gap-2 pt-3 border-top border-gray-150'>
                        <button onClick={() => startEditBranch(branch)} className='btn btn-xs btn-light-success fw-bold py-1 px-3 fs-8'>
                          Edit
                        </button>
                        <button onClick={() => handleBranchDelete(branch.id, branch.name)} className='btn btn-xs btn-light-danger fw-bold py-1 px-3 fs-8'>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal: Create / Edit Branch */}
        {showBranchModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content border-0 shadow-lg rounded bg-body'>
                <div className='modal-header border-0 pt-5 px-6'>
                  <h5 className='modal-title fw-bold fs-3 text-gray-900'>
                    {editingBranchId ? '🏢 Edit Branch' : '🏢 Create Branch'}
                  </h5>
                  <button type='button' className='btn-close' onClick={closeBranchModal}></button>
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
                        disabled={isSubmittingBranch}
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
                        disabled={isSubmittingBranch}
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
                        disabled={isSubmittingBranch}
                      />
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-5 px-6 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={closeBranchModal} disabled={isSubmittingBranch}>Cancel</button>
                    <button type='submit' className='btn btn-success fw-bold fs-7' disabled={isSubmittingBranch}>
                      {!isSubmittingBranch ? (
                        'Save Branch'
                      ) : (
                        <span className='indicator-progress' style={{ display: 'block' }}>
                          Please wait...
                          <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create / Edit Brand */}
        {showBrandModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content border-0 shadow-lg rounded bg-body'>
                <div className='modal-header border-0 pt-5 px-6'>
                  <h5 className='modal-title fw-bold fs-3 text-gray-900'>
                    {editingBrandId ? '⚖️ Edit Brand' : '⚖️ Register Brand'}
                  </h5>
                  <button type='button' className='btn-close' onClick={closeBrandModal}></button>
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
                        disabled={isSubmittingBrand}
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
                        disabled={isSubmittingBrand}
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
                        disabled={isSubmittingBrand}
                      />
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-5 px-6 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={closeBrandModal} disabled={isSubmittingBrand}>Cancel</button>
                    <button type='submit' className='btn btn-primary fw-bold fs-7' disabled={isSubmittingBrand}>
                      {!isSubmittingBrand ? (
                        'Save Brand'
                      ) : (
                        <span className='indicator-progress' style={{ display: 'block' }}>
                          Please wait...
                          <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                        </span>
                      )}
                    </button>
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

export default BrandsPage
