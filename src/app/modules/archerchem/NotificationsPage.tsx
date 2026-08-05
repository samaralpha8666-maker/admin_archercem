import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { KTIcon } from '../../../_metronic/helpers'
import { getNotifications, markAllNotificationsRead } from '../auth/core/_requests'
import toast from 'react-hot-toast'

interface NotificationItem {
  id: string
  title: string
  description: string
  timeAgo: string
  type: 'order' | 'approval' | 'alert' | 'success'
  icon: string
  color: 'primary' | 'warning' | 'danger' | 'success' | 'info'
  read: boolean
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New OIF Created',
    description: 'OIF-2026-045 for Malad dispatch pending verification',
    timeAgo: '10 min ago',
    type: 'order',
    icon: 'briefcase',
    color: 'warning',
    read: false
  },
  {
    id: 'n2',
    title: 'Purchase Approval Pending',
    description: 'PR-2026-003 waiting for manager digital approval',
    timeAgo: '25 min ago',
    type: 'approval',
    icon: 'basket',
    color: 'primary',
    read: false
  },
  {
    id: 'n3',
    title: 'Low Stock Alert — Sathivali Store',
    description: '5 items below minimum threshold reorder limit',
    timeAgo: '30 min ago',
    type: 'alert',
    icon: 'warning',
    color: 'danger',
    read: false
  },
  {
    id: 'n4',
    title: 'Low Part Alert — Display Board BOM',
    description: 'IC Register microchip: only 3 units remaining in stock',
    timeAgo: '1 hr ago',
    type: 'alert',
    icon: 'cpu',
    color: 'info',
    read: false
  },
  {
    id: 'n5',
    title: 'OIF Dispatched',
    description: 'OIF-2026-040 dispatched successfully to Pune client',
    timeAgo: '2 hr ago',
    type: 'success',
    icon: 'check-circle',
    color: 'success',
    read: true
  }
]

const NotificationsPage: FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all')

  const fetchBackendNotifications = async () => {
    try {
      const res = await getNotifications()
      if (res.data?.success && res.data.notifications?.length) {
        const mapped = res.data.notifications.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          description: n.description || '',
          timeAgo: 'Recently',
          type: n.type || 'alert',
          icon: n.type === 'order' ? 'briefcase' : n.type === 'approval' ? 'basket' : n.type === 'success' ? 'check-circle' : 'warning',
          color: n.color || 'primary',
          read: Boolean(n.read)
        }))
        setNotifications(mapped)
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  useEffect(() => {
    fetchBackendNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await markAllNotificationsRead()
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
    toast.success('All notifications marked as read.')
  }

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast.success('Notification dismissed.')
  }

  const filteredItems = notifications.filter((item) => {
    if (filter === 'unread') return !item.read
    if (filter === 'alerts') return item.type === 'alert'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <PageTitle breadcrumbs={[]}>System Alerts &amp; Notifications</PageTitle>
      <Content>
        <div className='d-flex flex-column gap-6'>
          {/* Hero Banner */}
          <div
            className='card border-0 rounded-4 shadow-sm position-relative overflow-hidden'
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              color: '#ffffff'
            }}
          >
            <div className='card-body p-8 position-relative' style={{ zIndex: 1 }}>
              <div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4'>
                <div className='d-flex align-items-center gap-4'>
                  <div className='p-4 bg-white bg-opacity-10 rounded-circle text-white position-relative'>
                    <KTIcon iconName='notification-status' className='fs-2hx' />
                    {unreadCount > 0 && (
                      <span className='position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light fs-9 fw-bold px-2'>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className='d-flex align-items-center gap-2 mb-2'>
                      <span className='badge bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-pill fs-8 fw-bold'>
                        🔔 Live Telemetry Stream
                      </span>
                    </div>
                    <h1 className='fs-2hx fw-extrabold text-white mb-1'>System Notifications</h1>
                    <p className='text-white text-opacity-80 fw-semibold fs-6 mb-0'>
                      Real-time alerts, stock threshold warnings, order intimations, and approval requests across all store nodes.
                    </p>
                  </div>
                </div>

                <button onClick={handleMarkAllRead} className='btn btn-light-primary text-primary bg-white fw-bold fs-7 shadow-sm d-flex align-items-center gap-2'>
                  <KTIcon iconName='check' className='fs-4' />
                  Mark All Read
                </button>
              </div>
            </div>
          </div>

          {/* Main Feed Card */}
          <div className='card card-flush shadow-sm border-0 bg-body'>
            <div className='card-header pt-6 border-0 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-4'>
              <div className='d-flex align-items-center gap-2'>
                <button
                  onClick={() => setFilter('all')}
                  className={`btn btn-sm fw-bold fs-7 ${filter === 'all' ? 'btn-primary' : 'btn-light'}`}
                >
                  All Alerts ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`btn btn-sm fw-bold fs-7 ${filter === 'unread' ? 'btn-primary' : 'btn-light'}`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('alerts')}
                  className={`btn btn-sm fw-bold fs-7 ${filter === 'alerts' ? 'btn-primary' : 'btn-light'}`}
                >
                  Stock Warnings
                </button>
              </div>

              <span className='text-muted fs-8 fw-semibold'>Showing {filteredItems.length} notification items</span>
            </div>

            <div className='card-body pt-2'>
              {filteredItems.length > 0 ? (
                <div className='d-flex flex-column gap-3'>
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`d-flex align-items-start justify-content-between p-5 rounded-4 border transition-all ${
                        item.read ? 'bg-body border-gray-200' : 'bg-light-primary border-primary border-opacity-25'
                      }`}
                    >
                      <div className='d-flex align-items-start gap-4'>
                        <span className={`badge badge-light-${item.color} p-3 rounded-circle mt-1`}>
                          <KTIcon iconName={item.icon} className='fs-2' />
                        </span>

                        <div className='d-flex flex-column'>
                          <div className='d-flex align-items-center gap-2 mb-1'>
                            <h4 className='fs-6 fw-bold text-gray-900 mb-0'>{item.title}</h4>
                            {!item.read && (
                              <span className='badge badge-circle badge-primary w-8px h-8px'></span>
                            )}
                          </div>
                          <p className='fs-7 text-gray-700 fw-semibold mb-1'>{item.description}</p>
                          <span className='text-muted fs-8 fw-semibold'>{item.timeAgo}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDismiss(item.id)}
                        className='btn btn-icon btn-sm btn-light-danger rounded-circle'
                        title='Dismiss notification'
                      >
                        <KTIcon iconName='cross' className='fs-5' />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='p-10 text-center text-muted fs-7 fw-semibold'>
                  No notifications found matching selected filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </Content>
    </>
  )
}

export default NotificationsPage
