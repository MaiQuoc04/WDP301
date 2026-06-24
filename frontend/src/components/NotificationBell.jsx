// Chuông thông báo + badge số đỏ, realtime qua socket. Dùng chung lễ tân/housekeeper.
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOutlined } from '@ant-design/icons'
import { notificationService } from '../services/notificationService'
import { socket, connectSocket } from '../services/socketService'
import './notifications.css'

export default function NotificationBell({ basePath }) {
  const nav = useNavigate()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(() => {
    notificationService.unreadCount().then(setUnread).catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    connectSocket()
    const onNoti = () => setUnread((n) => n + 1)            // có thông báo mới -> tăng badge
    const onChanged = () => refresh()                       // đọc xong ở trang -> đồng bộ lại
    socket.on('notification', onNoti)
    window.addEventListener('notifications:changed', onChanged)
    return () => {
      socket.off('notification', onNoti)
      window.removeEventListener('notifications:changed', onChanged)
    }
  }, [refresh])

  return (
    <button className="noti-bell" onClick={() => nav(`${basePath}/notifications`)} title="Thông báo" type="button">
      <BellOutlined />
      {unread > 0 && <span className="noti-badge">{unread > 99 ? '99+' : unread}</span>}
    </button>
  )
}
