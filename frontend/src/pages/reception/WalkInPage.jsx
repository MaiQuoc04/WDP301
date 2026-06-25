import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService, vnd, fmtDate } from '../../services'

const fitLabel = (r) => {
  if (r.fit === 'short') return { text: `Cần ${r.extraBeds} giường phụ (+${vnd(r.surcharge)})`, cls: 'fit-short' }
  if (r.fit === 'surplus') return { text: 'Còn trống', cls: 'fit-surplus' }
  return { text: 'Vừa đủ', cls: 'fit-exact' }
}

export default function WalkInPage() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Bước 1
  const [form, setForm] = useState({ guestName: '', guestPhone: '', checkIn: '', checkOut: '', adults: 1, children: 0 })
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }

  // Validate form khách trước khi tìm phòng
  const validate = () => {
    const e = {}
    if (!form.guestName.trim()) e.guestName = 'Vui lòng nhập tên khách'
    if (!String(form.guestPhone).trim()) e.guestPhone = 'Vui lòng nhập số điện thoại'
    else if (!/^0\d{9,10}$/.test(String(form.guestPhone).trim())) e.guestPhone = 'SĐT không hợp lệ (VD: 0901234567)'
    if (!form.checkIn) e.checkIn = 'Chọn ngày nhận phòng'
    if (!form.checkOut) e.checkOut = 'Chọn ngày trả phòng'
    else if (form.checkIn && new Date(form.checkOut) <= new Date(form.checkIn)) e.checkOut = 'Ngày trả phải sau ngày nhận (tối thiểu 1 đêm)'
    if (!form.adults || Number(form.adults) < 1) e.adults = 'Ít nhất 1 người lớn'
    if (Number(form.children) < 0) e.children = 'Số trẻ em không hợp lệ'
    return e
  }

  // Bước 2
  const [rooms, setRooms] = useState([])
  const [typeFilter, setTypeFilter] = useState([]) // mảng roomType._id đang lọc (chọn nhiều)
  const [picked, setPicked] = useState(null)
  const toggleType = (id) => setTypeFilter((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  // Bước 3
  const [services, setServices] = useState([])
  const [chosen, setChosen] = useState({}) // serviceId -> qty
  useEffect(() => { bookingService.listServices().then(setServices).catch(() => {}) }, [])

  const search = async (e) => {
    e?.preventDefault(); setErr('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      const list = await bookingService.searchRooms({
        checkIn: form.checkIn, checkOut: form.checkOut,
        adults: form.adults, children: form.children,
      })
      setRooms(list); setTypeFilter([]); setStep(2)
      if (!list.length) setErr('Không còn phòng trống cho khoảng thời gian này')
    } catch (e2) {
      setErr(e2.response?.data?.message
        || (e2.code === 'ECONNABORTED' ? 'Quá thời gian chờ — thử lại'
          : !e2.response ? 'Không kết nối được máy chủ — kiểm tra backend (port 9999) có đang chạy không'
          : `Lỗi tìm phòng (${e2.response.status})`))
    }
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
  const shown = typeFilter.length ? rooms.filter((r) => typeFilter.includes(r.roomType._id)) : rooms

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
        <form onSubmit={search} className="rc-form" noValidate>
          <label>Tên khách <span className="req">*</span>
            <input className={errors.guestName ? 'err' : ''} value={form.guestName} onChange={(e) => set('guestName', e.target.value)} />
            {errors.guestName && <span className="rc-field-err">{errors.guestName}</span>}
          </label>
          <label>SĐT <span className="req">*</span>
            <input className={errors.guestPhone ? 'err' : ''} value={form.guestPhone} onChange={(e) => set('guestPhone', e.target.value)} placeholder="0901234567" />
            {errors.guestPhone && <span className="rc-field-err">{errors.guestPhone}</span>}
          </label>
          <label>Ngày nhận <span className="req">*</span> <small style={{ color: 'var(--rc-text-muted)', fontWeight: 500 }}>· nhận lúc 14:00</small>
            <input className={errors.checkIn ? 'err' : ''} type="date" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} />
            {errors.checkIn && <span className="rc-field-err">{errors.checkIn}</span>}
          </label>
          <label>Ngày trả <span className="req">*</span> <small style={{ color: 'var(--rc-text-muted)', fontWeight: 500 }}>· trả lúc 12:00</small>
            <input className={errors.checkOut ? 'err' : ''} type="date" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} />
            {errors.checkOut && <span className="rc-field-err">{errors.checkOut}</span>}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>Người lớn <span className="req">*</span>
              <input className={errors.adults ? 'err' : ''} type="number" min={1} value={form.adults} onChange={(e) => set('adults', e.target.value)} />
              {errors.adults && <span className="rc-field-err">{errors.adults}</span>}
            </label>
            <label style={{ flex: 1 }}>Trẻ em
              <input className={errors.children ? 'err' : ''} type="number" min={0} value={form.children} onChange={(e) => set('children', e.target.value)} />
              {errors.children && <span className="rc-field-err">{errors.children}</span>}
            </label>
          </div>
          <button disabled={loading}>{loading ? '...' : 'Tìm phòng →'}</button>
        </form>
      )}

      {step === 2 && (
        <div>
          <div className="rc-bar">
            <button className="link" onClick={() => setStep(1)}>← Sửa thông tin</button>
          </div>
          {types.length > 0 && (
            <div className="rc-type-filter">
              <span className="rc-type-filter-label">Lọc loại phòng:</span>
              {types.map((t) => (
                <label key={t._id} className={'rc-type-chip' + (typeFilter.includes(t._id) ? ' on' : '')}>
                  <input type="checkbox" checked={typeFilter.includes(t._id)} onChange={() => toggleType(t._id)} />
                  {t.name} <small>(sức chứa {t.capacity})</small>
                </label>
              ))}
              {typeFilter.length > 0 && <button type="button" className="link" onClick={() => setTypeFilter([])}>Bỏ lọc</button>}
            </div>
          )}
          <div className="rc-search-summary">
            <span>👤 <b>{form.guestName || '(chưa nhập tên)'}</b>{form.guestPhone && ` · ${form.guestPhone}`}</span>
            <span>📅 Nhận {fmtDate(form.checkIn)} 14:00 → Trả {fmtDate(form.checkOut)} 12:00</span>
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
