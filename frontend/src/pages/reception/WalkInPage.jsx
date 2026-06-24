import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService, vnd, fmtDateTime } from '../../services'

const fitLabel = (r) => {
  if (r.fit === 'short') return { text: `Cần ${r.extraBeds} giường phụ (+${vnd(r.surcharge)})`, cls: 'fit-short' }
  if (r.fit === 'surplus') return { text: 'Còn trống', cls: 'fit-surplus' }
  return { text: 'Vừa khít', cls: 'fit-exact' }
}

export default function WalkInPage() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Bước 1
  const [form, setForm] = useState({ guestName: '', guestPhone: '', checkIn: '', checkOut: '', adults: 1, children: 0 })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Bước 2
  const [rooms, setRooms] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [picked, setPicked] = useState(null)

  // Bước 3
  const [services, setServices] = useState([])
  const [chosen, setChosen] = useState({}) // serviceId -> qty
  useEffect(() => { bookingService.listServices().then(setServices).catch(() => {}) }, [])

  const search = async (e) => {
    e?.preventDefault(); setErr(''); setLoading(true)
    try {
      const list = await bookingService.searchRooms({
        checkIn: form.checkIn, checkOut: form.checkOut,
        adults: form.adults, children: form.children,
      })
      setRooms(list); setStep(2)
      if (!list.length) setErr('Không còn phòng trống cho khoảng thời gian này')
    } catch (e2) { setErr(e2.response?.data?.message || 'Lỗi tìm phòng') }
    finally { setLoading(false) }
  }

  const create = async () => {
    setErr(''); setLoading(true)
    const svc = Object.entries(chosen).filter(([, q]) => q > 0).map(([serviceId, quantity]) => ({ serviceId, quantity }))
    try {
      const b = await bookingService.walkIn({
        roomId: picked.roomId,
        guestName: form.guestName, guestPhone: form.guestPhone,
        checkIn: form.checkIn, checkOut: form.checkOut,
        adults: Number(form.adults), children: Number(form.children),
        services: svc,
      })
      nav(`/reception/bookings/${b._id}`)
    } catch (e2) { setErr(e2.response?.data?.message || 'Lỗi tạo booking'); setLoading(false) }
  }

  const types = [...new Map(rooms.map((r) => [r.roomType._id, r.roomType])).values()]
  const shown = typeFilter ? rooms.filter((r) => r.roomType._id === typeFilter) : rooms

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>Tạo booking tại quầy (Walk-in)</h2>
      <div className="rc-stepper">
        {['Thông tin khách', 'Chọn phòng', 'Dịch vụ & tạo'].map((label, i) => {
          const n = i + 1
          const cls = step === n ? 'active' : step > n ? 'done' : ''
          return (
            <div key={n} className={`rc-step ${cls}`}>
              <span className="rc-step-no">{step > n ? '✓' : n}</span>
              <span>{label}</span>
            </div>
          )
        })}
      </div>
      {err && <p className="rc-err">{err}</p>}

      {step === 1 && (
        <form onSubmit={search} className="rc-form">
          <label>Tên khách<input required value={form.guestName} onChange={(e) => set('guestName', e.target.value)} /></label>
          <label>SĐT<input value={form.guestPhone} onChange={(e) => set('guestPhone', e.target.value)} /></label>
          <label>Nhận phòng (ngày + giờ)<input required type="datetime-local" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} /></label>
          <label>Trả phòng (ngày + giờ)<input required type="datetime-local" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>Người lớn<input type="number" min={1} value={form.adults} onChange={(e) => set('adults', e.target.value)} /></label>
            <label style={{ flex: 1 }}>Trẻ em<input type="number" min={0} value={form.children} onChange={(e) => set('children', e.target.value)} /></label>
          </div>
          <button disabled={loading}>{loading ? '...' : 'Tìm phòng →'}</button>
        </form>
      )}

      {step === 2 && (
        <div>
          <div className="rc-bar">
            <button className="link" onClick={() => setStep(1)}>← Sửa thông tin</button>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Tất cả loại phòng</option>
              {types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div className="rc-search-summary">
            <span>👤 <b>{form.guestName || '(chưa nhập tên)'}</b>{form.guestPhone && ` · ${form.guestPhone}`}</span>
            <span>📅 {fmtDateTime(form.checkIn)} → {fmtDateTime(form.checkOut)}</span>
            <span>👥 {form.adults} người lớn + {form.children} trẻ em</span>
          </div>
          <table className="rc-table">
            <thead><tr><th>Phòng</th><th>Loại</th><th>Sức chứa</th><th>Giá ({rooms[0]?.nights || 0} đêm)</th><th></th></tr></thead>
            <tbody>
              {shown.map((r) => {
                const f = fitLabel(r)
                return (
                  <tr key={r.roomId}>
                    <td><b>{r.roomNumber}</b> <small>T{r.floor}</small></td>
                    <td>{r.roomType.name} <small>· sức chứa {r.roomType.capacity}</small></td>
                    <td><span className={'rc-fit ' + f.cls}>{f.text}</span></td>
                    <td>{vnd(r.total)}{r.surcharge > 0 && <small> (gồm phụ phí)</small>}</td>
                    <td><button onClick={() => { setPicked(r); setStep(3) }}>Chọn</button></td>
                  </tr>
                )
              })}
              {!shown.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Không có phòng</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {step === 3 && picked && (
        <div>
          <button className="link" onClick={() => setStep(2)}>← Chọn phòng khác</button>
          <p>Phòng <b>{picked.roomNumber}</b> · {picked.roomType.name} · {fitLabel(picked).text} · Tiền phòng {vnd(picked.total)}</p>
          <h4>Khách có muốn dùng thêm dịch vụ?</h4>
          <div className="rc-picker">
            {services.map((s) => {
              const sel = chosen[s._id] > 0
              return (
                <button type="button" key={s._id} className={'rc-chip' + (sel ? ' selected' : '')}
                  onClick={() => setChosen((c) => ({ ...c, [s._id]: sel ? 0 : 1 }))}>
                  <span>{s.name}{sel ? ` ×${chosen[s._id]}` : ''}</span>
                  <small>+{vnd(s.price)}</small>
                </button>
              )
            })}
            {!services.length && <span style={{ color: '#999' }}>Chưa có dịch vụ</span>}
          </div>
          <button disabled={loading} onClick={create}>{loading ? '...' : 'Tạo booking'}</button>
        </div>
      )}
    </div>
  )
}
