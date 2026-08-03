import { FC, useState, useEffect, useMemo } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { KTIcon } from '../../../_metronic/helpers'
import { useAuth } from '../auth'
import { getUsers, createUser, updateUser, deleteUser } from '../auth/core/_requests'
import { UserModel } from '../auth/core/_models'

interface ModuleOption {
  key: string
  label: string
  icon: string
}

const MODULE_OPTIONS: ModuleOption[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'element-11' },
  { key: 'brands', label: 'Brands & Branches', icon: 'geolocation' },
  { key: 'oif', label: 'OIF (Order Intimation)', icon: 'briefcase' },
  { key: 'electronics', label: 'Electronics Material', icon: 'cpu' },
  { key: 'qc', label: 'QC Test Reports', icon: 'shield-tick' },
  { key: 'calibration', label: 'Calibration Lab', icon: 'award' },
  { key: 'amc', label: 'Service & AMC', icon: 'wrench' },
  { key: 'purchase', label: 'Purchase Requisitions', icon: 'basket' },
  { key: 'store', label: 'Store & Inventory', icon: 'archive' },
  { key: 'users', label: 'User Management', icon: 'profile-user' }
]

const ROLE_PERMISSIONS_PRESETS: Record<string, string[]> = {
  admin: MODULE_OPTIONS.map((m) => m.key),
  manager: ['dashboard', 'qc', 'calibration', 'amc', 'purchase', 'store'],
  rnd: ['dashboard', 'qc', 'calibration', 'electronics'],
  service: ['dashboard', 'amc', 'calibration'],
  accounts: ['dashboard', 'purchase'],
  store: ['dashboard', 'store'],
  custom: ['dashboard']
}

interface RoleConfig {
  key: string
  label: string
  icon: string
  badgeClass: string
  description: string
}

const ROLES_CONFIG: RoleConfig[] = [
  { key: 'admin', label: 'Admin', icon: 'crown', badgeClass: 'badge-light-primary', description: 'Full access to all modules' },
  { key: 'manager', label: 'Manager', icon: 'chart-simple', badgeClass: 'badge-light-info', description: 'Dashboard + Reports & AMC' },
  { key: 'rnd', label: 'R&D', icon: 'technology', badgeClass: 'badge-light-success', description: 'QC, Calibration & Electronics' },
  { key: 'service', label: 'Service', icon: 'wrench', badgeClass: 'badge-light-warning', description: 'AMC & Calibration Lab' },
  { key: 'accounts', label: 'Accounts', icon: 'bank', badgeClass: 'badge-light-danger', description: 'Purchase Requisitions' },
  { key: 'store', label: 'Store', icon: 'archive', badgeClass: 'badge-light-dark', description: 'Store & Inventory Management' }
]

