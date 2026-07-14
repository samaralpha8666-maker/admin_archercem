import {FC} from 'react'
import clsx from 'clsx'
import {Link} from 'react-router-dom'
import {useLocation} from 'react-router'
import {checkIsActive, KTIcon, WithChildren} from '../../../../helpers'
import {useLayout} from '../../../core'

type Props = {
  to: string
  title: string
  icon?: string
  fontIcon?: string
  hasBullet?: boolean
  badge?: string | number
}

const SidebarMenuItem: FC<Props & WithChildren> = ({
  children,
  to,
  title,
  icon,
  fontIcon,
  hasBullet = false,
  badge,
}) => {
  const {pathname} = useLocation()
  const isActive = checkIsActive(pathname, to)
  const {config} = useLayout()
  const {app} = config

  return (
    <div className='menu-item'>
      <Link className={clsx('menu-link without-sub', {active: isActive})} to={to}>
        {hasBullet && (
          <span className='menu-bullet'>
            <span className='bullet bullet-dot'></span>
          </span>
        )}
        {icon && app?.sidebar?.default?.menu?.iconType === 'svg' && (
          <span className='menu-icon'>
            {' '}
            <KTIcon iconName={icon} className='fs-2' />
          </span>
        )}
        {fontIcon && app?.sidebar?.default?.menu?.iconType === 'font' && (
          <i className={clsx('bi fs-3', fontIcon)}></i>
        )}
        <span className='menu-title'>{title}</span>
        {badge !== undefined && badge !== null && badge !== '' && badge !== 0 && (
          <span className='badge badge-light-danger fs-9 fw-bold px-2 py-0.5 ms-auto'>{badge}</span>
        )}
      </Link>
      {children}
    </div>
  )
}

export {SidebarMenuItem}
