import { useEffect, useState, useCallback } from 'react'
import { bookingService, vnd, fmtDateTime } from '../../services'

// Bảng triển khai dịch vụ theo phòng (chỉ phòng đang có khách). Lễ tân tick "đã giao" để kiểm soát.
export default function ServiceBoardPage() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [onlyPending, setOnlyPending] = useState(false)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setErr('')
    try { setRows(await bookingService.serviceBoard()) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải') }
  }, [])
  useEffect(() => { load() }, [load])

  const toggle = async (row, line) => {
    setBusy(line._id); setErr('')
    try {
      await bookingService.setServiceDelivered(row.bookingId, line._id, line.status !== 'delivered')
      await load()
    } catch (e) { setErr(e.response?.data?.message || 'Lỗi cập nhật') }
    finally { setBusy('') }
  }

  // Lọc theo "chỉ chưa giao" — ẩn phòng không còn dòng nào sau lọc
  const view = (rows || [])
    .map((r) => ({ ...r, services: onlyPending ? r.services.filter((s) => s.status !== 'delivered') : r.services }))
    .filter((r) => r.services.length)

  const totalPending = (rows || []).reduce((n, r) => n + r.pendingCount, 0)

  return (
    <div className="rc-svcboard">
      <div className="rc-bar">
        <h2>Triển khai dịch vụ
          {totalPending > 0 && <span className="rc-badge s-pending" style={{ marginLeft: 8 }}>{totalPending} chờ giao</span>}
        </h2>
        <div className="rc-filters" style={{ margin: 0 }}>
          <label className="rc-check" style={{ margin: 0 }}>
            <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
            Chỉ hiện chưa giao
          </label>
          <button className="link" onClick={load}>↻ Làm mới</button>
        </div>
      </div>
      {err && <p className="rc-err">{err}</p>}

      {!rows ? <p>Đang tải...</p> : !view.length ? (
        <p className="rc-empty">{onlyPending ? 'Không còn dịch vụ nào chờ giao 🎉' : 'Chưa có phòng nào có dịch vụ cần triển khai.'}</p>
      ) : (
        <div className="svc-grid">
          {view.map((r) => (
            <div key={r.bookingId} className="svc-card">
              <div className="svc-card-head">
                <div className="svc-room">
                  <b>Phòng {r.room.roomNumber}</b>
                  {r.room.floor != null && <small>Tầng {r.room.floor}</small>}
                </div>
                <div className="svc-guest">
                  <span>{r.guestName || '—'}</span>
                  <small>{r.code}</small>
                </div>
              </div>
              <ul className="svc-lines">
                {r.services.map((s) => {
                  const done = s.status === 'delivered'
                  return (
                    <li key={s._id} className={done ? 'done' : ''}>
                      <div className="svc-info">
                        <span className="svc-name">{s.name} <em>×{s.quantity}</em></span>
                        <small>{vnd(s.price * s.quantity)} · thêm {fmtDateTime(s.addedAt)}</small>
                        {done && s.deliveredAt && <small className="svc-when">✓ đã giao {fmtDateTime(s.deliveredAt)}</small>}
                      </div>
                      <button
                        className={'svc-toggle ' + (done ? 'undo' : 'go')}
                        disabled={busy === s._id}
                        onClick={() => toggle(r, s)}>
                        {busy === s._id ? '…' : done ? '↩ Hoàn tác' : '✓ Đã giao'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