const UserManagementPage: FC = () => {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<UserModel[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingUser, setEditingUser] = useState<UserModel | null>(null)
  const [modalName, setModalName] = useState<string>('')
  const [modalEmail, setModalEmail] = useState<string>('')
  const [modalPassword, setModalPassword] = useState<string>('')
  const [showModalPassword, setShowModalPassword] = useState<boolean>(false)
  const [modalRole, setModalRole] = useState<string>('admin')
  const [modalDepartment, setModalDepartment] = useState<string>('Administration')
  const [modalPermissions, setModalPermissions] = useState<string[]>(ROLE_PERMISSIONS_PRESETS['admin'])
  const [modalSaving, setModalSaving] = useState<boolean>(false)

  const fetchUsersList = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await getUsers()
      if (res.data.success) {
        setUsers(res.data.users)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.response?.data?.error || 'Failed to fetch users list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsersList()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  const handleOpenAddModal = () => {
    setEditingUser(null)
    setModalName('')
    setModalEmail('')
    setModalPassword('')
    setShowModalPassword(false)
    setModalRole('admin')
    setModalDepartment('Administration')
    setModalPermissions(ROLE_PERMISSIONS_PRESETS['admin'])
    setShowModal(true)
  }

  const handleOpenEditModal = (user: UserModel) => {
    setEditingUser(user)
    setModalName(user.name)
    setModalEmail(user.email)
    setModalPassword('')
    setShowModalPassword(false)
    setModalRole(user.role || 'custom')
    setModalDepartment(user.department || 'Administration')
    setModalPermissions(user.permissions || ROLE_PERMISSIONS_PRESETS[user.role] || ROLE_PERMISSIONS_PRESETS['admin'])
    setShowModal(true)
  }

  const handleRoleChange = (roleKey: string) => {
    setModalRole(roleKey)
    if (ROLE_PERMISSIONS_PRESETS[roleKey]) {
      setModalPermissions(ROLE_PERMISSIONS_PRESETS[roleKey])
    }
  }

  const handlePermissionToggle = (permissionKey: string) => {
    let updated: string[]
    if (modalPermissions.includes(permissionKey)) {
      updated = modalPermissions.filter((p) => p !== permissionKey)
    } else {
      updated = [...modalPermissions, permissionKey]
    }
    setModalPermissions(updated)
    setModalRole('custom')
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload: Partial<UserModel> = {
        name: modalName,
        email: modalEmail,
        role: modalRole,
        department: modalDepartment,
        permissions: modalPermissions
      }

      if (modalPassword) {
        payload.password = modalPassword
      }

      if (editingUser) {
        const res = await updateUser(editingUser.id, payload)
        if (res.data.success) {
          setSuccessMsg('User permissions updated successfully.')
          setShowModal(false)
          fetchUsersList()
        }
      } else {
        if (!modalPassword) {
          alert('Password is required for new user.')
          setModalSaving(false)
          return
        }
        const res = await createUser(payload)
        if (res.data.success) {
          setSuccessMsg('New user created successfully.')
          setShowModal(false)
          fetchUsersList()
        }
      }
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Error saving user.')
    } finally {
      setModalSaving(false)
    }
  }

  const handleDeleteUserClick = async (user: UserModel) => {
    if (!window.confirm(`Are you sure you want to remove user "${user.name}"?`)) return
    try {
      const res = await deleteUser(user.id)
      if (res.data.success) {
        setSuccessMsg('User removed successfully.')
        fetchUsersList()
      }
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to delete user.')
    }
  }

  const getRoleConfig = (roleKey: string) => {
    return ROLES_CONFIG.find((r) => r.key === roleKey) || {
      key: 'custom',
      label: 'Custom',
      icon: 'setting-2',
      badgeClass: 'badge-light-dark',
      description: 'Custom Granular Permissions'
    }
  }

  return (
    <div className='d-flex flex-column gap-7'>
      {/* ── Status Alerts ── */}
      {successMsg && (
        <div className='alert alert-dismissible bg-light-success border border-success d-flex align-items-center p-5 rounded-3 mb-0'>
          <KTIcon iconName='check-circle' className='fs-2hx text-success me-4' />
          <div className='d-flex flex-column'>
            <h5 className='mb-1 text-success fw-bolder'>Success</h5>
            <span className='fw-semibold text-gray-800'>{successMsg}</span>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className='alert alert-dismissible bg-light-danger border border-danger d-flex align-items-center p-5 rounded-3 mb-0'>
          <KTIcon iconName='information-5' className='fs-2hx text-danger me-4' />
          <div className='d-flex flex-column'>
            <h5 className='mb-1 text-danger fw-bolder'>Error</h5>
            <span className='fw-semibold text-gray-800'>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* ── Metronic Access Levels Cards Section ── */}
      <div className='row g-6 g-xl-9'>
        {ROLES_CONFIG.map((rConfig) => {
          const userCount = users.filter((u) => u.role === rConfig.key).length
          return (
            <div key={rConfig.key} className='col-md-6 col-xl-4'>
              <div className='card card-flush h-md-100 shadow-sm border-0'>
                <div className='card-header pt-5'>
                  <div className='card-title d-flex flex-column'>
                    <div className='d-flex align-items-center mb-2'>
                      <span className={`badge ${rConfig.badgeClass} p-3 rounded me-3`}>
                        <KTIcon iconName={rConfig.icon} className='fs-2' />
                      </span>
                      <span className='fs-2 fw-bolder text-gray-800'>{rConfig.label}</span>
                    </div>
                    <span className='text-gray-500 fw-semibold fs-7 mt-1'>{rConfig.description}</span>
                  </div>
                </div>

                <div className='card-body pt-1 pb-5 d-flex align-items-end justify-content-between'>
                  <div className='d-flex flex-column'>
                    <span className='fs-3 fw-bold text-gray-800 me-2'>{userCount}</span>
                    <span className='text-gray-400 fw-semibold fs-8'>Assigned Users</span>
                  </div>
                  <button
                    type='button'
                    className='btn btn-sm btn-light-primary btn-active-light'
                    onClick={() => setRoleFilter(rConfig.key)}
                  >
                    Filter Users
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Metronic Users Table Card ── */}
      <div className='card card-flush shadow-sm border-0'>
        {/* Card Header Toolbar */}
        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
          {/* Card Search & Filters */}
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1 me-4'>
              <KTIcon iconName='magnifier' className='fs-1 position-absolute ms-4' />
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-12'
                placeholder='Search Users...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className='form-select form-select-solid w-175px'
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value='all'>All Roles</option>
              <option value='admin'>Admin</option>
              <option value='manager'>Manager</option>
              <option value='rnd'>R&D</option>
              <option value='service'>Service</option>
              <option value='accounts'>Accounts</option>
              <option value='store'>Store</option>
              <option value='custom'>Custom</option>
            </select>
          </div>

          {/* Card Actions */}
          <div className='card-toolbar'>
            <button
              type='button'
              className='btn btn-primary d-flex align-items-center gap-2'
              onClick={handleOpenAddModal}
            >
              <KTIcon iconName='plus' className='fs-2' /> Add User
            </button>
          </div>
        </div>

        {/* Card Body Table */}
        <div className='card-body pt-0'>
          {loading ? (
            <div className='d-flex align-items-center justify-content-center p-10'>
              <span className='spinner-border text-primary me-3'></span>
              <span className='fw-semibold text-gray-700 fs-6'>Loading Users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className='text-center text-muted p-10 fs-6'>No users found.</div>
          ) : (
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
                <thead>
                  <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
                    <th className='min-w-200px'>User</th>
                    <th className='min-w-125px'>Department</th>
                    <th className='min-w-125px'>Role</th>
                    <th className='min-w-250px'>Module Access</th>
                    <th className='min-w-100px'>Status</th>
                    <th className='text-end min-w-100px'>Actions</th>
                  </tr>
                </thead>
                <tbody className='text-gray-600 fw-semibold'>
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUser?.id
                    const rConfig = getRoleConfig(user.role || 'custom')
                    const firstLetter = (user.name || 'U').charAt(0).toUpperCase()
                    const perms = user.permissions || []

                    return (
                      <tr key={user.id}>
                        {/* User Profile */}
                        <td className='d-flex align-items-center'>
                          <div className='symbol symbol-circle symbol-50px overflow-hidden me-3'>
                            <div className='symbol-label bg-light-primary text-primary fw-bolder fs-4'>
                              {firstLetter}
                            </div>
                          </div>
                          <div className='d-flex flex-column'>
                            <div className='text-gray-800 text-hover-primary fs-6 fw-bolder d-flex align-items-center gap-2'>
                              {user.name}
                              {isSelf && (
                                <span className='badge badge-light-primary fw-bold fs-8 px-2 py-1'>
                                  You
                                </span>
                              )}
                            </div>
                            <span className='text-muted fs-7'>{user.email}</span>
                          </div>
                        </td>

                        {/* Department */}
                        <td>
                          <span className='text-gray-800 fw-bold fs-7'>
                            {user.department || 'Administration'}
                          </span>
                        </td>

                        {/* Role Badge */}
                        <td>
                          <span className={`badge ${rConfig.badgeClass} fw-bold px-3 py-2 fs-7`}>
                            {rConfig.label}
                          </span>
                        </td>

                        {/* Module Access */}
                        <td>
                          {user.role === 'admin' ? (
                            <span className='badge badge-light-primary fw-bold fs-7'>
                              Full Access to All Modules
                            </span>
                          ) : perms.length === 0 ? (
                            <span className='badge badge-light-danger fw-bold fs-8'>No Modules Assigned</span>
                          ) : (
                            <div className='d-flex flex-wrap gap-1'>
                              {perms.map((pKey) => {
                                const mod = MODULE_OPTIONS.find((m) => m.key === pKey)
                                return (
                                  <span key={pKey} className='badge badge-light fw-semibold fs-8 px-2 py-1'>
                                    {mod ? mod.label.split(' ')[0] : pKey}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <span className='badge badge-light-success fw-bold px-3 py-2'>
                            Active
                          </span>
                        </td>

                        {/* Actions */}
                        <td className='text-end'>
                          <button
                            type='button'
                            className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                            title='Edit User Permissions'
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <KTIcon iconName='pencil' className='fs-3' />
                          </button>

                          {!isSelf && (
                            <button
                              type='button'
                              className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                              title='Remove User'
                              onClick={() => handleDeleteUserClick(user)}
                            >
                              <KTIcon iconName='trash' className='fs-3' />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Metronic Add / Edit User Modal ── */}
      {showModal && (
        <div
          className='modal fade show d-block'
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className='modal-dialog modal-dialog-centered modal-lg'>
            <div className='modal-content rounded'>
              {/* Modal Header */}
              <div className='modal-header border-0 pb-0 justify-content-between pt-6 px-7'>
                <h2 className='fw-bolder text-gray-900 mb-0'>
                  {editingUser ? `Edit User: ${editingUser.name}` : 'Add New User'}
                </h2>
                <div
                  className='btn btn-sm btn-icon btn-active-color-primary'
                  onClick={() => setShowModal(false)}
                >
                  <KTIcon iconName='cross' className='fs-1' />
                </div>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveUser}>
                <div className='modal-body scroll-y px-7 py-6 d-flex flex-column gap-6'>
                  {/* Basic Inputs */}
                  <div className='row g-6'>
                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-bold mb-2'>Full Name</label>
                      <input
                        type='text'
                        className='form-control form-control-solid'
                        placeholder='Enter full name'
                        value={modalName}
                        onChange={(e) => setModalName(e.target.value)}
                        required
                      />
                    </div>

                    <div className='col-md-6 fv-row'>
                      <label className='required fs-6 fw-bold mb-2'>Email Address</label>
                      <input
                        type='email'
                        className='form-control form-control-solid'
                        placeholder='user@company.com'
                        value={modalEmail}
                        onChange={(e) => setModalEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className='row g-6'>
                    <div className='col-md-6 fv-row position-relative'>
                      <label className={`fs-6 fw-bold mb-2 ${!editingUser ? 'required' : ''}`}>
                        Password {editingUser && <span className='text-muted fs-8 fw-normal'>(Leave blank to keep unchanged)</span>}
                      </label>
                      <div className='position-relative'>
                        <input
                          type={showModalPassword ? 'text' : 'password'}
                          className='form-control form-control-solid pe-12'
                          placeholder='Enter account password'
                          value={modalPassword}
                          onChange={(e) => setModalPassword(e.target.value)}
                          required={!editingUser}
                        />
                        <span
                          className='btn btn-sm btn-icon position-absolute translate-middle-y top-50 end-0 me-2'
                          onClick={() => setShowModalPassword((prev) => !prev)}
                          title={showModalPassword ? 'Hide Password' : 'Show Password'}
                          style={{ cursor: 'pointer', zIndex: 5 }}
                        >
                          <KTIcon iconName={showModalPassword ? 'eye-slash' : 'eye'} className='fs-2 text-gray-500' />
                        </span>
                      </div>
                    </div>

                    <div className='col-md-6 fv-row'>
                      <label className='fs-6 fw-bold mb-2'>Department</label>
                      <select
                        className='form-select form-select-solid'
                        value={modalDepartment}
                        onChange={(e) => setModalDepartment(e.target.value)}
                      >
                        <option value='Administration'>Administration</option>
                        <option value='Management'>Management</option>
                        <option value='R&D'>R&D</option>
                        <option value='Service & Support'>Service & Support</option>
                        <option value='Accounts & Finance'>Accounts & Finance</option>
                        <option value='Store & Operations'>Store & Operations</option>
                      </select>
                    </div>
                  </div>

                  {/* Preset Role Radio Cards */}
                  <div>
                    <label className='fs-6 fw-bold mb-3 d-block'>Assign Role Preset</label>
                    <div className='row g-4'>
                      {ROLES_CONFIG.map((rConfig) => {
                        const isSelected = modalRole === rConfig.key
                        return (
                          <div key={rConfig.key} className='col-6 col-md-4'>
                            <div
                              className={`card card-dashed p-4 cursor-pointer text-start transition-all ${
                                isSelected ? 'border-primary bg-light-primary' : 'border-gray-300'
                              }`}
                              onClick={() => handleRoleChange(rConfig.key)}
                            >
                              <div className='d-flex align-items-center mb-1'>
                                <KTIcon iconName={rConfig.icon} className='fs-2 text-primary me-2' />
                                <span className='fw-bolder fs-6 text-gray-800'>{rConfig.label}</span>
                              </div>
                              <span className='text-muted fs-8'>{rConfig.description}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Granular Permissions Checklist */}
                  <div>
                    <label className='fs-6 fw-bold mb-3 d-flex align-items-center justify-content-between'>
                      <span>Allowed Module Permissions</span>
                      <span className='text-muted fs-8 fw-normal'>Toggle to grant custom access</span>
                    </label>

                    <div className='bg-light rounded p-5 row g-4 m-0 border border-dashed border-gray-300'>
                      {MODULE_OPTIONS.map((mod) => {
                        const isChecked = modalPermissions.includes(mod.key)
                        return (
                          <div key={mod.key} className='col-6 col-md-6'>
                            <div className='form-check form-check-custom form-check-solid gap-3 align-items-center'>
                              <input
                                className='form-check-input h-20px w-20px'
                                type='checkbox'
                                id={`perm-${mod.key}`}
                                checked={isChecked}
                                onChange={() => handlePermissionToggle(mod.key)}
                              />
                              <label
                                className='form-check-label fw-bold text-gray-800 fs-7 cursor-pointer d-flex align-items-center gap-2'
                                htmlFor={`perm-${mod.key}`}
                              >
                                <KTIcon iconName={mod.icon} className='fs-5 text-primary' />
                                {mod.label}
                              </label>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className='modal-footer border-0 pt-0 pb-6 px-7 d-flex justify-content-end gap-3'>
                  <button
                    type='button'
                    className='btn btn-light me-3'
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type='submit'
                    className='btn btn-primary fw-bold'
                    disabled={modalSaving}
                  >
                    {modalSaving ? (
                      <span className='indicator-progress d-flex align-items-center gap-2'>
                        <span className='spinner-border spinner-border-sm align-middle'></span>
                        Saving...
                      </span>
                    ) : editingUser ? (
                      'Update User'
                    ) : (
                      'Create User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const UserManagementPageWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>User Management & Access Control</PageTitle>
      <Content>
        <UserManagementPage />
      </Content>
    </>
  )
}

export { UserManagementPageWrapper }
