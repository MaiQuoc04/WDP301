// Đổi phòng CẢ NHÓM (UC-37): lễ tân chọn lại DÀN PHÒNG mới kiểu walk-in.
// - Phòng đang ở được CHỌN SẴN (giữ). Bỏ tick = rời phòng đó -> chọn giao dọn hay để trống.
// - Chọn thêm phòng trống = nhận thêm phòng. Backend tự chia khách + tính tiền theo mốc.
// - Xem trước tiền (tổng mới, cần thu thêm / cần hoàn) TRƯỚC khi xác nhận.
import { useEffect, useMemo, useState } from 'react'
import { bookingService, vnd } from '../../services'

const ymdLocal = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export default function TransferModal({ groupId, group, currentMembers, onClose, onDone, onError }) {
  const today = ymdLocal(new Date())
  const checkOutStr = ymdLocal(group.checkOut)

  // Phòng đang ở (giữ mặc định). Map roomId -> { bookingId, roomNumber, floor, roomTypeName }
  const curRooms = useMemo(() => currentMembers.map((m) => ({
    roomId: String(m.room?._id), bookingId: String(m._id),
    roomNumber: m.room?.roomNumber, floor: m.room?.floor, roomTypeName: m.roomType?.name,
  })).filter((r) => r.roomId), [currentMembers])
  const curIds = useMemo(() => new Set(curRooms.map((r) => r.roomId)), [curRooms])

  const [avail, setAvail] = useState([])
  const [picked, setPicked] = useState(() => new Set(curRooms.map((r) => r.roomId))) // giữ hết ban đầu
  const [vacate, setVacate] = useState({})   // bookingId -> 'clean' | 'available'
  const [hkPick, setHkPick] = useState({})   // bookingId -> housekeeperId (đè gợi ý người dọn)
  const [preview, setPreview] = useState(null)
  const [pvErr, setPvErr] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Phòng trống cho khoảng CÒN LẠI [hôm nay → trả]. Khách của nhóm (tổng) để tính sức chứa/nhãn.
  useEffect(() => {
    bookingService.searchRooms({
      checkIn: today, checkOut: checkOutStr,
      adults: group.adultsTotal || 1, children: group.childrenTotal || 0,
    }).then((list) => setAvail(list || [])).catch(() => setAvail([]))
      .finally(() => setLoadingRooms(false))
  }, [today, checkOutStr, group.adultsTotal, group.childrenTotal])

  // Danh sách chọn = phòng đang ở (luôn hiện) + phòng trống (chưa phải phòng của nhóm).
  const rows = useMemo(() => {
    const seen = new Set(curRooms.map((r) => r.roomId))
    const extra = (avail || []).filter((r) => !seen.has(String(r.roomId))).map((r) => ({
      roomId: String(r.roomId), roomNumber: r.roomNumber, floor: r.floor,
      roomTypeName: r.roomType?.name, roomCharge: r.roomCharge, current: false,
    }))
    return [...curRooms.map((r) => ({ ...r, current: true })), ...extra]
  }, [curRooms, avail])

  const toggle = (roomId) => setPicked((prev) => {
    const next = new Set(prev)
    next.has(roomId) ? next.delete(roomId) : next.add(roomId)
    return next
  })

  // Phòng đang ở bị BỎ tick = rời đi -> cần quyết giao dọn / để trống.
  const droppedCur = curRooms.filter((r) => !picked.has(r.roomId))

  // Người dọn: pool HK của chi nhánh + gợi ý auto mỗi phòng bỏ (từ preview). Lễ tân đổi tay được.
  const hkPool = preview?.housekeepers || []
  const suggById = useMemo(
    () => Object.fromEntries((preview?.droppedRooms || []).map((d) => [String(d.bookingId), d.housekeeperId ? String(d.housekeeperId) : ''])),
    [preview],
  )
  const isClean = (bookingId) => (vacate[bookingId] || 'clean') === 'clean'
  const hkOf = (bookingId) => (hkPick[bookingId] !== undefined ? hkPick[bookingId] : (suggById[bookingId] || ''))
  // Tải việc hiển thị = việc đang có + số phòng bỏ (đang giao dọn) mà lễ tân dồn cho người này.
  const loadOf = (accountId) => {
    const base = hkPool.find((h) => String(h.accountId) === String(accountId))?.activeTasks || 0
    const extra = droppedCur.filter((r) => isClean(r.bookingId) && String(hkOf(r.bookingId)) === String(accountId)).length
    return base + extra
  }

  // Gọi preview mỗi khi đổi lựa chọn (gộp nhiều tick liên tiếp).
  useEffect(() => {
    if (!picked.size) { setPreview(null); setPvErr('Chọn ít nhất 1 phòng'); return }
    let cancelled = false
    const t = setTimeout(() => {
      bookingService.previewTransferGroup(groupId, [...picked].map((roomId) => ({ roomId })))
        .then((res) => { if (!cancelled) { setPreview(res.data || res); setPvErr('') } })
        .catch((e) => { if (!cancelled) { setPreview(null); setPvErr(e.response?.data?.message || 'Lỗi xem trước') } })
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [groupId, picked])

  const noChange = picked.size === curIds.size && [...picked].every((id) => curIds.has(id))

  const submit = async () => {
    setSubmitting(true)
    try {
      const items = [...picked].map((roomId) => ({ roomId }))
      const vac = Object.fromEntries(droppedCur.map((r) => [r.bookingId, vacate[r.bookingId] || 'clean']))
      // Người dọn chỉ gửi cho phòng GIAO DỌN; bỏ trống = không cần. Rỗng thì backend tự phân.
      const assignees = {}
      droppedCur.forEach((r) => { if (isClean(r.bookingId) && hkOf(r.bookingId)) assignees[r.bookingId] = hkOf(r.bookingId) })
      const res = await bookingService.transferGroup(groupId, { items, vacate: vac, assignees })
      onDone(res.data || res)
    } catch (e) {
      onError(e.response?.data?.message || 'Lỗi đổi phòng')
      setSubmitting(false)
    }
  }

  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal payos-modal wide" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: 'var(--rc-text-main)' }}>Đổi phòng — Nhóm {group.code}</h3>
        <p className="rc-modal-hint">
          Tick phòng khách sẽ ở từ hôm nay. Bỏ tick phòng đang ở = rời phòng đó. Tiền các đêm đã ở được giữ nguyên,
          đêm còn lại tính theo dàn phòng mới.
        </p>

        {loadingRooms ? <p className="rc-muted" style={{ padding: '12px 0' }}>Đang tải phòng trống…</p> : (
          <div className="rc-table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table className="rc-table" style={{ marginBottom: 0 }}>
              <thead><tr>
                <th style={{ width: 40 }}></th><th>Phòng</th><th>Loại</th>
                <th className="rc-num">Tiền/đêm còn lại</th><th></th>
              </tr></thead>
              <tbody>
                {rows.map((r) => {
                  const on = picked.has(r.roomId)
                  return (
                    <tr key={r.roomId} className={on ? 'rc-row-on' : ''} style={{ cursor: 'pointer' }} onClick={() => toggle(r.roomId)}>
                      <td><input type="checkbox" checked={on} readOnly /></td>
                      <td><b>{r.roomNumber}</b>{r.floor != null && <> <small>T{r.floor}</small></>}</td>
                      <td>{r.roomTypeName || '—'}</td>
                      <td className="rc-num">{r.roomCharge != null ? vnd(r.roomCharge) : <span className="rc-muted">—</span>}</td>
                      <td>{r.current
                        ? <span className="rc-fit fit-exact">Đang ở</span>
                        : <span className="rc-fit fit-surplus">Phòng trống</span>}</td>
                    </tr>
                  )
                })}
                {!rows.length && <tr><td colSpan={5} className="rc-empty">Không có phòng</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Phòng đang ở bị bỏ tick -> quyết giao dọn / để trống */}
        {droppedCur.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p className="payos-section-label">Phòng rời đi — xử lý dọn dẹp</p>
            {droppedCur.map((r) => {
              const clean = isClean(r.bookingId)
              const cur = hkOf(r.bookingId)
              const changed = String(cur) !== String(suggById[r.bookingId] || '')
              return (
                <div key={r.bookingId} className="rc-vacate-item">
                  <div className="rc-vacate-row">
                    <span><b>{r.roomNumber}</b> <small className="rc-muted">{r.roomTypeName}</small></span>
                    <div className="rc-seg" style={{ margin: 0, flex: '0 0 auto' }}>
                      <button className={'rc-seg-btn' + (clean ? ' on' : '')}
                        onClick={() => setVacate((v) => ({ ...v, [r.bookingId]: 'clean' }))}>Giao dọn</button>
                      <button className={'rc-seg-btn' + (vacate[r.bookingId] === 'available' ? ' on' : '')}
                        onClick={() => setVacate((v) => ({ ...v, [r.bookingId]: 'available' }))}>Để trống ngay</button>
                    </div>
                  </div>
                  {clean && hkPool.length > 0 && (
                    <div className="rc-vacate-hk">
                      <label className="rc-muted">Người dọn</label>
                      <select className={'rc-hk-pick' + (changed ? ' changed' : '')} value={cur}
                        onChange={(e) => setHkPick((p) => ({ ...p, [r.bookingId]: e.target.value }))}>
                        {!suggById[r.bookingId] && <option value="">— chưa xác định —</option>}
                        {hkPool.map((h) => (
                          <option key={h.accountId} value={String(h.accountId)}>
                            {h.name} · {loadOf(h.accountId)} việc{h.floors?.length ? ` · T${h.floors.join(',')}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {clean && hkPool.length === 0 && (
                    <p className="rc-hint" style={{ margin: '4px 0 0' }}>Chi nhánh chưa có nhân viên buồng phòng — task dọn sẽ chờ phân sau.</p>
                  )}
                </div>
              )
            })}
            <p className="rc-hint">Giao dọn = nhân viên buồng phòng kiểm kê (bắt đồ khách làm hỏng). Để trống = mở bán ngay, không kiểm kê.</p>
          </div>
        )}

        {/* Xem trước tiền */}
        {pvErr && <p className="rc-err" style={{ marginTop: 12 }}>{pvErr}</p>}
        {preview && !pvErr && (
          <div className="rc-xfer-preview">
            <div className="row"><span>Tổng tiền mới (theo dàn phòng mới)</span><b>{vnd(preview.newTotal)}</b></div>
            <div className="row"><span>Đã thanh toán</span><span>{vnd(preview.paid)}</span></div>
            {preview.refundDue > 0
              ? <div className="row due refund"><span>Cần hoàn lại khách</span><b>{vnd(preview.refundDue)}</b></div>
              : <div className="row due"><span>Còn phải thu (khi trả phòng)</span><b>{vnd(preview.collectMore)}</b></div>}
          </div>
        )}

        <div className="rc-modal-actions">
          <button className="link" onClick={onClose}>Huỷ</button>
          <button className="primary" disabled={submitting || !preview || !!pvErr || noChange}
            title={noChange ? 'Chưa thay đổi dàn phòng' : undefined}
            onClick={submit}>
            {submitting ? 'Đang đổi…' : 'Xác nhận đổi phòng'}
          </button>
        </div>
      </div>
    </div>
  )
}
