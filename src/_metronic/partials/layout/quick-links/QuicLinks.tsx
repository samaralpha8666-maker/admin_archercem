import { FC } from 'react'
import { Link } from 'react-router-dom'
import { KTIcon, toAbsoluteUrl } from '../../../helpers'
import { useAuth } from '../../../../app/modules/auth'

interface QuickLinkItem {
  to: string
  iconName: string
  title: string
  subtitle: string
  color: string
}

const QuickLinks: FC = () => {
  const { currentUser } = useAuth()
  const isTeacher = currentUser?.role === 'teacher'

  const adminLinks: QuickLinkItem[] = [
    {
      to: '/students/admission',
      iconName: 'profile-user',
      title: 'Admission',
      subtitle: 'Student Entry',
      color: 'primary'
    },
    {
      to: '/fees/monthly',
      iconName: 'dollar',
      title: 'Fees',
      subtitle: 'Collection',
      color: 'success'
    },
    {
      to: '/timetable/grid',
      iconName: 'calendar-8',
      title: 'Timetable',
      subtitle: 'Schedule',
      color: 'warning'
    },
    {
      to: '/reports/attendance/student',
      iconName: 'chart-line-up-2',
      title: 'Student Reports',
      subtitle: 'Attendance',
      color: 'info'
    },
    {
      to: '/reports/attendance/staff',
      iconName: 'chart-simple',
      title: 'Staff Reports',
      subtitle: 'Attendance',
      color: 'danger'
    },
    {
      to: '/staff/attendance',
      iconName: 'calendar-tick',
      title: 'Staff marking',
      subtitle: 'Attendance',
      color: 'primary'
    }
  ]

  const teacherLinks: QuickLinkItem[] = [
    {
      to: '/teacher/student-directory',
      iconName: 'profile-user',
      title: 'Students',
      subtitle: 'Directory',
      color: 'primary'
    },
    {
      to: '/teacher/timetable',
      iconName: 'calendar-8',
      title: 'Timetable',
      subtitle: 'Schedule',
      color: 'warning'
    },
    {
      to: '/teacher/attendance',
      iconName: 'calendar-tick',
      title: 'Mark Attendance',
      subtitle: 'Students',
      color: 'success'
    },
    {
      to: '/reports/attendance/student',
      iconName: 'chart-line-up-2',
      title: 'Student Reports',
      subtitle: 'Attendance',
      color: 'info'
    },
    {
      to: '/teacher/assignments',
      iconName: 'document',
      title: 'Assignments',
      subtitle: 'HW & Tasks',
      color: 'danger'
    },
    {
      to: '/communication/messaging',
      iconName: 'message-text',
      title: 'Messaging',
      subtitle: 'Chat',
      color: 'primary'
    }
  ]

  const links = isTeacher ? teacherLinks : adminLinks

  return (
    <div
      className='menu menu-sub menu-sub-dropdown menu-column w-250px w-lg-325px'
      data-kt-menu='true'
    >
      <div
        className='d-flex flex-column flex-center bgi-no-repeat rounded-top px-9 py-10'
        style={{ backgroundImage: `url('${toAbsoluteUrl('media/misc/pattern-1.jpg')}')` }}
      >
        <h3 className='text-white fw-bold mb-3'>Quick Links</h3>
      </div>

      <div className='row g-0'>
        {links.map((link, idx) => {
          const borderStyle = {
            borderBottom: '1px solid #f3f3f3',
            borderRight: idx % 2 === 0 ? '1px solid #f3f3f3' : 'none',
          }
          return (
            <div key={idx} className='col-6'>
              <Link
                to={link.to}
                className='d-flex flex-column flex-center h-100 p-6 bg-hover-light text-decoration-none'
                style={borderStyle}
              >
                <KTIcon iconName={link.iconName} className={`fs-3x text-${link.color} mb-2`} />
                <span className='fs-5 fw-bolder text-gray-800 mb-0'>{link.title}</span>
                <span className='fs-7 fw-bold text-gray-600'>{link.subtitle}</span>
              </Link>
            </div>
          )
        })}
      </div>

      <div className='py-2 text-center border-top'>
        <Link to='/dashboard' className='btn btn-color-gray-600 btn-active-color-primary'>
          To Dashboard <KTIcon iconName='arrow-right' className='fs-5' />
        </Link>
      </div>
    </div>
  )
}

export { QuickLinks }
