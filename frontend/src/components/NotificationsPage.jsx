// Trang thông báo dùng chung. basePath để deep-link đúng role ('/reception' | '/housekeeping').
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../services/notificationService'
import { socket, connectSocket } from '../services/socketService'
import { fmtDateTime } from '../utils/date'
import './notifications.css'

const fmt = (d) => fmtDateTime(d)
const ICON = { task_new: '🆕', task_claimed: '🙋', inspection_done: '✅', general: '🔔' }

export default function NotificationsPage({ basePath }) {
  const nav = useNavigate()
  const [items, setItems] = useState(null)

  const load = useCallback(() => {
    notificationService.list().then(setItems).catch(() => setItems([]))
  }, [])

  useEffect(() => {
    load()
    connectSocket()
    const onNoti = (n) => setItems((arr) => [n, ...(arr || [])])  // realtime: chèn lên đầu
    socket.on('notification', onNoti)
    return () => socket.off('notification', onNoti)
  }, [load])

  const open = async (n) => {
    if (!n.isRead) {
      try {
        await notificationService.markRead(n._id)
        window.dispatchEvent(new Event('notifications:changed'))
        setItems((a) => a.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))
      } catch { /* ignore */ }
    }
    if (n.refType === 'booking' && n.refId) nav(`${basePath}/bookings/${n.refId}`)
    else if (n.refType === 'task' && n.refId && basePath === '/housekeeping') nav(`${basePath}/tasks/${n.refId}`)
    else if (n.refType === 'room' && basePath === '/manager') nav(`${basePath}/restock`)
  }

  const markAll = async () => {
    try {
      await notificationService.markAllRead()
      window.dispatchEvent(new Event('notifications:changed'))
      setItems((a) => (a || []).map((x) => ({ ...x, isRead: true })))
    } catch { /* ignore */ }
  }

  const unread = (items || []).filter((n) => !n.isRead).length

  return (
    <div className="noti-page">
      <div className="noti-page-head">
        <h2>Thông báo {unread > 0 && <span className="noti-count">{unread} mới</span>}</h2>
        {unread > 0 && <button className="noti-markall" onClick={markAll} type="button">Đánh dấu đã đọc tất cả</button>}
      </div>
      {items === null ? <p>Đang tải...</p> : !items.length ? (
        <p className="noti-empty">Chưa có thông báo nào.</p>
      ) : (
        <ul className="noti-list">
          {items.map((n) => (
            <li key={n._id} className={'noti-item' + (n.isRead ? '' : ' unread')} onClick={() => open(n)}>
              <span className="noti-ico">{ICON[n.type] || '🔔'}</span>
              <div className="noti-body">
                <div className="noti-title">{n.title}</div>
                {n.body && <div className="noti-sub">{n.body}</div>}
                <div className="noti-time">{fmt(n.createdAt)}</div>
              </div>
              {!n.isRead && <span className="noti-dot" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
