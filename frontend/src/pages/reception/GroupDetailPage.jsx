// Owner: Quốc — chi tiết NHÓM đặt nhiều phòng (1 mã, 1 cọc). Mỗi phòng vẫn mở chi tiết riêng để vận hành.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingService, vnd, fmtDate, fmtDateTime, bookingStatusLabel, paymentStatusLabel } from '../../services'
import { socket, connectSocket } from '../../services/socketService'

export default function GroupDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null) // { group, members, payments, rollup }
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setErr('')
    try { setData(await bookingService.getGroup(id)) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải nhóm') }
  }, [id])
  useEffect(() => { reload() }, [reload])

  // Realtime: 1 phòng trong nhóm đổi (housekeeper kiểm kê / lễ tân khác check-in-out) -> tự cập nhật, không reload tay.
  const memberIdsRef = useRef([])
  useEffect(() => { memberIdsRef.current = (data?.members || []).map((m) => String(m._id)) }, [data])
  useEffect(() => {
    connectSocket()
    const onUpd = (evt) => { if (evt?.bookingId && memberIdsRef.current.includes(String(evt.bookingId))) reload() }
    socket.on('booking_updated', onUpd)
    return () => socket.off('booking_updated', onUpd)
  }, [reload])

  const confirmDeposit = async (paidFull) => {
    setErr(''); setMsg(''); setLoading(true)
    try {
      await bookingService.confirmGroupDeposit(id, { method: 'cash', paidFull })
      setMsg(paidFull ? 'Đã thu toàn bộ cho nhóm' : 'Đã thu cọc nhóm')
      await reload()
    } catch (e) { setErr(e.response?.data?.message || 'Lỗi thu cọc') }
    finally { setLoading(false) }
  }

  // Thao tác hàng loạt: áp cho các phòng đủ điều kiện; báo done + phòng bị bỏ qua (lý do).
  const runGroupAction = async (label, fn, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setErr(''); setMsg(''); setLoading(true)
    try {
      const res = await fn()
      let m = `${label}: ${res.done} phòng`
      if (res.collected) m += ` · thu ${vnd(res.collected)}`
      if (res.skipped?.length) m += ` · bỏ qua ${res.skipped.length} phòng (${res.skipped.map((s) => s.message).join('; ')})`
      setMsg(m)
      await reload()
    } catch (e) { setErr(e.response?.data?.message || `Lỗi: ${label}`) }
    finally { setLoading(false) }
  }

  if (!data) return <p>{err || 'Đang tải...'}</p>
  const { group, members, payments, rollup } = data
  const hasPending = members.some((m) => m.status === 'pending')
  const canCheckIn = members.some((m) => m.status === 'confirmed')
  const canCheckOut = members.some((m) => m.status === 'checked_in')
  const canCancel = members.some((m) => ['pending', 'confirmed'].includes(m.status))
  const canNoShow = members.some((m) => m.status === 'confirmed')

  return (
    <div className="rc-detail">
      <div className="rc-bar">
        <h2>Nhóm {group.code} <span className={'rc-badge s-' + rollup.status}>{bookingStatusLabel(rollup.status)}</span></h2>
        <Link to="/reception/bookings">← Danh sách</Link>
      </div>
      {err && <p className="rc-err">{err}</p>}
      {msg && <p className="rc-ok">{msg}</p>}

      {hasPending && (
        <div className="rc-actions">
          <button className="btn-payos" disabled={loading} onClick={() => confirmDeposit(false)}>
            💳 Thu cọc nhóm {vnd(rollup.depositAmount)} (tiền mặt)
          </button>
          <button disabled={loading} onClick={() => confirmDeposit(true)}>
            Thu toàn bộ {vnd(rollup.totalAmount)}
          </button>
        </div>
      )}

      {/* Thao tác HÀNG LOẠT cả nhóm (áp cho các phòng đủ điều kiện) */}
      {(canCheckIn || canCheckOut || canCancel || canNoShow) && (
        <div className="rc-actions" style={{ marginTop: hasPending ? 8 : 0 }}>
          {canCheckIn && (
            <button disabled={loading} onClick={() => runGroupAction('Đã nhận', () => bookingService.checkInGroup(id))}>
              🏨 Nhận tất cả
            </button>
          )}
          {canCheckOut && (
            <button disabled={loading} onClick={() => runGroupAction('Đã trả', () => bookingService.checkOutGroupAll(id, { method: 'cash' }),
              `Trả phòng CẢ NHÓM (thu tiền mặt còn lại ${vnd(rollup.remainingAmount)}) và tự giao dọn phòng?`)}>
              🧾 Trả tất cả
            </button>
          )}
          {canNoShow && (
            <button disabled={loading} onClick={() => runGroupAction('No-show', () => bookingService.noShowGroupAll(id),
              'Đánh no-show CẢ NHÓM (giữ cọc)?')}>
              🚫 No-show tất cả
            </button>
          )}
          {canCancel && (
            <button disabled={loading} style={{ background: '#dc2626', borderColor: '#dc2626' }}
              onClick={() => runGroupAction('Đã huỷ', () => bookingService.cancelGroupAll(id, {}),
                'Huỷ CẢ NHÓM (các phòng chưa nhận)? Cọc đã thu KHÔNG hoàn.')}>
              ✖ Huỷ tất cả
            </button>
          )}
        </div>
      )}

      <div className="rc-cols">
        <section>
          <h3>Thông tin nhóm</h3>
          <p>Khách: <b>{group.guestName}</b>{group.guestPhone && ` · ${group.guestPhone}`}</p>
          <p>Nhận {fmtDate(group.checkIn)} 14:00 → Trả {fmtDate(group.checkOut)} 12:00</p>
          <p>Số phòng: <b>{rollup.roomCount}</b>{rollup.activeCount !== rollup.roomCount && ` (còn ${rollup.activeCount} hiệu lực)`}</p>
          <p>Tổng khách: {group.adultsTotal} người lớn + {group.childrenTotal} trẻ em</p>
          <p>Thanh toán: <b>{paymentStatusLabel(rollup.paymentStatus)}</b></p>

          <h3>Giao dịch</h3>
          {payments.length ? (
            <ul className="rc-hist">
              {payments.map((p) => <li key={p._id}>{fmtDateTime(p.paidAt || p.createdAt)}: {p.type === 'deposit' ? 'Cọc' : 'Còn lại'} {vnd(p.amount)} ({p.method})</li>)}
            </ul>
          ) : <p className="rc-muted">Chưa có giao dịch</p>}
        </section>

        <section>
          <h3>Các phòng trong nhóm</h3>
          <table className="rc-table">
            <thead><tr><th>Phòng</th><th>Khách</th><th>Trạng thái</th><th>Tiền</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td><b>{m.room?.roomNumber || '—'}</b> <small>· {m.roomType?.name}</small></td>
                  <td>{m.adults}NL{m.children > 0 ? ` + ${m.children}TE` : ''}</td>
                  <td><span className={'rc-badge s-' + m.status}>{bookingStatusLabel(m.status)}</span></td>
                  <td>{vnd(m.totalAmount)}</td>
                  <td><Link className="link" to={`/reception/bookings/${m._id}`}>Mở →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Hoá đơn gom</h3>
          <table className="rc-bill"><tbody>
            <tr className="tot"><td>Tổng nhóm</td><td>{vnd(rollup.totalAmount)}</td></tr>
            <tr><td>Đã trả</td><td>{vnd(rollup.paidAmount)}</td></tr>
            <tr className="tot"><td>Còn lại</td><td>{vnd(rollup.remainingAmount)}</td></tr>
          </tbody></table>
          <p className="rc-muted" style={{ marginTop: 8 }}>
            Dùng nút <b>“… tất cả”</b> ở trên để thao tác cả nhóm 1 lần (áp cho phòng đủ điều kiện; phòng chưa sẵn sàng sẽ được báo). Vẫn có thể <b>Mở →</b> từng phòng để thao tác lẻ (nhận sớm / trả muộn / đổi phòng / thêm dịch vụ…); tổng nhóm tự tính lại.
          </p>
        </section>
      </div>
    </div>
  )
}
