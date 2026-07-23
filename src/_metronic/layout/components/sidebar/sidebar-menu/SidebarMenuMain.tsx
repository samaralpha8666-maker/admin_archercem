import { useIntl } from 'react-intl'
import { SidebarMenuItem } from './SidebarMenuItem'
import { useAuth } from '../../../../../app/modules/auth'

const SidebarMenuMain = () => {
  const intl = useIntl()
  const { currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'super_admin'

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

          <SidebarMenuItem
            to='/brands'
            icon='geolocation'
            title='Brands & Branches'
            fontIcon='bi-building'
          />
          <SidebarMenuItem
            to='/oif'
            icon='briefcase'
            title='OIF (Order Intimation)'
            fontIcon='bi-file-earmark-text'
          />
          <SidebarMenuItem
            to='/electronics'
            icon='cpu'
            title='Electronics Material'
            fontIcon='bi-cpu'
          />

          <SidebarMenuItem
            to='/qc'
            icon='shield-tick'
            title='QC Test Reports'
            fontIcon='bi-shield-check'
          />
          <SidebarMenuItem
            to='/calibration'
            icon='award'
            title='Calibration Lab'
            fontIcon='bi-clipboard-check'
          />
          <SidebarMenuItem
            to='/amc'
            icon='wrench'
            title='Service & AMC'
            fontIcon='bi-tools'
          />
          <SidebarMenuItem
            to='/purchase'
            icon='basket'
            title='Purchase Requisitions'
            fontIcon='bi-cart'
          />
          <SidebarMenuItem
            to='/store'
            icon='archive'
            title='Store & Inventory'
            fontIcon='bi-box-seam'
          />
        </>
      )}
    </>
  )
}

export { SidebarMenuMain }
