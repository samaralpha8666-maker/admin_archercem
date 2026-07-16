import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { getTenants, createTenant, createTenantAdmin, getTenantAdmins } from '../auth/core/_requests'
import { TenantModel } from '../auth/core/_models'

const TenantsPage: FC = () => {
  const [tenants, setTenants] = useState<TenantModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal & Form state
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [plan, setPlan] = useState('standard')
  const [logo, setLogo] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Add Admin Modal state
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [selectedTenantForAdmin, setSelectedTenantForAdmin] = useState<TenantModel | null>(null)
  const [adminNameInput, setAdminNameInput] = useState('')
  const [adminEmailInput, setAdminEmailInput] = useState('')
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [adminFormError, setAdminFormError] = useState<string | null>(null)
  const [adminSubmitting, setAdminSubmitting] = useState(false)
  const [adminSuccessMessage, setAdminSuccessMessage] = useState<string | null>(null)

  // View Admins Modal state
  const [showViewAdminsModal, setShowViewAdminsModal] = useState(false)
  const [selectedTenantForViewAdmins, setSelectedTenantForViewAdmins] = useState<TenantModel | null>(null)
  const [viewingAdmins, setViewingAdmins] = useState<any[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [viewAdminsError, setViewAdminsError] = useState<string | null>(null)

  const fetchTenants = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getTenants()
      if (response?.data?.success) {
        setTenants(response.data.data.tenants || [])
      } else {
        setError('Failed to fetch tenants.')
      }
    } catch (e: any) {
      console.error(e)
      setError(e.response?.data?.error || 'An error occurred while fetching tenants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminFormError(null)
    setAdminSuccessMessage(null)

    if (!selectedTenantForAdmin) return

    if (!adminNameInput || !adminEmailInput || !adminPasswordInput) {
      setAdminFormError('All fields are required.')
      return
    }

    setAdminSubmitting(true)
    try {
      const response = await createTenantAdmin(selectedTenantForAdmin.id, {
        name: adminNameInput,
        email: adminEmailInput,
        password: adminPasswordInput
      })

      if (response.data.success) {
        setAdminSuccessMessage(`Admin added successfully to ${selectedTenantForAdmin.name}!`)
        // Reset fields
        setAdminNameInput('')
        setAdminEmailInput('')
        setAdminPasswordInput('')
        // Close modal after 1.5 seconds automatically
        setTimeout(() => {
          setShowAdminModal(false)
          setAdminSuccessMessage(null)
        }, 1500)
      } else {
        setAdminFormError('Failed to add admin.')
      }
    } catch (e: any) {
      setAdminFormError(e.response?.data?.error || 'An error occurred while adding the admin.')
    } finally {
      setAdminSubmitting(false)
    }
  }

  const fetchTenantAdmins = async (tenantId: number | string) => {
    setLoadingAdmins(true)
    setViewAdminsError(null)
    try {
      const response = await getTenantAdmins(tenantId)
      if (response?.data?.success) {
        setViewingAdmins(response.data.admins || [])
      } else {
        setViewAdminsError('Failed to load admins.')
      }
    } catch (e: any) {
      setViewAdminsError(e.response?.data?.error || 'An error occurred while loading admins.')
    } finally {
      setLoadingAdmins(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!name || !subdomain) {
      setFormError('Tenant Name and Subdomain are required.')
      return
    }

    if (adminEmail || adminPassword || adminName) {
      if (!adminEmail || !adminPassword || !adminName) {
        setFormError('Admin Name, Email, and Password are all required to setup a company admin.')
        return
      }
    }

    setSubmitting(true)
    try {
      const response = await createTenant({
        name,
        subdomain,
        settings: { plan },
        adminName: adminName || undefined,
        adminEmail: adminEmail || undefined,
        adminPassword: adminPassword || undefined,
        logo: logo || undefined
      })
      if (response.data.success) {
        setShowModal(false)
        setName('')
        setSubdomain('')
        setPlan('standard')
        setLogo('')
        setAdminName('')
        setAdminEmail('')
        setAdminPassword('')
        fetchTenants()
      } else {
        setFormError('Failed to create tenant.')
      }
    } catch (e: any) {
      console.error(e)
      setFormError(e.response?.data?.error || 'An error occurred during tenant onboarding.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className='d-flex flex-wrap flex-stack mb-6'>
        <h3 className='fw-bolder my-2'>Tenant Isolation Management</h3>
        <div className='d-flex my-2'>
          <button
            onClick={() => setShowModal(true)}
            className='btn btn-primary btn-sm fw-bold'
          >
            <i className='bi bi-plus-lg fs-5 me-2'></i> Onboard New Tenant
          </button>
        </div>
      </div>

      <div className='card mb-5 mb-xl-8'>
        <div className='card-header border-0 pt-5'>
          <h3 className='card-title align-items-start flex-column'>
            <span className='card-label fw-bolder fs-3 mb-1'>Registered Tenants</span>
            <span className='text-muted mt-1 fw-bold fs-7'>Isolated PostgreSQL schemas in database</span>
          </h3>
        </div>

        <div className='card-body py-3'>
          {loading && (
            <div className='d-flex align-items-center justify-content-center p-10'>
              <span className='spinner-border spinner-border-sm align-middle me-2'></span>
              Loading tenants...
            </div>
          )}

          {error && (
            <div className='alert alert-danger d-flex align-items-center p-5 rounded mb-10'>
              <div className='d-flex flex-column'>
                <span className='fw-bold'>{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && tenants.length === 0 && (
            <div className='text-center text-muted p-10'>
              No tenants registered yet. Click "Onboard New Tenant" to add one.
            </div>
          )}

          {!loading && !error && tenants.length > 0 && (
            <div className='table-responsive'>
              <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                <thead>
                  <tr className='fw-bolder text-muted'>
                    <th className='min-w-150px'>Tenant Name</th>
                    <th className='min-w-140px'>Subdomain</th>
                    <th className='min-w-120px'>Schema Name</th>
                    <th className='min-w-100px text-end'>Status</th>
                    <th className='min-w-100px text-end'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td>
                        <div className='d-flex align-items-center'>
                          <div className='symbol symbol-45px me-5'>
                            {tenant.settings?.logo ? (
                              <img src={tenant.settings.logo} alt={tenant.name} className='symbol-label p-1' style={{ objectFit: 'contain', background: '#fff' }} />
                            ) : (
                              <span className='symbol-label bg-light-primary text-primary fw-bolder fs-4'>
                                {tenant.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className='d-flex flex-column'>
                            <span className='text-gray-900 fw-bolder fs-6'>
                              {tenant.name}
                            </span>
                            <span className='text-muted fw-bold fs-7'>
                              Plan: {tenant.settings?.plan || 'standard'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className='text-gray-900 fw-bold d-block fs-6'>
                          {tenant.subdomain}
                        </span>
                        <span className='text-muted fs-7'>
                          {tenant.subdomain}.localhost:3011
                        </span>
                      </td>
                      <td>
                        <code className='text-primary fw-semibold fs-7'>
                          {tenant.schema_name || `tenant_${tenant.subdomain}`}
                        </code>
                      </td>
                      <td className='text-end'>
                        <span className='badge badge-light-success fw-bold px-4 py-2 fs-8'>
                          Active
                        </span>
                      </td>
                      <td className='text-end'>
                        <div className='d-flex justify-content-end gap-2'>
                          <button
                            className='btn btn-light-info btn-sm fw-bold'
                            onClick={() => {
                              setSelectedTenantForViewAdmins(tenant)
                              setViewingAdmins([])
                              setViewAdminsError(null)
                              setShowViewAdminsModal(true)
                              fetchTenantAdmins(tenant.id)
                            }}
                          >
                            <i className='bi bi-eye fs-6 me-1'></i> View Admins
                          </button>
                          <button
                            className='btn btn-light-primary btn-sm fw-bold'
                            onClick={() => {
                              setSelectedTenantForAdmin(tenant)
                              setAdminNameInput('')
                              setAdminEmailInput('')
                              setAdminPasswordInput('')
                              setAdminFormError(null)
                              setAdminSuccessMessage(null)
                              setShowAdminModal(true)
                            }}
                          >
                            <i className='bi bi-person-plus fs-6 me-1'></i> Add Admin
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Modal */}
      {showModal && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
          <div className='modal-dialog modal-dialog-centered mw-650px'>
            <div className='modal-content rounded'>
              <div className='modal-header pb-0 border-0 justify-content-end'>
                <button
                  type='button'
                  className='btn btn-sm btn-icon btn-active-color-primary'
                  onClick={() => setShowModal(false)}
                >
                  <i className='bi bi-x-lg fs-4'></i>
                </button>
              </div>

              <div className='modal-body scroll-y px-10 px-lg-15 pt-0 pb-15'>
                <form onSubmit={handleSubmit} className='form'>
                  <div className='mb-13 text-center'>
                    <h1 className='mb-3'>Onboard a New Tenant</h1>
                    <div className='text-muted fw-bold fs-5'>
                      Create a dynamically isolated schema for data privacy.
                    </div>
                  </div>

                  {formError && (
                    <div className='alert alert-danger d-flex align-items-center p-4 rounded mb-5'>
                      <span className='fw-bold fs-7'>{formError}</span>
                    </div>
                  )}

                  <div className='d-flex flex-column mb-8 fv-row'>
                    <label className='d-flex align-items-center fs-6 fw-bold mb-2 required'>
                      Tenant Name
                    </label>
                    <input
                      type='text'
                      className='form-control form-control-solid'
                      placeholder='Enter tenant name (e.g., Acme Inc)'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className='d-flex flex-column mb-8 fv-row'>
                    <label className='d-flex align-items-center fs-6 fw-bold mb-2 required'>
                      Subdomain
                    </label>
                    <input
                      type='text'
                      className='form-control form-control-solid'
                      placeholder='Enter subdomain (e.g., acme)'
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    />
                    <div className='text-muted fs-7 mt-1'>
                      Only lowercase alphanumeric characters. Used to identify the tenant.
                    </div>
                  </div>

                  <div className='d-flex flex-column mb-8 fv-row'>
                    <label className='d-flex align-items-center fs-6 fw-bold mb-2'>
                      Logo Image URL
                    </label>
                    <input
                      type='text'
                      className='form-control form-control-solid'
                      placeholder='Enter logo image URL (e.g., https://example.com/logo.png)'
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                    />
                  </div>

                  <div className='d-flex flex-column mb-8 fv-row'>
                    <label className='d-flex align-items-center fs-6 fw-bold mb-2'>
                      Pricing Plan
                    </label>
                    <select
                      className='form-select form-control-solid'
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                    >
                      <option value='standard'>Standard Plan</option>
                      <option value='premium'>Premium Plan</option>
                      <option value='enterprise'>Enterprise Plan</option>
                    </select>
                  </div>

                  {/* Company Admin Details Section */}
                  <div className='border-top pt-6 mt-8 mb-8'>
                    <h4 className='text-gray-900 fw-bold mb-5'>Default Company Admin Setup</h4>
                    <div className='text-muted fs-7 mb-6'>
                      These details will be used to create the default administrative user account inside the isolated database schema.
                    </div>

                    <div className='d-flex flex-column mb-8 fv-row'>
                      <label className='d-flex align-items-center fs-6 fw-bold mb-2'>
                        Admin Full Name
                      </label>
                      <input
                        type='text'
                        className='form-control form-control-solid'
                        placeholder='Enter admin name (e.g., John Doe)'
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                      />
                    </div>

                    <div className='d-flex flex-column mb-8 fv-row'>
                      <label className='d-flex align-items-center fs-6 fw-bold mb-2'>
                        Admin Email Address
                      </label>
                      <input
                        type='email'
                        className='form-control form-control-solid'
                        placeholder='Enter admin email (e.g., john@acme.com)'
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                      />
                    </div>

                    <div className='d-flex flex-column mb-8 fv-row'>
                      <label className='d-flex align-items-center fs-6 fw-bold mb-2'>
                        Admin Password
                      </label>
                      <input
                        type='password'
                        className='form-control form-control-solid'
                        placeholder='Enter admin password'
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className='text-center pt-15'>
                    <button
                      type='button'
                      className='btn btn-light me-3'
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='btn btn-primary'
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className='indicator-progress d-flex align-items-center gap-2'>
                          <span className='spinner-border spinner-border-sm align-middle'></span>
                          Provisioning...
                        </span>
                      ) : (
                        'Register Tenant'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAdminModal && selectedTenantForAdmin && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
          <div className='modal-dialog modal-dialog-centered mw-600px'>
            <div className='modal-content rounded'>
              <div className='modal-header pb-0 border-0 justify-content-end'>
                <button
                  type='button'
                  className='btn btn-sm btn-icon btn-active-color-primary'
                  onClick={() => setShowAdminModal(false)}
                  disabled={adminSubmitting}
                >
                  <i className='bi bi-x-lg fs-4'></i>
                </button>
              </div>

              <div className='modal-body scroll-y px-10 px-lg-15 pt-0 pb-15'>
                <form onSubmit={handleAdminSubmit} className='form'>
                  <div className='mb-13 text-center'>
                    <h1 className='mb-3'>Add Company Admin</h1>
                    <div className='text-muted fw-bold fs-5'>
                      Register a new administrator for <span className='text-dark fw-bolder'>{selectedTenantForAdmin.name}</span>.
                    </div>
                  </div>

                  {adminFormError && (
                    <div className='alert alert-danger d-flex align-items-center p-4 rounded mb-5'>
                      <span className='fw-bold fs-7'>{adminFormError}</span>
                    </div>
                  )}

                  {adminSuccessMessage && (
                    <div className='alert alert-success d-flex align-items-center p-4 rounded mb-5'>
                      <span className='fw-bold fs-7'>{adminSuccessMessage}</span>
                    </div>
                  )}

                  <div className='d-flex flex-column mb-8 fv-row'>
                    <label className='d-flex align-items-center fs-6 fw-bold mb-2 required'>
                      Admin Name
                    </label>
                    <input
                      type='text'
                      className='form-control form-control-solid'
                      placeholder='Enter admin name'
                      value={adminNameInput}
                      onChange={(e) => setAdminNameInput(e.target.value)}
                      required
                      disabled={adminSubmitting}
                    />
                  </div>

                  <div className='d-flex flex-column mb-8 fv-row'>
                    <label className='d-flex align-items-center fs-6 fw-bold mb-2 required'>
                      Admin Email
                    </label>
                    <input
                      type='email'
                      className='form-control form-control-solid'
                      placeholder='Enter admin email address'
                      value={adminEmailInput}
                      onChange={(e) => setAdminEmailInput(e.target.value)}
                      required
                      disabled={adminSubmitting}
                    />
                  </div>

                  <div className='d-flex flex-column mb-8 fv-row'>
                    <label className='d-flex align-items-center fs-6 fw-bold mb-2 required'>
                      Admin Password
                    </label>
                    <input
                      type='password'
                      className='form-control form-control-solid'
                      placeholder='Enter admin password (min 6 characters)'
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      required
                      minLength={6}
                      disabled={adminSubmitting}
                    />
                  </div>

                  <div className='text-center pt-15'>
                    <button
                      type='button'
                      className='btn btn-light me-3'
                      onClick={() => setShowAdminModal(false)}
                      disabled={adminSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='btn btn-primary'
                      disabled={adminSubmitting}
                    >
                      {adminSubmitting ? (
                        <span className='indicator-progress d-flex align-items-center gap-2'>
                          <span className='spinner-border spinner-border-sm align-middle'></span>
                          Adding...
                        </span>
                      ) : (
                        'Add Admin'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Admins Modal */}
      {showViewAdminsModal && selectedTenantForViewAdmins && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
          <div className='modal-dialog modal-dialog-centered mw-650px'>
            <div className='modal-content rounded'>
              <div className='modal-header border-0 pb-0 justify-content-between pt-5 px-10'>
                <h3 className='modal-title fw-bolder fs-3'>
                  Admins of {selectedTenantForViewAdmins.name}
                </h3>
                <button
                  type='button'
                  className='btn btn-sm btn-icon btn-active-color-primary'
                  onClick={() => setShowViewAdminsModal(false)}
                >
                  <i className='bi bi-x-lg fs-4'></i>
                </button>
              </div>

              <div className='modal-body px-10 py-8'>
                {loadingAdmins && (
                  <div className='d-flex align-items-center justify-content-center p-10'>
                    <span className='spinner-border spinner-border-sm align-middle me-2'></span>
                    Loading admins...
                  </div>
                )}

                {viewAdminsError && (
                  <div className='alert alert-danger d-flex align-items-center p-4 rounded'>
                    <span className='fw-bold fs-7'>{viewAdminsError}</span>
                  </div>
                )}

                {!loadingAdmins && !viewAdminsError && viewingAdmins.length === 0 && (
                  <div className='text-center text-muted p-10'>
                    No administrators registered for this company yet.
                  </div>
                )}

                {!loadingAdmins && !viewAdminsError && viewingAdmins.length > 0 && (
                  <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
                      <thead>
                        <tr className='fw-bolder text-muted fs-7 text-uppercase border-bottom-1'>
                          <th className='min-w-150px'>Name</th>
                          <th className='min-w-180px'>Email</th>
                          <th className='min-w-100px text-end'>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingAdmins.map((adm) => (
                          <tr key={adm.id}>
                            <td>
                              <span className='text-gray-900 fw-bold fs-6'>{adm.name}</span>
                            </td>
                            <td>
                              <span className='text-muted fw-bold fs-6'>{adm.email}</span>
                            </td>
                            <td className='text-end'>
                              <span className={`badge ${adm.is_active ? 'badge-light-success' : 'badge-light-danger'} fw-bold px-3 py-1 fs-8`}>
                                {adm.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className='modal-footer border-0 justify-content-end pb-5 px-10'>
                <button
                  type='button'
                  className='btn btn-light btn-sm fw-bold'
                  onClick={() => setShowViewAdminsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const TenantsPageWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Tenants Management</PageTitle>
      <Content>
        <TenantsPage />
      </Content>
    </>
  )
}

export { TenantsPageWrapper }
