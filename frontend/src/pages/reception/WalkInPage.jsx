import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService, vnd, fmtDate } from '../../services'

// Nhãn "vừa khít / dư / thiếu giường phụ" cho 1 phòng theo phân bổ khách
const fitLabel = (r) => {
  if (!r) return { text: '', cls: '' }
  if (r.fit === 'short') return { text: `Cần ${r.extraBeds} giường phụ (+${vnd(r.surcharge)})`, cls: 'fit-short' }
  if (r.fit === 'surplus') return { text: 'Còn trống', cls: 'fit-surplus' }
  return { text: 'Vừa đủ', cls: 'fit-exact' }
}

// Gợi ý chia khách vào các phòng để TỐI THIỂU phụ phí (mirror backend autoAllocate).
// Mỗi phòng 1 người lớn trước, phần còn lại rải vào phòng còn nhiều chỗ nhất.
function autoSplit(adults, children, rooms) {
  const alloc = rooms.map((r) => ({ roomId: r.roomId, capacity: r.roomType?.capacity || r.capacity || 2, adults: 0, children: 0 }))
  if (!alloc.length) return {}
  const units = (a) => a.adults + a.children * 0.5
  const remaining = (a) => a.capacity - units(a)
  const mostFree = () => alloc.reduce((best, a) => (remaining(a) > remaining(best) ? a : best), alloc[0])
  let aLeft = Math.max(0, Number(adults) || 0)
  for (const a of alloc) { if (aLeft > 0) { a.adults = 1; aLeft-- } }
  for (let i = 0; i < aLeft; i++) mostFree().adults++
  for (let i = 0; i < Math.max(0, Number(children) || 0); i++) mostFree().children++
  const out = {}
  alloc.forEach((a) => { out[a.roomId] = { adults: a.adults, children: a.children } })
  return out
}

