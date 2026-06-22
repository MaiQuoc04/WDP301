import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingService, vnd, fmtDate, fmtDateTime } from '../../services'

export default function BookingDetailPage() {
  const { id } = useParams()
  const [d, setD] = useState(null)        // { booking, payments, history }
  const [bill, setBill] = useState(null)
  const [services, setServices] = useState([])
  const [amenities, setAmenities] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [svcSel, setSvcSel] = useState(''); const [svcQty, setSvcQty] = useState(1)
  const [amSel, setAmSel] = useState(''); const [amQty, setAmQty] = useState(1)

  const reload = useCallback(async () => {
    setErr('')
    try { setD(await bookingService.getBooking(id)); setBill(await bookingService.getBill(id)) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải') }
  }, [id])

  useEffect(() => { reload() }, [reload])
  useEffect(() => {
    bookingService.listServices().then(setServices).catch(() => {})
    bookingService.listAmenities().then(setAmenities).catch(() => {})
  }, [])

  const act = async (fn, okMsg) => {
    setErr(''); setMsg('')
    try { await fn(); setMsg(okMsg || 'Thành công'); await reload() }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi') }
  }

  if (!d) return <p>{err || 'Đang tải...'}</p>
  const b = d.booking
  const st = b.status
  const editable = ['confirmed', 'checked_in'].includes(st)

  return (
    <div className="rc-detail">
      <div className="rc-bar">
        <h2>{b.code} <span className={'rc-badge s-' + st}>{st}</span></h2>
        <Link to="/reception">← Danh sách</Link>
      </div>
      {err && <p className="rc-err">{err}</p>}
      {msg && <p className="rc-ok">{msg}</p>}

      <div className="rc-actions">
        {st === 'pending' && <button onClick={() => act(() => bookingService.confirmDeposit(id), 'Đã thu cọc')}>Thu cọc → Confirm</button>}
        {st === 'confirmed' && <button onClick={() => act(() => bookingService.checkIn(id), 'Đã check-in')}>Check-in</button>}
        {st === 'checked_in' && <button onClick={() => act(() => bookingService.checkOut(id), 'Đã check-out')}>Check-out</button>}
        {st === 'checked_out' && <button onClick={() => act(() => bookingService.complete(id), 'Đã hoàn tất')}>Complete</button>}
        {st === 'confirmed' && <button onClick={() => act(() => bookingService.noShow(id), 'Đã đánh no-show')}>No-show</button>}
        {['pending', 'confirmed'].includes(st) &&
          <button className="danger" onClick={() => window.confirm('Huỷ booking này?') && act(() => bookingService.cancel(id, { reason: 'Huỷ tại quầy' }), 'Đã huỷ')}>Huỷ</button>}
      </div>

      <div className="rc-cols">
        <section>
          <h3>Thông tin</h3>
          <p>Khách: <b>{b.customer?.fullName || b.guestName}</b>{b.guestPhone && ` · ${b.guestPhone}`}</p>
          <p>Loại phòng: {b.roomType?.name} · Phòng: {b.room?.roomNumber || '— (gán khi check-in)'}</p>
          <p>Nhận {fmtDateTime(b.checkIn)} → Trả {fmtDateTime(b.checkOut)}</p>
          <p>Số khách: {b.adults} người lớn + {b.children} trẻ em</p>
          <p>Thanh toán: <b>{b.paymentStatus}</b></p>

          <h3>Lịch sử</h3>
          <ul className="rc-hist">
            {d.history.map((h) => <li key={h._id}>{fmtDateTime(h.createdAt)}: {h.fromStatus || '∅'} → {h.toStatus}{h.note && ` (${h.note})`}</li>)}
          </ul>
        </section>

        <section>
          <h3>Bill</h3>
          {bill && (
            <table className="rc-bill"><tbody>
              <tr><td>Tiền phòng</td><td>{vnd(bill.roomCharge)}</td></tr>
              <tr><td>Giường phụ {bill.bedSurchargeApplied ? '(đã áp)' : `(ước tính ${vnd(bill.bedSurchargeEstimate)}, chưa áp)`}</td><td>{vnd(bill.bedSurcharge)}</td></tr>
              <tr><td>Dịch vụ</td><td>{vnd(bill.extraServicesTotal)}</td></tr>
              <tr><td>Thiết bị thiếu</td><td>{vnd(bill.missingAmenitiesTotal)}</td></tr>
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
            <h4>Dịch vụ</h4>
            <ul className="rc-lines">
              {b.services.map((s) => <li key={s._id}>{s.name} ×{s.quantity} = {vnd(s.price * s.quantity)}
                <button className="link" onClick={() => act(() => bookingService.removeService(id, s._id), 'Đã xoá')}>✕</button></li>)}
            </ul>
            <div className="rc-add">
              <select value={svcSel} onChange={(e) => setSvcSel(e.target.value)}>
                <option value="">+ dịch vụ</option>
                {services.map((s) => <option key={s._id} value={s._id}>{s.name} ({vnd(s.price)})</option>)}
              </select>
              <input type="number" min={1} value={svcQty} onChange={(e) => setSvcQty(e.target.value)} style={{ width: 50 }} />
              <button disabled={!svcSel} onClick={() => act(() => bookingService.addService(id, { serviceId: svcSel, quantity: Number(svcQty) }), 'Đã thêm')}>Thêm</button>
            </div>

            <h4>Thiết bị thiếu</h4>
            <ul className="rc-lines">
              {b.missingAmenities.map((a) => <li key={a._id}>{a.name} ×{a.quantity} = {vnd(a.price * a.quantity)}
                <button className="link" onClick={() => act(() => bookingService.removeMissingAmenity(id, a._id), 'Đã xoá')}>✕</button></li>)}
            </ul>
            <div className="rc-add">
              <select value={amSel} onChange={(e) => setAmSel(e.target.value)}>
                <option value="">+ thiết bị</option>
                {amenities.map((a) => <option key={a._id} value={a._id}>{a.name} ({vnd(a.missingPrice)})</option>)}
              </select>
              <input type="number" min={1} value={amQty} onChange={(e) => setAmQty(e.target.value)} style={{ width: 50 }} />
              <button disabled={!amSel} onClick={() => act(() => bookingService.addMissingAmenity(id, { amenityId: amSel, quantity: Number(amQty) }), 'Đã thêm')}>Thêm</button>
            </div>
          </>}
        </section>
      </div>
    </div>
  )
}
