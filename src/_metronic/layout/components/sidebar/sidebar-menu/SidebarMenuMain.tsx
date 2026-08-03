import { useIntl } from 'react-intl'
import { SidebarMenuItem } from './SidebarMenuItem'
import { useAuth } from '../../../../../app/modules/auth'

const SidebarMenuMain = () => {
  const intl = useIntl()
  const { currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'super_admin'

  const hasPermission = (moduleKey: string) => {
    if (isSuperAdmin || currentUser?.role === 'admin') return true
    if (!currentUser?.permissions) return true
    return currentUser.permissions.includes(moduleKey)
  }

  return (
    <>
      <SidebarMenuItem
        to='/dashboard'
        icon='element-11'
        title={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
        fontIcon='bi-app-indicator'
      />
      {isSuperAdmin ? (
        <SidebarMenuItem
          to='/tenants'
          icon='abstract-26'
          title='Tenants'
          fontIcon='bi-layers'
        />
      ) : (
        <>
          <div className='menu-item'>
            <div className='menu-content pt-8 pb-2'>
              <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Archerchem ERP</span>
            </div>
          </div>

          {hasPermission('brands') && (
            <SidebarMenuItem
              to='/brands'
              icon='geolocation'
              title='Brands & Branches'
              fontIcon='bi-building'
            />
          )}

          {hasPermission('oif') && (
            <SidebarMenuItem
              to='/oif'
              icon='briefcase'
              title='OIF (Order Intimation)'
              fontIcon='bi-file-earmark-text'
            />
          )}

          {hasPermission('electronics') && (
            <SidebarMenuItem
              to='/electronics'
              icon='cpu'
              title='Electronics Material'
              fontIcon='bi-cpu'
            />
          )}

          {hasPermission('qc') && (
            <SidebarMenuItem
              to='/qc'
              icon='shield-tick'
              title='QC Test Reports'
              fontIcon='bi-shield-check'
            />
          )}

          {hasPermission('calibration') && (
            <SidebarMenuItem
              to='/calibration'
              icon='award'
              title='Calibration Lab'
              fontIcon='bi-clipboard-check'
            />
          )}

          {hasPermission('amc') && (
            <SidebarMenuItem
              to='/amc'
              icon='wrench'
              title='Service & AMC'
              fontIcon='bi-tools'
            />
          )}

          {hasPermission('purchase') && (
            <SidebarMenuItem
              to='/purchase'
              icon='basket'
              title='Purchase Requisitions'
              fontIcon='bi-cart'
            />
          )}

          {hasPermission('store') && (
            <SidebarMenuItem
              to='/store'
              icon='archive'
              title='Store & Inventory'
              fontIcon='bi-box-seam'
            />
          )}

          {hasPermission('users') && (
            <SidebarMenuItem
              to='/users'
              icon='profile-user'
              title='User Management'
              fontIcon='bi-people'
            />
          )}
        </>
      )}
    </>
  )
}

export { SidebarMenuMain }
