// Owner: Quốc — chi tiết NHÓM đặt nhiều phòng (1 mã, 1 cọc). Mỗi phòng vẫn mở chi tiết riêng để vận hành.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingService, vnd, fmtDate, fmtDateTime, bookingStatusLabel, paymentStatusLabel, mixedSummary } from '../../services'
import { socket, connectSocket } from '../../services/socketService'
import PayOSQRCode from '../../components/PayOSQRCode'
import TransferModal from './TransferModal'

// Đếm ngược hạn QR (15 phút)
function GroupQRCountdown({ expireMs }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const left = Math.max(0, Math.floor((expireMs - now) / 1000))
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')
  // .payos-expire (không phải .payos-countdown — class đó chưa từng tồn tại trong CSS nên đồng hồ bị trần)
  return (
    <span className={'payos-expire' + (left === 0 ? ' expired' : left < 60 ? ' urgent' : '')}>
      {left > 0 ? `⏱ Hết hạn sau ${mm}:${ss}` : '⌛ Đã hết hạn'}
    </span>
  )
}

// Modal thanh toán GOM cho nhóm — 1 modal cho: cọc (deposit) / toàn bộ (full) / tiền còn lại khi trả phòng (remaining).
// Mỗi loại đều cho chọn QR PayOS hoặc tiền mặt.
function GroupPayModal({ groupId, type, amount, title, onClose, onDone, onError }) {
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [preview, setPreview] = useState(null) // trả phòng: phòng nào + ai sẽ được giao dọn
  const [picked, setPicked] = useState({})     // ghi đè của lễ tân: bookingId -> housekeeperId
  const expireAt = useRef(null)

  // Trả phòng -> hệ thống TỰ PHÂN người dọn. Lễ tân phải thấy TRƯỚC ai sẽ nhận việc,
  // thay vì bấm xong mới biết (trước đây chỉ có window.confirm hỏi trống không).
  useEffect(() => {
    if (type !== 'remaining') return
    let cancelled = false
    bookingService.previewCheckOutGroup(groupId)
      .then((p) => {
        if (cancelled) return
        setPreview(p)
        // Điền sẵn người auto chọn -> không đụng gì thì hành vi y hệt trước.
        setPicked(Object.fromEntries((p.rooms || []).map((r) => [String(r.bookingId), r.housekeeperId ? String(r.housekeeperId) : ''])))
      })
      .catch(() => { if (!cancelled) setPreview(null) })
    return () => { cancelled = true }
  }, [type, groupId])

  // Chỉ gửi lên những dòng lễ tân ĐỔI so với gợi ý auto — gửi cả bản gốc cũng không sai,
  // nhưng gửi đúng phần đổi thì log/nghiệp vụ đọc ra ngay là con người đã can thiệp chỗ nào.
  const overrides = () => {
    const out = {}
    for (const r of preview?.rooms || []) {
      const cur = picked[String(r.bookingId)]
      if (cur && cur !== String(r.housekeeperId || '')) out[String(r.bookingId)] = cur
    }
    return out
  }
  // Số việc đang ôm SAU khi tính cả các phòng sắp giao trong nhóm này -> thấy ngay ai bị dồn.
  const loadOf = (hkId) => {
    const base = (preview?.housekeepers || []).find((h) => String(h.accountId) === String(hkId))?.activeTasks || 0
    const inThisGroup = Object.values(picked).filter((v) => String(v) === String(hkId)).length
    return base + inThisGroup
  }

  // Realtime: PayOS báo đã thu (webhook -> socket) cho đúng nhóm này
  useEffect(() => {
    connectSocket()
    const onPay = (evt) => { if (String(evt?.groupId) === String(groupId)) setDone(true) }
    socket.on('payment_success', onPay)
    return () => socket.off('payment_success', onPay)
  }, [groupId])

  // Polling 5s (fallback khi webhook không tới localhost)
  useEffect(() => {
    if (!qr || done) return
    const t = setInterval(async () => {
      try { const r = await bookingService.syncGroupPayments(groupId); if (r?.synced > 0) setDone(true) } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(t)
  }, [qr, done, groupId])

  const genQR = async () => {
    setLoading(true)
    try {
      // Trả phòng bằng QR: checkout sẽ do webhook PayOS gọi, không qua màn hình này nữa
      // -> phải gửi kèm người dọn NGAY LÚC TẠO QR để backend cất lại, không thì ghi đè mất.
      const d = await bookingService.createGroupQR(groupId, type, type === 'remaining' ? overrides() : undefined)
      setQr(d); expireAt.current = new Date(d.expiresAt).getTime() // mốc backend kẹp (<= hạn giữ chỗ)
    }
    catch (e) { onError(e.response?.data?.message || 'Không tạo được QR') }
    finally { setLoading(false) }
  }

  const payCash = async () => {
    setLoading(true)
    try {
      if (type === 'remaining') {
        // Không hỏi window.confirm nữa: bảng xem trước ngay trên màn hình đã nói rõ trả phòng nào,
        // thu bao nhiêu, ai được giao dọn. Hỏi lại bằng hộp thoại trống không chỉ là nghi thức thừa.
        const res = await bookingService.checkOutGroupAll(groupId, { method: 'cash', assignees: overrides() })
        let m = `Đã trả ${res.done} phòng`
        if (res.collected) m += ` · thu ${vnd(res.collected)}`
        if (res.skipped?.length) m += ` · bỏ qua ${res.skipped.length} phòng`
        onDone(m)
      } else {
        await bookingService.confirmGroupDeposit(groupId, { method: 'cash', paidFull: type === 'full' })
        onDone(type === 'full' ? 'Đã thu toàn bộ cho nhóm (tiền mặt)' : 'Đã thu cọc nhóm (tiền mặt)')
      }
    } catch (e) { onError(e.response?.data?.message || 'Lỗi thanh toán') }
    finally { setLoading(false) }
  }

  const kind = type === 'remaining' ? 'tiền còn lại' : type === 'full' ? 'toàn bộ' : 'cọc'
  const doneMsg = type === 'remaining' ? 'Đã thu tiền còn lại & trả phòng cả nhóm qua QR'
    : type === 'full' ? 'Đã thu toàn bộ nhóm qua QR' : 'Đã thu cọc nhóm qua QR'
  const canQR = amount >= 1000

  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      {/* 'remaining' có thêm bảng xem trước + dropdown chọn người dọn -> cần rộng hơn */}
      <div className={'rc-modal payos-modal' + (type === 'remaining' ? ' wide' : '')} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: 'var(--rc-text-main)' }}>{title} — Thanh toán</h3>

        <div className="payos-amount-box">
          <span className="lbl">Số tiền cần thu</span>
          <span className="val">{vnd(amount)}</span>
        </div>

        {/* Trả phòng: hiện TRƯỚC phòng nào sẽ trả + AI được giao dọn (hệ thống tự phân theo tầng + tải việc) */}
        {type === 'remaining' && !qr && !done && (
          <div style={{ marginBottom: 18 }}>
            {!preview && <p className="rc-muted">Đang tính người sẽ được giao dọn…</p>}
            {preview && preview.canAssign === false && (
              <p className="rc-err">⚠️ Chi nhánh chưa có nhân viên buồng phòng — <b>không trả phòng được</b>. Cần thêm nhân viên trước.</p>
            )}
            {preview && preview.rooms?.length > 0 && (
              <>
                <p className="payos-section-label">
                  Sẽ trả <b>{preview.rooms.length} phòng</b>, <b>tự giao dọn</b> theo lộ trình (tầng thấp → cao).
                  Đổi người ở cột bên phải nếu cần.
                </p>
                <table className="rc-table" style={{ marginBottom: 0 }}>
                  <thead><tr><th>Phòng</th><th className="rc-num">Còn lại</th><th>Người được giao dọn</th></tr></thead>
                  <tbody>
                    {preview.rooms.map((r, i) => {
                      const cur = picked[String(r.bookingId)] || ''
                      const changed = cur !== String(r.housekeeperId || '')
                      return (
                        <tr key={r.bookingId}>
                          <td><small className="rc-muted">{i + 1}.</small> <b>{r.roomNumber}</b> <small>T{r.floor}</small></td>
                          <td className="rc-num">{r.remaining > 0 ? vnd(r.remaining) : <span className="rc-muted">—</span>}</td>
                          <td>
                            <select className={'rc-hk-pick' + (changed ? ' changed' : '')} value={cur}
                              onChange={(e) => setPicked((p) => ({ ...p, [String(r.bookingId)]: e.target.value }))}>
                              {!r.housekeeperId && <option value="">— chưa xác định —</option>}
                              {(preview.housekeepers || []).map((h) => (
                                <option key={h.accountId} value={String(h.accountId)}>
                                  {h.name} · {loadOf(h.accountId)} việc{h.floors?.length ? ` · T${h.floors.join(',')}` : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {/* autoAssign ưu tiên TẦNG trước tải việc -> hay dồn cả nhóm cho 1 người, mà FIFO
                    bắt dọn tuần tự nên phòng cuối chờ rất lâu. Nói thẳng ra để lễ tân biết mà san. */}
                {(() => {
                  const counts = {}
                  Object.values(picked).forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1 })
                  const piled = Object.entries(counts).filter(([, n]) => n >= 3)
                  if (!piled.length) return null
                  const names = piled.map(([id, n]) => {
                    const h = (preview.housekeepers || []).find((x) => String(x.accountId) === String(id))
                    return `${h?.name || '?'} (${n} phòng)`
                  }).join(', ')
                  return <p className="rc-warn" style={{ marginTop: 10 }}>
                    Đang dồn nhiều phòng cho {names}. Các phòng này sẽ được dọn <b>lần lượt</b>, phòng cuối phải chờ lâu — cân nhắc san bớt cho người khác.
                  </p>
                })()}
              </>
            )}
          </div>
        )}

        {!qr && (
          <>
            <p className="payos-section-label">Chọn phương thức</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canQR && (
                <button className="payos-opt qr" onClick={genQR} disabled={loading}>
                  <span className="payos-opt-icon">📱</span>
                  <span className="payos-opt-text">
                    <b>{loading ? 'Đang tạo QR…' : 'Tạo QR PayOS'}</b>
                    <small>Khách quét QR để thanh toán {kind}</small>
                  </span>
                  <span className="payos-opt-arrow">›</span>
                </button>
              )}
              <button className="payos-opt cash" onClick={payCash} disabled={loading}>
                <span className="payos-opt-icon">💵</span>
                <span className="payos-opt-text">
                  <b>Thu tiền mặt</b>
                  <small>{type === 'remaining' ? 'Trả phòng & thu tiền mặt tại quầy' : 'Xác nhận đã thu tại quầy'}</small>
                </span>
                <span className="payos-opt-arrow">›</span>
              </button>
            </div>
          </>
        )}

        {qr && (
          <div className="payos-qr-wrap">
            <div className="payos-qr-header">
              <span className="payos-amount">{vnd(qr.amount)}</span>
              {expireAt.current && <GroupQRCountdown expireMs={expireAt.current} />}
            </div>
            {done ? (
              <div className="payos-success-banner">
                <span className="payos-success-icon">✅</span>
                <div><strong>Thanh toán thành công!</strong></div>
              </div>
            ) : (
              <>
                <div className="payos-qr-img-wrap">
                  <PayOSQRCode value={qr.qrCode} size={210} imageClassName="payos-qr-img" qrClassName="payos-qr-img" placeholderClassName="payos-qr-placeholder" alt="QR PayOS" />
                </div>
                {qr.checkoutUrl && qr.checkoutUrl !== '#' && (
                  <a href={qr.checkoutUrl} target="_blank" rel="noreferrer" className="payos-open-link">Mở trang thanh toán PayOS ↗</a>
                )}
                <p className="payos-polling-hint">⟳ Hệ thống tự cập nhật khi thanh toán xong</p>
              </>
            )}
            {done && (
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => onDone(doneMsg)}>Đóng &amp; Làm mới →</button>
            )}
          </div>
        )}

        <div className="rc-modal-actions">
          <button className="link" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

// Phòng đã sẵn sàng để nhận chưa + ai đang dọn. BE chỉ gắn cho lễ tân (khách không thấy).
const readyOf = (m) => {
  if (!m.room) return null
  if (!m.room.status || m.room.status === 'available') return m.room.awaitingRestock
    ? { text: 'Chờ bổ sung thiết bị', cls: 'fit-short', ready: false }
    : { text: 'Sẵn sàng', cls: 'fit-exact', ready: true }
  if (m.room.status === 'cleaning') {
    // 3 tình huống KHÁC NHAU, đừng gộp: không có việc nào (bất thường) / có việc chưa ai nhận / đang dọn dở.
    if (!m.cleaning) return { text: '⚠️ Phòng kẹt: không có việc dọn nào đang mở', cls: 'fit-short', ready: false, stuck: true }
    const who = m.cleaning.housekeeper
    const verb = m.cleaning.status === 'in_progress' ? 'Đang dọn' : 'Chờ dọn'
    return { text: `${verb}${who ? ` — ${who}` : ' — chưa ai nhận việc'}`, cls: 'fit-short', ready: false }
  }
  if (m.room.status === 'occupied') return { text: 'Đang có khách', cls: 'fit-exact', ready: true }
  return { text: m.room.status, cls: 'fit-short', ready: false }
}

export default function GroupDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null) // { group, members, payments, rollup }
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  // Tông của thông báo kết quả: 'ok' = làm hết, 'warn' = làm được một phần (còn việc), 'bad' = không làm được gì.
  const [msgTone, setMsgTone] = useState('ok')
  const [loading, setLoading] = useState(false)
  const [payModal, setPayModal] = useState(null) // { type, amount, title }
  const [showTransfer, setShowTransfer] = useState(false)

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

  // Thao tác hàng loạt: áp cho các phòng đủ điều kiện; báo done + phòng bị bỏ qua (lý do).
  const runGroupAction = async (label, fn, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setErr(''); setMsg(''); setMsgTone('ok'); setLoading(true)
    try {
      const res = await fn()
      let m = `${label}: ${res.done} phòng`
      if (res.collected) m += ` · thu ${vnd(res.collected)}`
      if (res.skipped?.length) m += ` · bỏ qua ${res.skipped.length} phòng (${res.skipped.map((s) => s.message).join('; ')})`
      setMsg(m)
      // Xanh chỉ khi làm hết. Còn phòng bị bỏ qua = vẫn còn việc -> không được xanh.
      setMsgTone(res.done === 0 ? 'bad' : res.skipped?.length ? 'warn' : 'ok')
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
  // Phòng đã cọc, đang chờ nhận — cái nào chưa sẵn sàng thì "Nhận tất cả" sẽ bỏ qua.
  const waiting = members.filter((m) => m.status === 'confirmed')
  const blockers = waiting.filter((m) => { const r = readyOf(m); return r && !r.ready })
  const readyToCheckIn = waiting.length - blockers.length
  // Trả phòng: phòng chưa nhận thì không có gì để trả -> nói trước, đừng để trả xong mới thấy nhóm còn treo.
  const inHouse = members.filter((m) => m.status === 'checked_in')
  const notCheckedIn = members.filter((m) => ['pending', 'confirmed'].includes(m.status))

  // Số tiền CHÍNH XÁC theo phòng đủ điều kiện (QR/tiền mặt sẽ thu đúng con số này)
  const pendingMembers = members.filter((m) => m.status === 'pending')
  const pendingDeposit = pendingMembers.reduce((s, m) => s + (m.depositAmount || 0), 0)
  const pendingTotal = pendingMembers.reduce((s, m) => s + (m.totalAmount || 0), 0)
  const checkinRemaining = members.filter((m) => m.status === 'checked_in').reduce((s, m) => s + Math.max(0, m.remainingAmount || 0), 0)

  return (
    <div className="rc-detail">
      <div className="rc-bar">
        <h2>
          Nhóm {group.code} <span className={'rc-badge s-' + rollup.status}>{bookingStatusLabel(rollup.status)}</span>
          {/* Trạng thái trên chỉ là pha CHÍNH — nhóm lệch pha thì phải nói rõ, đừng để lễ tân tưởng cả nhóm như nhau */}
          {rollup.mixed && <span className="rc-badge s-mixed" style={{ marginLeft: 6 }}>Hỗn hợp</span>}
        </h2>
        <Link to="/reception/bookings">← Danh sách</Link>
      </div>
      {err && <p className="rc-err">{err}</p>}
      {msg && <p className={msgTone === 'bad' ? 'rc-err' : msgTone === 'warn' ? 'rc-warn' : 'rc-ok'}>{msg}</p>}

      {/* Cảnh báo TRƯỚC khi bấm "Nhận tất cả" — thay vì bấm xong mới báo "bỏ qua N phòng" */}
      {canCheckIn && blockers.length > 0 && (
        <p className="rc-err">
          ⚠️ {blockers.length === waiting.length ? 'Chưa nhận được phòng nào' : `${blockers.length}/${waiting.length} phòng chưa nhận được`}:
          {' '}{blockers.map((m) => `${m.room?.roomNumber} (${readyOf(m).text})`).join(' · ')}
          {' — '}gọi nhân viên buồng phòng để dọn xong rồi nhận.
        </p>
      )}

      {/* Trả phòng mà nhóm còn phòng chưa ai nhận: trả xong nhóm VẪN treo -> nói trước, không để lễ tân tưởng xong việc */}
      {canCheckOut && notCheckedIn.length > 0 && (
        <p className="rc-warn">
          ⚠️ Nhóm còn <b>{notCheckedIn.length} phòng khách chưa nhận</b> ({notCheckedIn.map((m) => m.room?.roomNumber || '—').join(', ')}).
          {' '}Trả phòng sẽ <b>không đụng tới</b> các phòng này — trả xong nhóm vẫn chưa kết thúc.
          {' '}Mở từng phòng để quyết <b>no-show</b> (giữ cọc) hoặc <b>huỷ</b>.
        </p>
      )}

      {/* Một khu thao tác, ĐÚNG MỘT nút vàng = việc chính lúc này (thu cọc -> nhận -> trả).
          Việc phụ để nút viền; huỷ/no-show là nút đỏ tự đẩy sang phải. */}
      {(hasPending || canCheckIn || canCheckOut || canCancel || canNoShow) && (
        <div className="rc-actions">
          {hasPending && (
            <>
              <button className="primary" disabled={loading}
                onClick={() => setPayModal({ type: 'deposit', amount: pendingDeposit, title: 'Thu cọc nhóm' })}>
                Thu cọc nhóm {vnd(pendingDeposit)}
              </button>
              <button disabled={loading}
                onClick={() => setPayModal({ type: 'full', amount: pendingTotal, title: 'Thu toàn bộ nhóm' })}>
                Thu toàn bộ {vnd(pendingTotal)}
              </button>
            </>
          )}
          {/* Nút phải NÓI ĐÚNG việc nó sắp làm: ghi "tất cả" mà chỉ nhận được một phần là nói dối lễ tân.
              Không phòng nào sẵn sàng -> khoá luôn, đừng để bấm rồi mới báo "0 phòng". */}
          {canCheckIn && (
            <button className={hasPending ? '' : 'primary'} disabled={loading || readyToCheckIn === 0}
              title={readyToCheckIn === 0 ? 'Chưa phòng nào sẵn sàng để nhận' : undefined}
              onClick={() => runGroupAction('Đã nhận', () => bookingService.checkInGroup(id))}>
              {readyToCheckIn === 0
                ? 'Chưa nhận được phòng nào'
                : blockers.length === 0
                  ? `Nhận tất cả (${waiting.length} phòng)`
                  : `Nhận ${readyToCheckIn}/${waiting.length} phòng sẵn sàng`}
            </button>
          )}
          {canCheckOut && (
            <button className={hasPending || canCheckIn ? '' : 'primary'} disabled={loading}
              onClick={() => setPayModal({ type: 'remaining', amount: checkinRemaining, title: 'Trả phòng cả nhóm' })}>
              {notCheckedIn.length > 0
                ? `Trả ${inHouse.length}/${rollup.activeCount} phòng đang ở`
                : `Trả tất cả (${inHouse.length} phòng)`}
              {checkinRemaining > 0 ? ` · còn ${vnd(checkinRemaining)}` : ''}
            </button>
          )}
          {/* Đổi phòng: chỉ khi có phòng ĐANG Ở (đổi giữa kỳ) */}
          {canCheckOut && (
            <button disabled={loading} onClick={() => setShowTransfer(true)}>
              Đổi phòng
            </button>
          )}
          {canNoShow && (
            <button disabled={loading} onClick={() => runGroupAction('No-show', () => bookingService.noShowGroupAll(id),
              'Đánh no-show CẢ NHÓM (giữ cọc)?')}>
              No-show tất cả
            </button>
          )}
          {canCancel && (
            <button className="danger" disabled={loading}
              onClick={() => runGroupAction('Đã huỷ', () => bookingService.cancelGroupAll(id, {}),
                'Huỷ CẢ NHÓM (các phòng chưa nhận)? Cọc đã thu KHÔNG hoàn.')}>
              Huỷ tất cả
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
          {rollup.mixed && <p style={{ color: '#7c3aed' }}>Các phòng đang <b>lệch trạng thái</b>: {mixedSummary(rollup)} — xem bảng bên phải.</p>}
          <p>Tổng khách: {group.adultsTotal} người lớn + {group.childrenTotal} trẻ em</p>
          <p>Thanh toán: <b>{paymentStatusLabel(rollup.paymentStatus)}</b></p>

          <h3>Giao dịch</h3>
          {payments.length ? (
            <ul className="rc-hist">
              {payments.map((p) => <li key={p._id}>{fmtDateTime(p.paidAt || p.createdAt)}: {p.type === 'deposit' ? 'Cọc' : 'Còn lại'} {vnd(p.amount)} ({p.method}{p.status !== 'paid' ? ` · ${p.status}` : ''})</li>)}
            </ul>
          ) : <p className="rc-muted">Chưa có giao dịch</p>}
        </section>

        <section>
          <h3>Các phòng trong nhóm</h3>
          <div className="rc-table-wrap">
          <table className="rc-table">
            <thead><tr>
              <th>Phòng</th><th>Khách</th><th>Trạng thái</th><th>Tình trạng phòng</th><th className="rc-num">Tiền</th><th></th>
            </tr></thead>
            <tbody>
              {members.map((m) => {
                const rd = readyOf(m)
                return (
                  <tr key={m._id}>
                    <td><b style={{ fontSize: 15 }}>{m.room?.roomNumber || '—'}</b><br /><small>{m.roomType?.name}</small></td>
                    <td>{m.adults}NL{m.children > 0 ? ` + ${m.children}TE` : ''}</td>
                    <td><span className={'rc-badge s-' + m.status}>{bookingStatusLabel(m.status)}</span></td>
                    {/* Chỉ có nghĩa khi đang chờ nhận; phòng đã trả/huỷ thì trạng thái vật lý không liên quan */}
                    <td>{m.status === 'confirmed' && rd
                      ? <span className={'rc-fit ' + rd.cls}>{rd.text}</span>
                      : <span className="rc-muted">—</span>}</td>
                    <td className="rc-num">{vnd(m.totalAmount)}</td>
                    <td><Link className="link" to={`/reception/bookings/${m._id}`}>Mở →</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>

          <h3>Hoá đơn gom</h3>
          <table className="rc-bill"><tbody>
            <tr className="tot"><td>Tổng nhóm</td><td>{vnd(rollup.totalAmount)}</td></tr>
            <tr className="paid"><td>Đã trả</td><td>{vnd(rollup.paidAmount)}</td></tr>
            <tr className="due"><td>Còn lại</td><td>{vnd(rollup.remainingAmount)}</td></tr>
          </tbody></table>
          <p className="rc-muted" style={{ marginTop: 12 }}>
            Dùng nút <b>“… tất cả”</b> ở trên để thao tác cả nhóm 1 lần (áp cho phòng đủ điều kiện; phòng chưa sẵn sàng sẽ được báo). Thu tiền (cọc / toàn bộ / còn lại) chọn <b>QR PayOS</b> hoặc <b>tiền mặt</b>. Vẫn có thể <b>Mở →</b> từng phòng để thao tác lẻ; tổng nhóm tự tính lại.
          </p>
        </section>
      </div>

      {payModal && (
        <GroupPayModal
          groupId={id}
          type={payModal.type}
          amount={payModal.amount}
          title={payModal.title}
          onClose={() => { setPayModal(null); reload() }}
          onDone={(m) => { setMsg(m); setPayModal(null); reload() }}
          onError={(e) => setErr(e)}
        />
      )}

      {showTransfer && (
        <TransferModal
          groupId={id}
          group={group}
          currentMembers={members.filter((m) => m.status === 'checked_in')}
          onClose={() => setShowTransfer(false)}
          onDone={(res) => {
            setShowTransfer(false)
            let m = `Đã đổi phòng: giữ ${res.kept}, rời ${res.dropped}, nhận thêm ${res.added}`
            if (res.refundDue > 0) m += ` · cần hoàn khách ${vnd(res.refundDue)}`
            else if (res.groupRemaining > 0) m += ` · còn thu ${vnd(res.groupRemaining)}`
            setMsg(m); setMsgTone(res.refundDue > 0 ? 'warn' : 'ok'); reload()
          }}
          onError={(e) => { setErr(e); setShowTransfer(false) }}
        />
      )}
    </div>
  )
}
