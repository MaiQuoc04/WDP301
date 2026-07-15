import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingService, vnd, fmtDate, fmtDateTime, bookingStatusLabel, paymentStatusLabel } from '../../services'
import { socket, connectSocket } from '../../services/socketService'
import PayOSQRCode from '../../components/PayOSQRCode'

const HK_STATUS = { pending: 'Chờ nhận', in_progress: 'Đang làm', urgent: 'Khẩn', completed: 'Xong', missed: 'Bỏ lỡ' }

/* ─── QR Countdown ──────────────────────────────────────────────── */
function QRCountdown({ expireMs }) {
  const [left, setLeft] = useState(Math.max(0, expireMs - Date.now()))
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, expireMs - Date.now())), 1000)
    return () => clearInterval(t)
  }, [expireMs])
  const m = Math.floor(left / 60000)
  const s = Math.floor((left % 60000) / 1000)
  if (left <= 0) return <span style={{ color: '#dc2626', fontWeight: 600 }}>⌛ Mã QR đã hết hạn</span>
  return (
    <span style={{ color: left < 60000 ? '#dc2626' : '#b45309', fontWeight: 600 }}>
      ⏱ Còn {m}:{String(s).padStart(2, '0')}
    </span>
  )
}

/* ─── Modal chọn số giờ (nhận sớm / trả muộn) ───────────────────
   Thay window.prompt: hộp thoại trình duyệt không hiện được luật tính phí cho ra hồn,
   và gõ tay thì nhập được cả "abc" lẫn số quá hạn mức. */
