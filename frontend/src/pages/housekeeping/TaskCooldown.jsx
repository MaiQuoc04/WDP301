import { useState, useEffect } from 'react'

// Đồng hồ đếm ngược tới mốc escalate (5 phút kể từ khi tạo task). Hết giờ -> đã chuyển quản lý.
const ESCALATE_MS = 5 * 60 * 1000

export default function TaskCooldown({ createdAt, escalatedAt }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (escalatedAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [escalatedAt])

  if (escalatedAt) return <span style={{ color: '#b91c1c', fontWeight: 600 }}>Đã chuyển quản lý</span>

  const remain = new Date(createdAt).getTime() + ESCALATE_MS - now
  if (remain <= 0) return <span style={{ color: '#b91c1c', fontWeight: 600 }}>Đã quá hạn</span>

  const m = Math.floor(remain / 60000)
  const s = Math.floor((remain % 60000) / 1000)
  const low = remain < 60000
  return (
    <span style={{ color: low ? '#d97706' : '#64748b', fontWeight: 600 }}>
      Còn {m}:{String(s).padStart(2, '0')}
    </span>
  )
}
