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

/* ─── Payment Method Modal (Reception Checkout) ─────────────────── */
function CheckoutPaymentModal({ bookingId, remainingAmount, onClose, onSuccess, onError }) {
  const [step, setStep] = useState('choose')       // 'choose' | 'qr' | 'cash'
  const [qrData, setQrData] = useState(null)       // { qrCode, checkoutUrl, amount, orderCode }
  const [loading, setLoading] = useState(false)
  const [hkPick, setHkPick] = useState([])
  const [hkLoading, setHkLoading] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const expireAt = useRef(null)

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

  const handleChooseCash = async () => {
    setStep('cash')
    setHkLoading(true)
    try {
      const list = await bookingService.getHousekeepers(bookingId)
      setHkPick(list)
    } catch {
      setHkPick([])
    } finally {
      setHkLoading(false)
    }
  }

  const handleCashCheckout = async (hkId) => {
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

  const handleQRCheckoutDone = async () => {
    // Sau khi QR đã quét, lễ tân bấm "Hoàn tất check-out" để chuyển status
    setLoading(true)
    try {
      const list = await bookingService.getHousekeepers(bookingId)
      setHkPick(list)
      setStep('qr-done-hk') // chọn housekeeper để dọn phòng
    } catch {
      setHkPick([])
      setStep('qr-done-hk')
    } finally {
      setLoading(false)
    }
  }

  const handleQRCheckoutWithHK = async (hkId) => {
    setLoading(true)
    try {
      // Booking đã được cập nhật payment qua webhook, chỉ cần chuyển status checked_out
      await bookingService.checkOut(bookingId, { method: 'online_qr', housekeeperId: hkId })
      onSuccess('Check-out thành công (QR đã thanh toán)')
      onClose()
    } catch (e) {
      onError(e.response?.data?.message || 'Lỗi check-out')
      setLoading(false)
    }
  }

  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal payos-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Bước 1: Chọn phương thức ── */}
        {step === 'choose' && (
          <>
            <h3 style={{ marginBottom: 6 }}>Thanh toán Check-out</h3>
            <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>
              Số tiền còn lại: <strong style={{ color: '#d97706', fontSize: 18 }}>{vnd(remainingAmount)}</strong>
            </p>
            {remainingAmount <= 0 ? (
              <div className="payos-paid-banner">✅ Đã thanh toán đủ — có thể check-out</div>
            ) : (
              <div className="payos-method-grid">
                <button className="payos-method-btn qr" onClick={handleChooseQR} disabled={loading}>
                  <span className="payos-method-icon">📱</span>
                  <span className="payos-method-label">Thanh toán QR</span>
                  <span className="payos-method-sub">Khách quét QR PayOS</span>
                </button>
                <button className="payos-method-btn cash" onClick={handleChooseCash} disabled={loading}>
                  <span className="payos-method-icon">💵</span>
                  <span className="payos-method-label">Tiền mặt</span>
                  <span className="payos-method-sub">Thu trực tiếp tại quầy</span>
                </button>
              </div>
            )}
            {remainingAmount <= 0 && (
              <div style={{ marginTop: 16 }}>
                <button className="payos-method-btn cash" onClick={() => setStep('qr-done-hk')}>
                  <span className="payos-method-icon">🏨</span>
                  <span className="payos-method-label">Tiếp tục check-out</span>
                  <span className="payos-method-sub">Chọn housekeeper dọn phòng</span>
                </button>
              </div>
            )}
            <div className="rc-modal-actions">
              <button className="link" onClick={onClose}>Huỷ</button>
            </div>
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

            <div className="rc-modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="link" onClick={onClose}>Đóng</button>
              {paymentDone && (
                <button className="btn-primary" onClick={handleQRCheckoutDone} disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Hoàn tất check-out →'}
                </button>
              )}
              {!paymentDone && (
                <button className="link" style={{ color: '#6b7280' }} onClick={() => setStep('choose')}>← Quay lại</button>
              )}
            </div>
          </>
        )}

        {/* ── Bước 2B: Chọn housekeeper (cash) ── */}
        {step === 'cash' && (
          <>
            <h3>Check-out — Tiền mặt</h3>
            <p className="rc-modal-hint">Tự phân cho người phù hợp nhất (đúng tầng, ít việc), hoặc chọn người khác bên dưới.</p>
            {hkLoading ? <p>Đang tải...</p> : (
              <>
                {hkPick.length > 0 && (
                  <button className="btn-primary" style={{ width: '100%', marginBottom: 10 }} disabled={loading}
                    onClick={() => handleCashCheckout(hkPick[0].accountId)}>
                    ⚡ Tự phân: {hkPick[0].fullName || hkPick[0].email}{hkPick[0].onFloor ? ' · đúng tầng' : ''}{hkPick[0].busy ? '' : ' · rảnh'} — Check-out
                  </button>
                )}
                {hkPick.length > 1 && <p className="rc-muted" style={{ margin: '4px 0' }}>hoặc chọn người khác:</p>}
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
                      <button onClick={() => handleCashCheckout(h.accountId)} disabled={loading}>
                        {loading ? '...' : 'Giao'}
                      </button>
                    </li>
                  ))}
                  {!hkPick.length && <li className="rc-muted">Chi nhánh chưa có nhân viên buồng phòng</li>}
                </ul>
              </>
            )}
            <div className="rc-modal-actions">
              <button className="link" onClick={() => setStep('choose')}>← Quay lại</button>
              <button className="link" onClick={onClose}>Huỷ</button>
            </div>
          </>
        )}

        {/* ── Bước 2C: Chọn housekeeper sau QR thành công ── */}
        {step === 'qr-done-hk' && (
          <>
            <h3>Check-out — Giao dọn phòng</h3>
            <div className="payos-success-banner" style={{ marginBottom: 16 }}>
              ✅ Đã thanh toán qua QR — chọn housekeeper để hoàn tất
            </div>
            <p className="rc-modal-hint">Tự phân cho người phù hợp nhất, hoặc chọn người khác bên dưới.</p>
            {hkLoading ? <p>Đang tải...</p> : (
              <>
                {hkPick.length > 0 && (
                  <button className="btn-primary" style={{ width: '100%', marginBottom: 10 }} disabled={loading}
                    onClick={() => handleQRCheckoutWithHK(hkPick[0].accountId)}>
                    ⚡ Tự phân: {hkPick[0].fullName || hkPick[0].email}{hkPick[0].onFloor ? ' · đúng tầng' : ''}{hkPick[0].busy ? '' : ' · rảnh'} — Hoàn tất
                  </button>
                )}
                {hkPick.length > 1 && <p className="rc-muted" style={{ margin: '4px 0' }}>hoặc chọn người khác:</p>}
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
                      <button onClick={() => handleQRCheckoutWithHK(h.accountId)} disabled={loading}>
                        {loading ? '...' : 'Giao'}
                      </button>
                    </li>
                  ))}
                  {!hkPick.length && <li className="rc-muted">Chi nhánh chưa có nhân viên buồng phòng</li>}
                </ul>
              </>
            )}
            <div className="rc-modal-actions">
              <button className="link" onClick={onClose}>Đóng</button>
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

  const tabStyle = (on) => ({
    flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    border: on ? '2px solid #d97706' : '1px solid #d1d5db',
    background: on ? '#fff7ed' : '#fff', color: on ? '#b45309' : '#6b7280',
  })

  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal payos-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Thu tiền — QR / Tiền mặt</h3>

        {/* Chọn thu cọc hay thu toàn bộ; QR và tiền mặt đều áp theo lựa chọn này */}
        {!qrData && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button style={tabStyle(!payFull)} onClick={() => setPayFull(false)}>Cọc {vnd(depositAmount)}</button>
            <button style={tabStyle(payFull)} onClick={() => setPayFull(true)}>Toàn bộ {vnd(totalAmount)}</button>
          </div>
        )}

        <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>
          Số tiền thu: <strong style={{ color: '#d97706', fontSize: 18 }}>{vnd(amount)}</strong>
        </p>

        {!qrData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="payos-method-btn qr" onClick={handleGenQR} disabled={loading}>
              <span className="payos-method-icon">📱</span>
              <span className="payos-method-label">{loading ? 'Đang tạo QR...' : 'Tạo QR PayOS'}</span>
              <span className="payos-method-sub">Khách quét QR để thanh toán {payFull ? 'toàn bộ' : 'cọc'}</span>
            </button>
            <button className="payos-method-btn cash" onClick={handleConfirmDone}>
              <span className="payos-method-icon">💵</span>
              <span className="payos-method-label">Thu tiền mặt</span>
              <span className="payos-method-sub">Xác nhận đã thu {payFull ? 'toàn bộ' : 'cọc'} tại quầy</span>
            </button>
          </div>
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
  const askEarly = () => {
    const h = window.prompt('Nhận sớm mấy giờ? (tối đa 3 — chỉ trong 4h trước giờ nhận, tự kẹp theo giờ trả phòng trước; phí 10% giá đêm/giờ)', '1')
    if (h === null) return
    act(() => bookingService.setEarlyCheckin(id, Number(h)), 'Đã ghi nhận sớm')
  }
  const askLate = () => {
    const h = window.prompt('Trả muộn mấy giờ? (phí 10% giá đêm/giờ; quá 18:00 tính 1 đêm)', '1')
    if (h === null) return
    act(() => bookingService.setLateCheckout(id, Number(h)), 'Đã ghi trả muộn')
  }
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
  const showHk = st === 'checked_in' || hk?.inspections?.length || hk?.cleanings?.length

  return (
    <div className="rc-detail">
      <div className="rc-bar">
        <h2>{b.code} <span className={'rc-badge s-' + st}>{bookingStatusLabel(st)}</span></h2>
        <Link to="/reception/bookings">← Danh sách</Link>
      </div>
      {err && <p className="rc-err">{err}</p>}
      {msg && <p className="rc-ok">{msg}</p>}

      {b.group && (
        <p className="rc-group-banner">
          🏨 Phòng này thuộc <Link to={`/reception/booking-groups/${b.group}`}>nhóm đặt phòng (1 mã, 1 cọc)</Link>
        </p>
      )}

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

      <div className="rc-actions">
        {st === 'pending' && (
          <button
            className="btn-payos"
            onClick={() => setShowDepositQRModal(true)}
          >
            💳 Thu cọc {vnd(b.depositAmount)} → QR / Tiền mặt
          </button>
        )}
        {st === 'confirmed' && <button onClick={() => act(() => bookingService.checkIn(id), 'Đã check-in')}>Check-in</button>}
        {st === 'confirmed' && <button onClick={askEarly}>Nhận sớm</button>}
        {st === 'checked_in' && (
          <button className="btn-payos" onClick={() => setShowCheckoutModal(true)}>
            💳 Check-out — Thanh toán
          </button>
        )}
        {st === 'checked_in' && <button onClick={askLate}>Trả muộn</button>}
        {st === 'checked_out' && <button onClick={() => act(() => bookingService.complete(id), 'Đã hoàn tất')}>Complete</button>}
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
          <h3>Bill</h3>
          {bill && (
            <table className="rc-bill"><tbody>
              <tr><td>Tiền phòng</td><td>{vnd(bill.roomCharge)}</td></tr>
              {bill.services.map((s) => (
                <tr key={s._id}><td>(Dịch vụ) {s.name} ×{s.quantity}</td><td>{vnd(s.price * s.quantity)}</td></tr>
              ))}
              {bill.missingAmenities.map((a) => (
                <tr key={a._id}><td>(Thiết bị) {a.name} ×{a.quantity}</td><td>{vnd(a.price * a.quantity)}</td></tr>
              ))}
              {bill.bedSurchargeApplied && bill.bedSurcharge > 0 && (
                <tr><td>(Phụ phí) Giường phụ</td><td>{vnd(bill.bedSurcharge)}</td></tr>
              )}
              {bill.earlyHours > 0 && (
                <tr><td>(Giờ) Nhận sớm {bill.earlyHours}h</td><td>{vnd(bill.earlyFee)}</td></tr>
              )}
              {bill.lateHours > 0 && (
                <tr><td>(Giờ) Trả muộn {bill.lateHours}h {bill.lateFullNight ? '(sau 18h — tính 1 đêm)' : '(trước 18h)'}</td><td>{vnd(bill.lateFee)}</td></tr>
              )}
              <tr className="tot"><td>Tổng</td><td>{vnd(bill.totalAmount)}</td></tr>
              <tr><td>Đã trả</td><td>{vnd(bill.paidAmount)}</td></tr>
              <tr className="tot"><td>Còn lại</td><td>{vnd(bill.remainingAmount)}</td></tr>
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

      {/* ── Modal Checkout (QR / Cash) ── */}
      {showCheckoutModal && (
        <CheckoutPaymentModal
          bookingId={id}
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
