import { useEffect, useState, useCallback } from 'react'
import { bookingService, fmtDate, bookingStatusLabel } from '../../services'
import DateField from '../../components/common/DateField'

const DAY = 86400000
const COL = 64 // px mỗi ngày (khớp background-size trong reception.css)
const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const toInput = (d) => { const x = new Date(d); const p = (n) => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}` }

export default function SchedulePage() {
  const today = sod(new Date())
  const [from, setFrom] = useState(toInput(today))
  const [to, setTo] = useState(toInput(new Date(today.getTime() + 7 * DAY)))
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    try { setData(await bookingService.schedule({ from, to })) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi') }
  }, [from, to])
  useEffect(() => { load() }, [load])

  const start = data ? sod(data.from) : today
  const end = data ? sod(data.to) : today
  const dayCount = data ? Math.max(1, Math.round((end - start) / DAY) + 1) : 1
  const days = Array.from({ length: dayCount }, (_, i) => new Date(start.getTime() + i * DAY))

  const bar = (b) => {
    let s = Math.round((sod(b.checkIn) - start) / DAY)
    let e = Math.round((sod(b.checkOut) - start) / DAY)
    s = Math.max(0, s); e = Math.min(dayCount, e)
    if (e <= s) return null
    return { left: s * COL, width: (e - s) * COL - 4 }
  }

  return (
    <div>
      <div className="rc-bar">
        <div className="rc-bar-titles">
          <h2>Lịch phòng</h2>
          <p className="rc-sub">Phòng nào bận ngày nào — kéo ngang để xem cả kỳ, bấm vào thanh để biết mã đặt.</p>
        </div>
        <div className="rc-filters" style={{ margin: 0 }}>
          <span className="rc-filters-label">Từ</span>
          <div style={{ width: 150 }}><DateField value={from} onChange={setFrom} max={to} allowClear={false} /></div>
          <span className="rc-filters-label">đến</span>
          <div style={{ width: 150 }}><DateField value={to} onChange={setTo} min={from} allowClear={false} /></div>
        </div>
      </div>
      {err && <p className="rc-err">{err}</p>}
      {!data ? <p>Đang tải...</p> : (
        <div className="gantt-wrap">
          <div className="gantt" style={{ minWidth: 150 + dayCount * COL }}>
            <div className="gantt-row gantt-head">
              <div className="gantt-room">Phòng</div>
              <div className="gantt-days">
                {days.map((d, i) => (
                  <div key={i} className={'gantt-dh' + ([0, 6].includes(d.getDay()) ? ' wknd' : '')} style={{ width: COL }}>
                    {d.getDate()}/{d.getMonth() + 1}
                  </div>
                ))}
              </div>
            </div>
            {data.rooms.map((room) => (
              <div key={room._id} className="gantt-row">
                <div className="gantt-room"><b>{room.roomNumber}</b><small>{room.roomType?.name}</small></div>
                <div className="gantt-track" style={{ width: dayCount * COL }}>
                  {room.bookings.map((b) => {
                    const pos = bar(b); if (!pos) return null
                    return (
                      <div key={b.code} className={'gantt-bar s-' + b.status} style={{ left: pos.left, width: pos.width }}
                        title={`${b.code} · ${b.guestName || ''} · ${fmtDate(b.checkIn)} → ${fmtDate(b.checkOut)} · ${bookingStatusLabel(b.status)}`}>
                        {b.code}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {!data.rooms.length && <p style={{ padding: 16, color: '#888' }}>Chưa có phòng</p>}
          </div>
        </div>
      )}
      {/* Ô màu chú giải lấy ĐÚNG class của thanh (s-*) — trước đây hard-code hex riêng
          (#E0A800, #248ACC…) nên chú giải không khớp màu thanh thật trên biểu đồ. */}
      <div className="gantt-legend">
        {[['pending', 'Chờ cọc'], ['confirmed', 'Đã cọc'], ['checked_in', 'Đang ở'], ['checked_out', 'Đã trả'], ['completed', 'Hoàn tất']].map(([s, label]) => (
          <span key={s}><i className={'s-' + s} /> {label}</span>
        ))}
      </div>
    </div>
  )
}