export default function WalkInPage() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Bước 1 — thông tin khách + TỔNG số khách của cả nhóm
  const [form, setForm] = useState({ guestName: '', guestPhone: '', checkIn: '', checkOut: '', adults: 1, children: 0 })
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }

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

  // Bước 2 — chọn NHIỀU phòng
  const [rooms, setRooms] = useState([])
  const [typeFilter, setTypeFilter] = useState([])
  const [picked, setPicked] = useState([]) // mảng room object đã chọn
  const toggleType = (id) => setTypeFilter((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const isPicked = (roomId) => picked.some((r) => String(r.roomId) === String(roomId))
  const togglePick = (room) => setPicked((prev) =>
    prev.some((r) => String(r.roomId) === String(room.roomId))
      ? prev.filter((r) => String(r.roomId) !== String(room.roomId))
      : [...prev, room])

  // Bước 3 — phân bổ khách + báo giá nhóm
  const [alloc, setAlloc] = useState({})        // roomId -> { adults, children }
  const [quote, setQuote] = useState(null)
  const [quoteErr, setQuoteErr] = useState('')

  // Dịch vụ kèm — CHỈ áp dụng khi đặt 1 phòng (booking pending không thêm dịch vụ sau được).
  // Nhiều phòng: thêm dịch vụ theo từng phòng sau khi đã cọc (mở chi tiết phòng).
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
      // Liệt kê phòng còn trống (party=1 để cột phụ phí không gây hiểu nhầm — phụ phí tính lại sau khi phân bổ)
      const list = await bookingService.searchRooms({ checkIn: form.checkIn, checkOut: form.checkOut, adults: 1, children: 0 })
      setRooms(list); setTypeFilter([]); setPicked([]); setStep(2)
      if (!list.length) setErr('Không còn phòng trống cho khoảng thời gian này')
    } catch (e2) {
      setErr(e2.response?.data?.message
        || (e2.code === 'ECONNABORTED' ? 'Quá thời gian chờ — thử lại'
          : !e2.response ? 'Không kết nối được máy chủ — kiểm tra backend (port 9999) có đang chạy không'
            : `Lỗi tìm phòng (${e2.response.status})`))
    } finally { setLoading(false) }
  }

  // Sang bước phân bổ: tự chia gợi ý lần đầu
  const goAllocate = () => {
    if (!picked.length) return
    setAlloc(autoSplit(form.adults, form.children, picked))
    setStep(3)
  }
  const setRoomAlloc = (roomId, k, v) =>
    setAlloc((a) => ({ ...a, [roomId]: { ...a[roomId], [k]: Math.max(k === 'adults' ? 0 : 0, parseInt(v, 10) || 0) } }))

  // Tổng allocation hiện tại + điều kiện hợp lệ
  const allocAdults = picked.reduce((s, r) => s + (Number(alloc[r.roomId]?.adults) || 0), 0)
  const allocChildren = picked.reduce((s, r) => s + (Number(alloc[r.roomId]?.children) || 0), 0)
  const eachHasAdult = picked.every((r) => (Number(alloc[r.roomId]?.adults) || 0) >= 1)
  const sumsMatch = allocAdults === Number(form.adults) && allocChildren === Number(form.children)
  const canCreate = picked.length >= 1 && eachHasAdult && sumsMatch

  // Báo giá realtime khi phân bổ thay đổi (chỉ khi mỗi phòng đã có ≥1 người lớn — backend yêu cầu)
  useEffect(() => {
    if (step !== 3 || !picked.length || !eachHasAdult) { setQuote(null); return }
    let cancelled = false
    const items = picked.map((r) => ({ roomId: r.roomId, adults: Number(alloc[r.roomId]?.adults) || 0, children: Number(alloc[r.roomId]?.children) || 0 }))
    setQuoteErr('')
    bookingService.quoteGroup({ checkIn: form.checkIn, checkOut: form.checkOut, items })
      .then((q) => { if (!cancelled) setQuote(q) })
      .catch((e2) => { if (!cancelled) { setQuote(null); setQuoteErr(e2.response?.data?.message || 'Lỗi báo giá') } })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, JSON.stringify(alloc), JSON.stringify(picked.map((r) => r.roomId))])

  const quoteByRoom = {}
  ;(quote?.rooms || []).forEach((r) => { quoteByRoom[String(r.roomId)] = r })

  const create = async () => {
    setErr(''); setLoading(true)
    try {
      const items = picked.map((r) => ({ roomId: r.roomId, adults: Number(alloc[r.roomId]?.adults) || 0, children: Number(alloc[r.roomId]?.children) || 0 }))
      if (picked.length === 1) {
        // 1 phòng -> booking đơn (đường cũ), không tạo nhóm; kèm dịch vụ chọn ngay
        const svc = Object.entries(chosen).filter(([, q]) => q > 0).map(([serviceId, quantity]) => ({ serviceId, quantity }))
        const b = await bookingService.walkIn({
          roomId: items[0].roomId,
          guestName: form.guestName, guestPhone: form.guestPhone,
          checkIn: form.checkIn, checkOut: form.checkOut,
          adults: items[0].adults, children: items[0].children,
          services: svc,
        })
        nav(`/reception/bookings/${b._id}`)
      } else {
        const res = await bookingService.createGroup({
          guestName: form.guestName, guestPhone: form.guestPhone,
          checkIn: form.checkIn, checkOut: form.checkOut,
          items, adultsTotal: Number(form.adults), childrenTotal: Number(form.children),
        })
        nav(`/reception/booking-groups/${res.group._id}`)
      }
    } catch (e2) { setErr(e2.response?.data?.message || 'Lỗi tạo booking'); setLoading(false) }
  }

  const types = [...new Map(rooms.map((r) => [r.roomType._id, r.roomType])).values()]
  const shown = typeFilter.length ? rooms.filter((r) => typeFilter.includes(r.roomType._id)) : rooms
  const totalUnits = Number(form.adults) + Number(form.children) * 0.5
  const pickedCapacity = picked.reduce((s, r) => s + (r.roomType?.capacity || 0), 0)

  return (
    <div style={{ maxWidth: 760 }}>
      <h2>Tạo booking tại quầy (Walk-in)</h2>
      <div className="rc-stepper">
        {['Thông tin khách', 'Chọn phòng', 'Phân bổ & tạo'].map((label, i) => {
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

      {/* ── Bước 1 ── */}
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
            <label style={{ flex: 1 }}>Tổng người lớn <span className="req">*</span>
              <input className={errors.adults ? 'err' : ''} type="number" min={1} value={form.adults} onChange={(e) => set('adults', e.target.value)} />
              {errors.adults && <span className="rc-field-err">{errors.adults}</span>}
            </label>
            <label style={{ flex: 1 }}>Tổng trẻ em
              <input className={errors.children ? 'err' : ''} type="number" min={0} value={form.children} onChange={(e) => set('children', e.target.value)} />
              {errors.children && <span className="rc-field-err">{errors.children}</span>}
            </label>
          </div>
          <button disabled={loading}>{loading ? '...' : 'Tìm phòng →'}</button>
        </form>
      )}

      {/* ── Bước 2: chọn nhiều phòng ── */}
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
            <thead><tr><th></th><th>Phòng</th><th>Loại</th><th>Sức chứa</th><th>Tiền phòng ({rooms[0]?.nights || 0} đêm)</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.roomId} className={isPicked(r.roomId) ? 'rc-row-on' : ''} style={{ cursor: 'pointer' }} onClick={() => togglePick(r)}>
                  <td><input type="checkbox" checked={isPicked(r.roomId)} readOnly /></td>
                  <td><b>{r.roomNumber}</b> <small>T{r.floor}</small></td>
                  <td>{r.roomType.name}</td>
                  <td>{r.roomType.capacity} người</td>
                  <td>{vnd(r.roomCharge)}</td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Không có phòng</td></tr>}
            </tbody>
          </table>

          <div className="rc-sticky-foot">
            <span>
              Đã chọn <b>{picked.length}</b> phòng · sức chứa <b>{pickedCapacity}</b> / cần <b>{totalUnits}</b> suất
              {picked.length > 0 && pickedCapacity < totalUnits && <span className="rc-field-err"> · sẽ phát sinh giường phụ</span>}
            </span>
            <button disabled={!picked.length} onClick={goAllocate}>Tiếp tục phân bổ khách →</button>
          </div>
        </div>
      )}

      {/* ── Bước 3: phân bổ khách + báo giá ── */}
      {step === 3 && (
        <div>
          <div className="rc-bar">
            <button className="link" onClick={() => setStep(2)}>← Chọn phòng khác</button>
            <button type="button" className="link" onClick={() => setAlloc(autoSplit(form.adults, form.children, picked))}>↺ Tự chia tối ưu</button>
          </div>

          <p className="rc-muted">
            Phân bổ <b>{form.adults} người lớn + {form.children} trẻ em</b> vào {picked.length} phòng.
            Mỗi phòng cần ít nhất 1 người lớn; phụ phí giường phụ tính theo số khách thực ngủ mỗi phòng.
          </p>

          <table className="rc-table">
            <thead><tr><th>Phòng</th><th>Sức chứa</th><th>Người lớn</th><th>Trẻ em</th><th>Phụ phí</th><th>Tiền phòng</th></tr></thead>
            <tbody>
              {picked.map((r) => {
                const q = quoteByRoom[String(r.roomId)]
                const f = fitLabel(q)
                const noAdult = (Number(alloc[r.roomId]?.adults) || 0) < 1
                return (
                  <tr key={r.roomId}>
                    <td><b>{r.roomNumber}</b> <small>· {r.roomType.name}</small></td>
                    <td>{r.roomType.capacity}</td>
                    <td>
                      <input type="number" min={1} style={{ width: 64 }} className={noAdult ? 'err' : ''}
                        value={alloc[r.roomId]?.adults ?? 0}
                        onChange={(e) => setRoomAlloc(r.roomId, 'adults', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" min={0} style={{ width: 64 }}
                        value={alloc[r.roomId]?.children ?? 0}
                        onChange={(e) => setRoomAlloc(r.roomId, 'children', e.target.value)} />
                    </td>
                    <td>{q ? <span className={'rc-fit ' + f.cls}>{f.text}</span> : '—'}</td>
                    <td>{q ? vnd(q.total) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Đối chiếu tổng */}
          <div className="rc-alloc-check">
            <span className={allocAdults === Number(form.adults) ? 'ok' : 'bad'}>
              Người lớn: {allocAdults}/{form.adults}
            </span>
            <span className={allocChildren === Number(form.children) ? 'ok' : 'bad'}>
              Trẻ em: {allocChildren}/{form.children}
            </span>
            {!eachHasAdult && <span className="bad">Mỗi phòng phải có ≥1 người lớn</span>}
            {!sumsMatch && <span className="bad">Tổng phân bổ chưa khớp tổng khách</span>}
          </div>

          {quoteErr && <p className="rc-err">{quoteErr}</p>}

          {/* Dịch vụ kèm — chỉ khi đặt 1 phòng */}
          {picked.length === 1 && (
            <>
              <h4 style={{ marginTop: 16 }}>Khách có muốn dùng thêm dịch vụ?</h4>
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
            </>
          )}

          {/* Hoá đơn gom của nhóm */}
          {quote && (
            <table className="rc-bill" style={{ marginTop: 12 }}><tbody>
              <tr><td>Tiền phòng ({quote.roomCount} phòng)</td><td>{vnd(quote.totalRoomCharge)}</td></tr>
              {quote.totalSurcharge > 0 && <tr><td>Phụ phí giường phụ</td><td>{vnd(quote.totalSurcharge)}</td></tr>}
              <tr className="tot"><td>Tổng nhóm</td><td>{vnd(quote.totalAmount)}</td></tr>
              <tr><td>Đặt cọc (thu 1 lần)</td><td><b style={{ color: 'var(--rc-gold)' }}>{vnd(quote.depositAmount)}</b></td></tr>
            </tbody></table>
          )}

          <div className="rc-sticky-foot">
            <span>{picked.length === 1 ? 'Tạo 1 booking' : `Tạo nhóm ${picked.length} phòng (1 mã, 1 cọc)`}</span>
            <button disabled={loading || !canCreate} onClick={create}>{loading ? '...' : 'Tạo booking'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