function HoursModal({ title, note, max, confirmLabel, onPick, onClose }) {
  const [h, setH] = useState(1)
  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: 'var(--rc-text-main)' }}>{title}</h3>
        <p className="rc-modal-hint">{note}</p>
        <div className="rc-hours">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button key={n} className={'rc-hour' + (h === n ? ' on' : '')} onClick={() => setH(n)}>
              {n} giờ
            </button>
          ))}
        </div>
        <div className="rc-modal-actions">
          <button className="link" onClick={onClose}>Huỷ</button>
          <button className="primary" onClick={() => onPick(h)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Payment Method Modal (Reception Checkout) ───────────────────
   Cùng ngôn ngữ với trả phòng CẢ NHÓM: người dọn hiện NGAY cạnh số tiền, chọn sẵn
   người hệ thống gợi ý; xong mới tới phương thức. Trước đây phải chọn phương thức
   trước mới thấy người dọn, mà đường QR thì tận khi khách trả tiền xong mới được chọn
   -> hai màn cùng một việc lại hỏi theo hai thứ tự khác nhau. */
function CheckoutPaymentModal({ bookingId, roomNumber, remainingAmount, onClose, onSuccess, onError }) {
  const [step, setStep] = useState('choose')       // 'choose' | 'qr'
  const [qrData, setQrData] = useState(null)       // { qrCode, checkoutUrl, amount, orderCode }
  const [loading, setLoading] = useState(false)
  const [hkPick, setHkPick] = useState([])
  const [hkLoading, setHkLoading] = useState(true)
  const [hkId, setHkId] = useState('')             // người dọn đang chọn (mặc định = gợi ý tốt nhất)
  const [paymentDone, setPaymentDone] = useState(false)
  const expireAt = useRef(null)

  // Nạp người dọn NGAY khi mở modal (không đợi chọn phương thức) + chọn sẵn người đầu danh sách.
  // getHousekeepers đã sắp xếp đúng tầng -> ít việc nhất, nên [0] chính là gợi ý của hệ thống.
  useEffect(() => {
    let cancelled = false
    bookingService.getHousekeepers(bookingId)
      .then((list) => {
        if (cancelled) return
        setHkPick(list)
        setHkId(list[0] ? String(list[0].accountId) : '')
      })
      .catch(() => { if (!cancelled) setHkPick([]) })
      .finally(() => { if (!cancelled) setHkLoading(false) })
    return () => { cancelled = true }
  }, [bookingId])

  // Lắng nghe socket payment_success để tự cập nhật
  useEffect(() => {
    connectSocket()
    const onPaySuccess = (evt) => {
      if (String(evt?.bookingId) === String(bookingId) || String(evt?.bookingId?._id) === String(bookingId)) {
        setPaymentDone(true)
      }
    }
    socket.on('payment_success', onPaySuccess)
    return () => socket.off('payment_success', onPaySuccess)
  }, [bookingId])

  // Polling PayOS mỗi 5s khi đang hiển thị QR (fallback khi webhook không tới localhost)
  useEffect(() => {
    if (step !== 'qr' || paymentDone) return
    const timer = setInterval(async () => {
      try {
        const res = await bookingService.syncPayments(bookingId)
        if (res?.synced > 0) setPaymentDone(true)
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(timer)
  }, [step, paymentDone, bookingId])

  const handleChooseQR = async () => {
    setLoading(true)
    try {
      const data = await bookingService.createCheckoutQR(bookingId)
      setQrData(data)
      expireAt.current = new Date(data.expiresAt).getTime() // mốc do backend kẹp (<= hạn giữ chỗ)
      setStep('qr')
    } catch (e) {
      onError(e.response?.data?.message || 'Không tạo được QR')
    } finally {
      setLoading(false)
    }
  }

  // Tiền mặt: người dọn đã chọn sẵn ở trên -> thu tiền & trả phòng luôn, không hỏi thêm bước nào.
  const handleCashCheckout = async () => {
    setLoading(true)
    try {
      await bookingService.checkOutCash(bookingId, { housekeeperId: hkId })
      onSuccess('Check-out thành công (tiền mặt)')
      onClose()
    } catch (e) {
      onError(e.response?.data?.message || 'Lỗi check-out')
      setLoading(false)
    }
  }

  // QR đã thanh toán -> chuyển status với người dọn đã chọn từ đầu.
  // Không còn bước 'qr-done-hk': bắt lễ tân chọn người SAU khi khách trả tiền là lúc
  // khách đã đứng dậy đi rồi, và khác hẳn thứ tự của màn trả phòng cả nhóm.
  const handleQRCheckoutDone = async () => {
    setLoading(true)
    try {
      await bookingService.checkOut(bookingId, { method: 'online_qr', housekeeperId: hkId })
      onSuccess('Check-out thành công (QR đã thanh toán)')
      onClose()
    } catch (e) {
      onError(e.response?.data?.message || 'Lỗi check-out')
      setLoading(false)
    }
  }

  // Đã trả đủ tiền từ trước -> chỉ cần chốt trả phòng.
  const handleCheckoutPaid = async () => {
    setLoading(true)
    try {
      await bookingService.checkOut(bookingId, { method: 'cash', housekeeperId: hkId })
      onSuccess('Check-out thành công')
      onClose()
    } catch (e) {
      onError(e.response?.data?.message || 'Lỗi check-out')
      setLoading(false)
    }
  }

  // Khối chọn người dọn — dùng chung cho mọi nhánh, luôn nằm TRƯỚC phương thức.
  const hkBlock = (
    <div style={{ marginBottom: 18 }}>
      <p className="payos-section-label">Người được giao dọn phòng {roomNumber || ''}</p>
      {hkLoading ? <p className="rc-muted">Đang tải danh sách…</p> : hkPick.length ? (
        <select className="rc-hk-pick" value={hkId} onChange={(e) => setHkId(e.target.value)}>
          {hkPick.map((h) => (
            <option key={h.accountId} value={String(h.accountId)}>
              {h.fullName || h.email} · {h.activeTasks} việc{h.onFloor ? ' · đúng tầng' : ''}
            </option>
          ))}
        </select>
      ) : <p className="rc-err">Chi nhánh chưa có nhân viên buồng phòng — không trả phòng được.</p>}
    </div>
  )
  const canGo = !!hkId && !loading

  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal payos-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Bước 1: Chọn phương thức ── */}
        {step === 'choose' && (
          <>
            <h3 style={{ color: 'var(--rc-text-main)' }}>Trả phòng {roomNumber || ''} — Thanh toán</h3>
            <div className="payos-amount-box">
              <span className="lbl">Số tiền còn lại</span>
              <span className="val">{vnd(remainingAmount)}</span>
            </div>

            {/* Người dọn TRƯỚC phương thức — cùng thứ tự với màn trả phòng cả nhóm */}
            {hkBlock}

            {remainingAmount <= 0 ? (
              <>
                <div className="payos-paid-banner">✅ Đã thanh toán đủ — có thể trả phòng</div>
                <div className="rc-modal-actions">
                  <button className="link" onClick={onClose}>Huỷ</button>
                  <button className="primary" disabled={!canGo} onClick={handleCheckoutPaid}>
                    {loading ? 'Đang xử lý…' : 'Trả phòng →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="payos-section-label">Chọn phương thức</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button className="payos-opt qr" onClick={handleChooseQR} disabled={!canGo}>
                    <span className="payos-opt-icon">📱</span>
                    <span className="payos-opt-text">
                      <b>Thanh toán QR</b>
                      <small>Khách quét QR PayOS</small>
                    </span>
                    <span className="payos-opt-arrow">›</span>
                  </button>
                  <button className="payos-opt cash" onClick={handleCashCheckout} disabled={!canGo}>
                    <span className="payos-opt-icon">💵</span>
                    <span className="payos-opt-text">
                      <b>Tiền mặt</b>
                      <small>Trả phòng &amp; thu tiền mặt tại quầy</small>
                    </span>
                    <span className="payos-opt-arrow">›</span>
                  </button>
                </div>
                <div className="rc-modal-actions">
                  <button className="link" onClick={onClose}>Huỷ</button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Bước 2A: Hiển thị QR ── */}
        {step === 'qr' && qrData && (
          <>
            <h3>Quét QR để thanh toán</h3>
            <div className="payos-qr-wrap">
              <div className="payos-qr-header">
                <span className="payos-amount">{vnd(qrData.amount)}</span>
                {expireAt.current && <QRCountdown expireMs={expireAt.current} />}
              </div>

              {paymentDone ? (
                <div className="payos-success-banner">
                  <span className="payos-success-icon">✅</span>
                  <div>
                    <strong>Thanh toán thành công!</strong>
                    <p>Khách đã thanh toán {vnd(qrData.amount)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="payos-qr-img-wrap">
                    <PayOSQRCode
                      value={qrData.qrCode}
                      size={210}
                      imageClassName="payos-qr-img"
                      qrClassName="payos-qr-img"
                      placeholderClassName="payos-qr-placeholder"
                      alt="QR PayOS"
                    />
                  </div>
                  <p className="payos-qr-hint">Sử dụng app ngân hàng quét mã QR hoặc</p>
                  {qrData.checkoutUrl && qrData.checkoutUrl !== '#' && (
                    <a href={qrData.checkoutUrl} target="_blank" rel="noreferrer" className="payos-open-link">
                      Mở trang thanh toán PayOS ↗
                    </a>
                  )}
                  <p className="payos-polling-hint">⟳ Hệ thống tự cập nhật khi khách thanh toán xong</p>
                </>
              )}
            </div>

            {/* Người dọn đã chốt ở bước trước -> chỉ còn 1 nút, không hỏi lại lần nữa */}
            {paymentDone && (
              <p className="rc-muted" style={{ textAlign: 'center', margin: '4px 0 0' }}>
                Sẽ giao dọn cho <b>{hkPick.find((h) => String(h.accountId) === String(hkId))?.fullName
                  || hkPick.find((h) => String(h.accountId) === String(hkId))?.email || '—'}</b>
              </p>
            )}
            <div className="rc-modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="link" onClick={onClose}>Đóng</button>
              {paymentDone ? (
                <button className="primary" onClick={handleQRCheckoutDone} disabled={loading}>
                  {loading ? 'Đang xử lý…' : 'Hoàn tất check-out →'}
                </button>
              ) : (
                <button className="link" onClick={() => setStep('choose')}>← Quay lại</button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

/* ─── Deposit QR Modal (lễ tân gen QR cho booking pending) ─────── */
function DepositQRModal({ bookingId, depositAmount, totalAmount, onClose, onSuccess, onError }) {
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [payFull, setPayFull] = useState(false) // thu cọc (mặc định) hay thu toàn bộ 1 lần
  const expireAt = useRef(null)
  const amount = payFull ? totalAmount : depositAmount

  useEffect(() => {
    connectSocket()
    const onPaySuccess = (evt) => {
      if (String(evt?.bookingId) === String(bookingId) || String(evt?.bookingId?._id) === String(bookingId)) {
        setPaymentDone(true)
      }
    }
    socket.on('payment_success', onPaySuccess)
    return () => socket.off('payment_success', onPaySuccess)
  }, [bookingId])

  // Polling PayOS mỗi 5s khi đang hiển thị QR (fallback khi webhook không tới localhost)
  useEffect(() => {
    if (!qrData || paymentDone) return
    const timer = setInterval(async () => {
      try {
        const res = await bookingService.syncPayments(bookingId)
        if (res?.synced > 0) setPaymentDone(true)
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(timer)
  }, [qrData, paymentDone, bookingId])

  const handleGenQR = async () => {
    setLoading(true)
    try {
      const data = await bookingService.createDepositQR(bookingId, payFull ? 'full' : 'deposit')
      setQrData(data)
      expireAt.current = new Date(data.expiresAt).getTime() // mốc do backend kẹp (<= hạn giữ chỗ)
    } catch (e) {
      onError(e.response?.data?.message || 'Không tạo được QR')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDone = async () => {
    try {
      await bookingService.confirmDeposit(bookingId, { method: 'cash', paidFull: payFull })
      onSuccess(payFull ? 'Đã thu toàn bộ (tiền mặt)' : 'Đã xác nhận thu cọc')
      onClose()
    } catch (e) {
      onError(e.response?.data?.message || 'Lỗi xác nhận')
    }
  }

  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal payos-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: 'var(--rc-text-main)' }}>Thu tiền — QR / Tiền mặt</h3>

        {/* Chọn thu cọc hay thu toàn bộ; QR và tiền mặt đều áp theo lựa chọn này */}
        {!qrData && (
          <div className="rc-seg">
            <button className={'rc-seg-btn' + (!payFull ? ' on' : '')} onClick={() => setPayFull(false)}>
              Cọc <b>{vnd(depositAmount)}</b>
            </button>
            <button className={'rc-seg-btn' + (payFull ? ' on' : '')} onClick={() => setPayFull(true)}>
              Toàn bộ <b>{vnd(totalAmount)}</b>
            </button>
          </div>
        )}

        <div className="payos-amount-box">
          <span className="lbl">Số tiền thu</span>
          <span className="val">{vnd(amount)}</span>
        </div>

        {!qrData && (
          <>
            <p className="payos-section-label">Chọn phương thức</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="payos-opt qr" onClick={handleGenQR} disabled={loading}>
                <span className="payos-opt-icon">📱</span>
                <span className="payos-opt-text">
                  <b>{loading ? 'Đang tạo QR…' : 'Tạo QR PayOS'}</b>
                  <small>Khách quét QR để thanh toán {payFull ? 'toàn bộ' : 'cọc'}</small>
                </span>
                <span className="payos-opt-arrow">›</span>
              </button>
              <button className="payos-opt cash" onClick={handleConfirmDone}>
                <span className="payos-opt-icon">💵</span>
                <span className="payos-opt-text">
                  <b>Thu tiền mặt</b>
                  <small>Xác nhận đã thu {payFull ? 'toàn bộ' : 'cọc'} tại quầy</small>
                </span>
                <span className="payos-opt-arrow">›</span>
              </button>
            </div>
          </>
        )}

        {qrData && (
          <div className="payos-qr-wrap">
            <div className="payos-qr-header">
              <span className="payos-amount">{vnd(qrData.amount)}</span>
              {expireAt.current && <QRCountdown expireMs={expireAt.current} />}
            </div>
            {paymentDone ? (
              <div className="payos-success-banner">
                <span className="payos-success-icon">✅</span>
                <div><strong>Thanh toán thành công!</strong></div>
              </div>
            ) : (
              <>
                <div className="payos-qr-img-wrap">
                  <PayOSQRCode
                    value={qrData.qrCode}
                    size={210}
                    imageClassName="payos-qr-img"
                    qrClassName="payos-qr-img"
                    placeholderClassName="payos-qr-placeholder"
                    alt="QR PayOS"
                  />
                </div>
                {qrData.checkoutUrl && qrData.checkoutUrl !== '#' && (
                  <a href={qrData.checkoutUrl} target="_blank" rel="noreferrer" className="payos-open-link">
                    Mở trang thanh toán PayOS ↗
                  </a>
                )}
                <p className="payos-polling-hint">⟳ Hệ thống tự cập nhật khi thanh toán xong</p>
              </>
            )}
            {paymentDone && (
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => { onSuccess(payFull ? 'Đã thu toàn bộ qua QR' : 'Đã xác nhận cọc qua QR'); onClose() }}>
                Đóng & Làm mới →
              </button>
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

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function BookingDetailPage() {
  const { id } = useParams()
  const [d, setD] = useState(null)        // { booking, payments, history }
  const [bill, setBill] = useState(null)
  const [services, setServices] = useState([])
  const [amenities, setAmenities] = useState([])
  const [hk, setHk] = useState(null)      // { activeInspection, lastInspectionDone, inspections, cleanings }
  const [pickerFor, setPickerFor] = useState(null) // 'inspection' | 'cleaning'
  const [hkPick, setHkPick] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showDepositQRModal, setShowDepositQRModal] = useState(false)
  const [hoursFor, setHoursFor] = useState(null)   // 'early' | 'late'

  const reload = useCallback(async () => {
    setErr('')
    try { setD(await bookingService.getBooking(id)); setBill(await bookingService.getBill(id)) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải') }
    try { setHk(await bookingService.getBookingHousekeeping(id)) } catch { /* ignore */ }
  }, [id])

  useEffect(() => { reload() }, [reload])
  useEffect(() => {
    bookingService.listServices().then(setServices).catch(() => {})
    bookingService.listAmenities().then(setAmenities).catch(() => {})
  }, [])
  // Realtime: housekeeper nhận/kiểm tra xong, payment thành công -> tự refresh
  useEffect(() => {
    connectSocket()
    const onNoti = () => reload()
    const onPaySuccess = () => { reload() }
    // Housekeeper vừa kiểm kê / hoàn tất kiểm tra phòng NÀY -> cập nhật thiết bị thiếu + bill ngay, không reload tay.
    const onBookingUpdated = (evt) => { if (String(evt?.bookingId) === String(id)) reload() }
    socket.on('notification', onNoti)
    socket.on('payment_success', onPaySuccess)
    socket.on('booking_updated', onBookingUpdated)
    return () => {
      socket.off('notification', onNoti)
      socket.off('payment_success', onPaySuccess)
      socket.off('booking_updated', onBookingUpdated)
    }
  }, [reload, id])

  const act = async (fn, okMsg) => {
    setErr(''); setMsg('')
    try { await fn(); setMsg(okMsg || 'Thành công'); await reload() }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi') }
  }

  if (!d) return <p>{err || 'Đang tải...'}</p>
  const b = d.booking
  const st = b.status
  const editable = ['confirmed', 'checked_in'].includes(st)

  // Mở picker chọn housekeeper để giao việc (inspection / cleaning)
  const openPicker = async (type) => {
    setPickerFor(type); setPickerLoading(true); setHkPick([]); setErr('')
    try { setHkPick(await bookingService.getHousekeepers(id)) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải nhân viên') }
    finally { setPickerLoading(false) }
  }
  const pick = async (hkId) => {
    const type = pickerFor
    setPickerFor(null)
    if (type === 'inspection') await act(() => bookingService.requestInspection(id, hkId), 'Đã giao kiểm tra phòng')
    else if (type === 'cleaning') await act(() => bookingService.requestCleaning(id, hkId), 'Đã giao dọn phòng')
  }
  const askEarly = () => setHoursFor('early')
  const askLate = () => setHoursFor('late')
  const inspectionCtrl = () => {
    const a = hk?.activeInspection
    if (a) return <span className={'hk-state ' + (a.status === 'in_progress' ? 'doing' : 'wait')}>
      {a.status === 'in_progress' ? '🧹 Housekeeper đang kiểm tra' : `⏳ Đã giao${a.assignedTo?.email ? ` (${a.assignedTo.email})` : ''} — chờ kiểm tra`}
    </span>
    if (hk?.lastInspectionDone) return <span className="hk-state done">✓ Đã check xong phòng</span>
    return <button onClick={() => openPicker('inspection')}>Yêu cầu kiểm tra phòng</button>
  }
  const hkList = (arr) => arr?.length ? (
    <ul className="rc-hk-list">
      {arr.map((t) => <li key={t._id}><span className={'hk-tag s-' + t.status}>{HK_STATUS[t.status] || t.status}</span> {fmtDateTime(t.requestedAt || t.createdAt)}{t.assignedTo?.email && ` · ${t.assignedTo.email}`}</li>)}
    </ul>
  ) : <p className="rc-muted">Chưa có</p>
  // !! bắt buộc: `[].length` là 0, và `{0 && <section/>}` render ra chữ "0" trên trang
  // (React chỉ bỏ qua false/null/undefined, KHÔNG bỏ qua số 0).
  const showHk = st === 'checked_in' || !!hk?.inspections?.length || !!hk?.cleanings?.length

  // Nhóm giờ được populate {_id, code} cho breadcrumb — tự thủ cả trường hợp còn là id trần.
  const groupId = b.group?._id || b.group || null
  const groupCode = b.group?.code || null
  const siblings = d.siblings || []

  return (
    <div className="rc-detail">
      {/* Breadcrumb: vào từ nhóm thì phải có đường về nhóm cho ra hồn. Trước đây nút thoát ghi
          "← Danh sách" và luôn ném về danh sách tổng, còn đường về nhóm bị chôn trong một câu văn. */}
      <nav className="rc-crumb">
        <Link to="/reception/bookings">Đặt phòng</Link>
        {groupId && <>
          <span className="sep">/</span>
          <Link to={`/reception/booking-groups/${groupId}`}>Nhóm {groupCode || ''}</Link>
        </>}
        <span className="sep">/</span>
        <span className="cur">Phòng {b.room?.roomNumber || b.code}</span>
      </nav>

      <div className="rc-bar">
        <div className="rc-bar-titles">
          {/* Số phòng mới là thứ lễ tân tìm, mã booking chỉ để đối chiếu -> đổi chỗ hai cái */}
          <h2>
            {b.room?.roomNumber ? `Phòng ${b.room.roomNumber}` : b.code}
            <span className={'rc-badge s-' + st} style={{ marginLeft: 10 }}>{bookingStatusLabel(st)}</span>
          </h2>
          <p className="rc-sub">{[b.roomType?.name, b.code].filter(Boolean).join(' · ')}</p>
        </div>
        <Link className="rc-btn-ghost" to={groupId ? `/reception/booking-groups/${groupId}` : '/reception/bookings'}>
          ← {groupId ? 'Về nhóm' : 'Danh sách'}
        </Link>
      </div>

      {/* Chuyển nhanh sang phòng khác cùng nhóm — khỏi thoát ra rồi bấm "Mở →" lại từ đầu */}
      {siblings.length > 1 && (
        <div className="rc-siblings">
          <span className="rc-siblings-lbl">Cùng nhóm · {siblings.length} phòng</span>
          {siblings.map((s) => (
            <Link key={s._id} to={`/reception/bookings/${s._id}`}
              className={'rc-sib' + (String(s._id) === String(id) ? ' on' : '')}
              title={bookingStatusLabel(s.status)}>
              <i className={'rc-sib-dot s-' + s.status} />
              {s.room?.roomNumber || '—'}
            </Link>
          ))}
        </div>
      )}

      {err && <p className="rc-err">{err}</p>}
      {msg && <p className="rc-ok">{msg}</p>}

      {/* Phòng chưa sẵn sàng: báo TRƯỚC khi lễ tân bấm Check-in, kèm AI đang dọn để gọi giục.
          Task dọn này là của khách TRƯỚC (turnover), không phải của booking đang mở. */}
      {st === 'confirmed' && b.room && b.room.status !== 'available' && (
        <p className="rc-err" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>
            ⚠️ Phòng <b>{b.room.roomNumber}</b> {b.room.status === 'cleaning' ? 'đang được dọn' : b.awaitingRestock || b.room.awaitingRestock ? 'đang chờ bổ sung thiết bị' : `đang ở trạng thái "${b.room.status}"`} — <b>chưa check-in được</b>.
            {d.roomCleaning ? (
              <> Phụ trách: <b>{d.roomCleaning.housekeeper || 'chưa ai nhận việc'}</b>
                {d.roomCleaning.status === 'in_progress' && d.roomCleaning.startedAt
                  ? <> · đang dọn từ {fmtDateTime(d.roomCleaning.startedAt)}</>
                  : d.roomCleaning.assignedAt ? <> · giao lúc {fmtDateTime(d.roomCleaning.assignedAt)}</> : null}
                {d.roomCleaning.isUrgent && <> · <b>đã đánh dấu gấp</b></>}
              </>
            ) : <> Chưa có việc dọn nào đang mở cho phòng này — kiểm tra lại trạng thái phòng.</>}
          </span>
        </p>
      )}

      {/* ĐÚNG MỘT nút vàng = việc chính theo pha hiện tại (thu cọc / check-in / check-out / hoàn tất).
          "Nhận sớm", "Trả muộn", "No-show" là ngoại lệ -> nút viền. "Huỷ" đỏ, tự đẩy sang phải. */}
      <div className="rc-actions">
        {st === 'pending' && (
          <button className="primary" onClick={() => setShowDepositQRModal(true)}>
            Thu cọc {vnd(b.depositAmount)} → QR / Tiền mặt
          </button>
        )}
        {st === 'confirmed' && <button className="primary" onClick={() => act(() => bookingService.checkIn(id), 'Đã check-in')}>Check-in</button>}
        {st === 'confirmed' && <button onClick={askEarly}>Nhận sớm</button>}
        {st === 'checked_in' && (
          <button className="primary" onClick={() => setShowCheckoutModal(true)}>
            Check-out — Thanh toán
          </button>
        )}
        {st === 'checked_in' && <button onClick={askLate}>Trả muộn</button>}
        {st === 'checked_out' && <button className="primary" onClick={() => act(() => bookingService.complete(id), 'Đã hoàn tất')}>Hoàn tất</button>}
        {st === 'confirmed' && <button onClick={() => act(() => bookingService.noShow(id), 'Đã đánh no-show')}>No-show</button>}
        {['pending', 'confirmed'].includes(st) &&
          <button className="danger" onClick={() => window.confirm('Huỷ booking này?') && act(() => bookingService.cancel(id, { reason: 'Huỷ tại quầy' }), 'Đã huỷ')}>Huỷ</button>}
      </div>

      {showHk && (
        <section className="rc-hk">
          <h3>Dọn dẹp & kiểm tra phòng</h3>
          {st === 'checked_in' && (
            <div className="rc-hk-actions">
              {inspectionCtrl()}
              <button className="hk-clean" onClick={() => openPicker('cleaning')}>Dọn phòng (khách yêu cầu)</button>
            </div>
          )}
          <div className="rc-hk-hist">
            <div><h4>Lịch sử kiểm tra</h4>{hkList(hk?.inspections)}</div>
            <div><h4>Lịch sử dọn theo yêu cầu</h4>{hkList(hk?.cleanings)}</div>
          </div>
        </section>
      )}

      <div className="rc-cols">
        <section>
          <h3>Thông tin</h3>
          <p>Khách: <b>{b.customer?.fullName || b.guestName}</b>{b.guestPhone && ` · ${b.guestPhone}`}</p>
          <p>Loại phòng: {b.roomType?.name} · Phòng: {b.room?.roomNumber || '— (gán khi check-in)'}</p>
          <p>Nhận {fmtDateTime(b.checkIn)} → Trả {fmtDateTime(b.checkOut)}</p>
          <p>Số khách: {b.adults} người lớn + {b.children} trẻ em</p>
          <p>Thanh toán: <b>{paymentStatusLabel(b.paymentStatus)}</b></p>
          {b.depositAmount > 0 && <p>Tiền cọc cần thu: <b style={{ color: 'var(--rc-gold)' }}>{vnd(b.depositAmount)}</b></p>}

          <h3>Lịch sử</h3>
          <ul className="rc-hist">
            {d.history.map((h) => <li key={h._id}>{fmtDateTime(h.createdAt)}: {h.fromStatus ? bookingStatusLabel(h.fromStatus) : '∅'} → {bookingStatusLabel(h.toStatus)}{h.note && ` (${h.note})`}</li>)}
          </ul>
        </section>

        <section>
          <h3>Hoá đơn</h3>
          {/* Chia NHÓM để khách hỏi "sao lại tính chỗ này" là chỉ đúng dòng được ngay.
              Khoản phát sinh (thiết bị thiếu / nhận sớm / trả muộn) tô đỏ — đó là chỗ hay bị thắc mắc. */}
          {bill && (
            <table className="rc-bill"><tbody>
              <tr className="grp"><td colSpan={2}>Tiền phòng</td></tr>
              <tr><td>Tiền phòng</td><td>{vnd(bill.roomCharge)}</td></tr>
              {bill.bedSurchargeApplied && bill.bedSurcharge > 0 && (
                <tr><td>Phụ phí giường phụ</td><td>{vnd(bill.bedSurcharge)}</td></tr>
              )}

              {bill.services.length > 0 && <tr className="grp"><td colSpan={2}>Dịch vụ</td></tr>}
              {bill.services.map((s) => (
                <tr key={s._id}><td>{s.name} ×{s.quantity}</td><td>{vnd(s.price * s.quantity)}</td></tr>
              ))}

              {bill.missingAmenities.length > 0 && <tr className="grp"><td colSpan={2}>Thiết bị thiếu</td></tr>}
              {bill.missingAmenities.map((a) => (
                <tr key={a._id}><td>{a.name} ×{a.quantity}</td><td className="extra">{vnd(a.price * a.quantity)}</td></tr>
              ))}

              {(bill.earlyHours > 0 || bill.lateHours > 0) && <tr className="grp"><td colSpan={2}>Phát sinh giờ</td></tr>}
              {bill.earlyHours > 0 && (
                <tr><td>Nhận sớm {bill.earlyHours}h</td><td className="extra">{vnd(bill.earlyFee)}</td></tr>
              )}
              {bill.lateHours > 0 && (
                <tr><td>Trả muộn {bill.lateHours}h {bill.lateFullNight ? '(sau 18h — tính 1 đêm)' : '(trước 18h)'}</td><td className="extra">{vnd(bill.lateFee)}</td></tr>
              )}

              <tr className="tot"><td>Tổng</td><td>{vnd(bill.totalAmount)}</td></tr>
              <tr className="paid"><td>Đã trả</td><td>{vnd(bill.paidAmount)}</td></tr>
              <tr className="due"><td>Còn lại</td><td>{vnd(bill.remainingAmount)}</td></tr>
            </tbody></table>
          )}

          {b.bedSurcharge > 0 && ['pending', 'confirmed', 'checked_in'].includes(st) &&
            <label className="rc-check">
              <input type="checkbox" checked={b.bedSurchargeApplied}
                onChange={(e) => act(() => bookingService.setBedSurcharge(id, e.target.checked), 'Cập nhật phụ phí')} />
              Áp phụ phí giường phụ ({vnd(b.bedSurcharge)})
            </label>}

          {editable && <>
            <h4>Dịch vụ {b.services.length > 0 && `· đã thêm ${b.services.length}`}</h4>
            {b.services.length > 0 && (
              <ul className="rc-lines">
                {b.services.map((s) => <li key={s._id}>{s.name} ×{s.quantity} = {vnd(s.price * s.quantity)}
                  <button className="link" onClick={() => act(() => bookingService.removeService(id, s._id), 'Đã xoá')}>✕</button></li>)}
              </ul>
            )}
            <div className="rc-picker">
              {services.map((s) => (
                <button type="button" key={s._id} className="rc-chip"
                  onClick={() => act(() => bookingService.addService(id, { serviceId: s._id, quantity: 1 }), `Đã thêm ${s.name}`)}>
                  <span>+ {s.name}</span><small>{vnd(s.price)}</small>
                </button>
              ))}
            </div>

            <h4>Thiết bị thiếu {b.missingAmenities.length > 0 && `· đã ghi ${b.missingAmenities.length}`}</h4>
            {b.missingAmenities.length > 0 && (
              <ul className="rc-lines">
                {b.missingAmenities.map((a) => <li key={a._id}>{a.name} ×{a.quantity} = {vnd(a.price * a.quantity)}
                  <button className="link" onClick={() => act(() => bookingService.removeMissingAmenity(id, a._id), 'Đã xoá')}>✕</button></li>)}
              </ul>
            )}
            <div className="rc-picker">
              {amenities.map((a) => (
                <button type="button" key={a._id} className="rc-chip"
                  onClick={() => act(() => bookingService.addMissingAmenity(id, { amenityId: a._id, quantity: 1 }), `Đã ghi thiếu ${a.name}`)}>
                  <span>+ {a.name}</span><small>{vnd(a.missingPrice)}</small>
                </button>
              ))}
            </div>
          </>}
        </section>
      </div>

      {/* ── Modal chọn kiểm tra/dọn phòng (không phải checkout) ── */}
      {pickerFor && (
        <div className="rc-modal-overlay" onClick={() => setPickerFor(null)}>
          <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Giao việc cho nhân viên buồng phòng</h3>
            <p className="rc-modal-hint">Đầu danh sách là người phụ trách đúng tầng &amp; đang rảnh.</p>
            {pickerLoading ? <p>Đang tải...</p> : (
              <ul className="hk-pick-list">
                {hkPick.map((h) => (
                  <li key={h.accountId}>
                    <div className="hk-pick-info">
                      <b>{h.fullName || h.email}</b>
                      <small>
                        {h.floors?.length ? `Tầng ${h.floors.join(', ')}` : 'Chưa phân tầng'}
                        {h.onFloor ? ' · đúng tầng' : ''} · {h.busy ? `đang làm ${h.activeTasks} việc` : 'đang rảnh'}
                      </small>
                    </div>
                    <button onClick={() => pick(h.accountId)}>Giao</button>
                  </li>
                ))}
                {!hkPick.length && <li className="rc-muted">Chi nhánh chưa có nhân viên buồng phòng</li>}
              </ul>
            )}
            <div className="rc-modal-actions"><button className="link" onClick={() => setPickerFor(null)}>Hủy</button></div>
          </div>
        </div>
      )}

      {/* ── Modal nhận sớm / trả muộn ── */}
      {hoursFor === 'early' && (
        <HoursModal
          title="Khách nhận phòng sớm"
          note="Chỉ áp dụng trong 4 giờ trước giờ nhận (14:00) và tự kẹp theo giờ trả của khách trước. Phí 10% giá đêm cho mỗi giờ."
          max={3}
          confirmLabel="Ghi nhận sớm"
          onClose={() => setHoursFor(null)}
          onPick={(h) => { setHoursFor(null); act(() => bookingService.setEarlyCheckin(id, h), 'Đã ghi nhận sớm') }}
        />
      )}
      {hoursFor === 'late' && (
        <HoursModal
          title="Khách trả phòng muộn"
          note="Phí 10% giá đêm cho mỗi giờ. Quá 18:00 sẽ tính trọn 1 đêm."
          max={6}
          confirmLabel="Ghi trả muộn"
          onClose={() => setHoursFor(null)}
          onPick={(h) => { setHoursFor(null); act(() => bookingService.setLateCheckout(id, h), 'Đã ghi trả muộn') }}
        />
      )}

      {/* ── Modal Checkout (QR / Cash) ── */}
      {showCheckoutModal && (
        <CheckoutPaymentModal
          bookingId={id}
          roomNumber={b.room?.roomNumber}
          remainingAmount={bill?.remainingAmount ?? b.remainingAmount}
          onClose={() => { setShowCheckoutModal(false); reload() }}
          onSuccess={(m) => { setMsg(m); setShowCheckoutModal(false); reload() }}
          onError={(e) => { setErr(e); setShowCheckoutModal(false) }}
        />
      )}

      {/* ── Modal Thu cọc (QR / Cash) ── */}
      {showDepositQRModal && (
        <DepositQRModal
          bookingId={id}
          depositAmount={b.depositAmount}
          totalAmount={b.totalAmount}
          onClose={() => { setShowDepositQRModal(false); reload() }}
          onSuccess={(m) => { setMsg(m); setShowDepositQRModal(false); reload() }}
          onError={(e) => { setErr(e); setShowDepositQRModal(false) }}
        />
      )}
    </div>
  )
}
