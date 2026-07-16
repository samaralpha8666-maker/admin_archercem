import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { KTIcon, toAbsoluteUrl } from '../../../helpers'
import { HeaderUserMenu, ThemeModeSwitcher } from '../../../partials'
import { useLayout } from '../../core'
import { useAuth } from '../../../../app/modules/auth'
import { getBranches } from '../../../../app/modules/auth/core/_requests'

const itemClass = 'ms-1 ms-md-4'
const btnIconClass = 'fs-2'
const userAvatarClass = 'symbol-35px'

const Navbar = () => {
  const { config } = useLayout()
  const { currentUser } = useAuth()
  
  const [activeBranch, setActiveBranch] = useState<string>(() => {
    return localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
  })
  const [branches, setBranches] = useState<any[]>([])

  const fetchBranches = async () => {
    try {
      const res = await getBranches()
      if (res.data?.success) {
        setBranches(res.data.branches || [])
      }
    } catch (e) {
      console.error('Navbar load branches error:', e)
    }
  }

  useEffect(() => {
    fetchBranches()
    window.addEventListener('branch_changed', fetchBranches)
    return () => {
      window.removeEventListener('branch_changed', fetchBranches)
    }
  }, [])

  const handleBranchChange = (branchName: string) => {
    setActiveBranch(branchName)
    localStorage.setItem('active_branch', branchName)
    window.dispatchEvent(new Event('branch_changed'))
  }

  return (
    <div className='app-navbar flex-shrink-0'>
      {/* Multi-Branch Selector Dropdown */}
      <div className={clsx('app-navbar-item', itemClass)}>
        <div className='dropdown'>
          <button 
            className='btn btn-sm btn-light-success dropdown-toggle fw-bold py-2 px-3' 
            type='button' 
            data-bs-toggle='dropdown' 
            aria-expanded='false'
          >
            🏢 {activeBranch}
          </button>
          <ul className='dropdown-menu dropdown-menu-end shadow-sm border border-gray-200 mt-2 rounded'>
            {branches.map((b) => (
              <li key={b.id}>
                <button onClick={() => handleBranchChange(b.name)} className='dropdown-item fw-semibold py-2 fs-7'>
                  {b.name}
                </button>
              </li>
            ))}
            {branches.length === 0 && (
              <li>
                <span className='dropdown-item text-muted py-2 fs-7'>No branches found</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className={clsx('app-navbar-item', itemClass)}>
        <ThemeModeSwitcher toggleBtnClass={clsx('btn-active-light-primary btn-custom')} />
      </div>

      <div className={clsx('app-navbar-item', itemClass)}>
        <div
          className={clsx('cursor-pointer symbol symbol-circle', userAvatarClass)}
          data-kt-menu-trigger="{default: 'click'}"
          data-kt-menu-attach='parent'
          data-kt-menu-placement='bottom-end'
        >
          <img 
            src={currentUser?.profile_image || toAbsoluteUrl('media/svg/avatars/blank.svg')} 
            alt='avatar' 
            style={{ objectFit: 'cover' }}
          />
        </div>
        <HeaderUserMenu />
      </div>

      {config.app?.header?.default?.menu?.display && (
        <div className='app-navbar-item d-lg-none ms-2 me-n3' title='Show header menu'>
          <div
            className='btn btn-icon btn-active-color-primary w-35px h-35px'
            id='kt_app_header_menu_toggle'
          >
            <KTIcon iconName='text-align-left' className={btnIconClass} />
          </div>
        </div>
      )}
    </div>
  )
}

export { Navbar }
