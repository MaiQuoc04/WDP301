import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService, vnd, fmtDate, fmtDateTime } from '../../services'
import DateField from '../../components/common/DateField'

// Nhãn "vừa khít / dư / thiếu giường phụ" cho 1 phòng theo phân bổ khách
const fitLabel = (r) => {
  if (!r) return { text: '', cls: '' }
  if (r.fit === 'short') return { text: `Cần ${r.extraBeds} giường phụ (+${vnd(r.surcharge)})`, cls: 'fit-short' }
  if (r.fit === 'surplus') return { text: 'Còn trống', cls: 'fit-surplus' }
  return { text: 'Vừa đủ', cls: 'fit-exact' }
}

// Tình trạng SẴN SÀNG THỰC TẾ của phòng — BE chỉ gắn khi nhận trong hôm nay (đặt cho mai thì vô nghĩa).
// Phòng đang dọn vẫn đặt được (lát nữa dọn xong là nhận), nhưng lễ tân phải biết trước + biết gọi ai giục.
const readyLabel = (r) => {
  if (!r.roomStatus) return null                                   // không phải nhận hôm nay -> không hiện gì
  if (r.roomStatus === 'available' && !r.awaitingRestock) return { text: 'Sẵn sàng', cls: 'fit-exact', ready: true }
  const who = r.cleaning?.housekeeper
  const st = r.cleaning?.status
  if (r.roomStatus === 'cleaning' || st) {
    // Không có việc dọn nào đang mở mà phòng vẫn 'cleaning' = bất thường, KHÁC hẳn "chưa ai nhận".
    if (!r.cleaning) return { text: '⚠️ Kẹt: không có việc dọn nào', cls: 'fit-short', ready: false }
    const verb = st === 'in_progress' ? 'Đang dọn' : 'Chờ dọn'
    const at = r.cleaning.startedAt || r.cleaning.assignedAt
    return {
      text: `${verb}${who ? ` — ${who}` : ' — chưa ai nhận việc'}${at ? ` (${fmtDateTime(at).split(' ')[0]})` : ''}`,
      cls: 'fit-short', ready: false,
    }
  }
  if (r.awaitingRestock) return { text: 'Chờ bổ sung thiết bị', cls: 'fit-short', ready: false }
  if (r.roomStatus === 'occupied') return { text: 'Khách đang ở (trả trong hôm nay)', cls: 'fit-short', ready: false }
  return { text: r.roomStatus, cls: 'fit-short', ready: false }
}

// KHÔNG chia khách ở FE: backend là nơi duy nhất chia (bookingService.autoAllocate — tối thiểu tổng tiền).
// FE tự tính luật giá là nguồn gốc của bug "bước 2 báo phát sinh phí, bước 3 lại vừa đủ".

const EMPTY_FORM = { guestName: '', guestPhone: '', checkIn: '', checkOut: '', adults: 1, children: 0 }

// Số đêm giữa 2 mốc — dùng để hiện nhãn "N đêm" ngay khi lễ tân chọn xong ngày.
const nightsBetween = (a, b) => {
  if (!a || !b) return 0
  const n = Math.round((new Date(b) - new Date(a)) / 86400000)
  return n > 0 ? n : 0
}

export default function WalkInPage() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // Bước 1 — thông tin khách + TỔNG số khách của cả nhóm
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }
  // Nút −/+ : kẹp trong khoảng hợp lệ luôn, đỡ phải bắt lỗi "0 người lớn" sau
  const bump = (k, delta, min) => set(k, Math.max(min, Number(form[k] || 0) + delta))
  const resetForm = () => { setForm(EMPTY_FORM); setErrors({}); setErr('') }

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

  // Báo giá nhóm (backend tự chia khách) — dùng cho cả bước 2 lẫn bước 3
  const [quote, setQuote] = useState(null)
  const [quoteErr, setQuoteErr] = useState('')

  // Dịch vụ kèm — CHỈ áp dụng khi đặt 1 phòng (booking pending không thêm dịch vụ sau được).
  // Nhiều phòng: thêm dịch vụ theo từng phòng sau khi đã cọc (mở chi tiết phòng).
  const [services, setServices] = useState([])
  const [chosen, setChosen] = useState({}) // serviceId -> qty
  useEffect(() => { bookingService.listServices().then(setServices).catch(() => {}) }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const nights = nightsBetween(form.checkIn, form.checkOut)
  // Reactive (giống booking online): trả <= nhận (kể cả cùng ngày) -> cảnh báo NGAY, không đợi bấm Tìm phòng.
  useEffect(() => {
    if (form.checkIn && form.checkOut && new Date(form.checkOut) <= new Date(form.checkIn)) {
      setErrors((e) => ({ ...e, checkOut: 'Ngày trả phải sau ngày nhận (tối thiểu 1 đêm)' }))
    } else {
      setErrors((e) => (e.checkOut ? { ...e, checkOut: undefined } : e))
    }
  }, [form.checkIn, form.checkOut])

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

  const canCreate = picked.length >= 1 && !!quote && !quoteErr

  // Báo giá realtime: gửi phòng đã chọn + TỔNG khách, backend tự chia rồi tính tiền.
  // Cùng 1 lời gọi cho bước 2 và bước 3 -> con số hai bước luôn khớp nhau.
  useEffect(() => {
    if (step < 2 || !picked.length) { setQuote(null); setQuoteErr(''); return }
    let cancelled = false
    const t = setTimeout(() => {
      bookingService.quoteGroup({
        checkIn: form.checkIn, checkOut: form.checkOut,
        items: picked.map((r) => ({ roomId: r.roomId })),
        adultsTotal: Number(form.adults), childrenTotal: Number(form.children),
      })
        .then((q) => { if (!cancelled) { setQuote(q); setQuoteErr('') } })
        .catch((e2) => { if (!cancelled) { setQuote(null); setQuoteErr(e2.response?.data?.message || 'Lỗi báo giá') } })
    }, 250) // gộp nhiều lần tick phòng liên tiếp
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, JSON.stringify(picked.map((r) => r.roomId)), form.adults, form.children, form.checkIn, form.checkOut])

  const extraBedsTotal = (quote?.rooms || []).reduce((s, r) => s + (r.extraBeds || 0), 0)

  const create = async () => {
    setErr(''); setLoading(true)
    try {
      // Mọi lần đặt = 1 nhóm (kể cả 1 phòng). Chỉ gửi roomId — backend chia khách y hệt lúc báo giá.
      const items = picked.map((r) => ({ roomId: r.roomId }))
      if (picked.length === 1) {
        const svc = Object.entries(chosen).filter(([, q]) => q > 0).map(([serviceId, quantity]) => ({ serviceId, quantity }))
        if (svc.length) items[0].services = svc
      }
      const res = await bookingService.createGroup({
        guestName: form.guestName, guestPhone: form.guestPhone,
        checkIn: form.checkIn, checkOut: form.checkOut,
        items, adultsTotal: Number(form.adults), childrenTotal: Number(form.children),
      })
      nav(`/reception/booking-groups/${res.group._id}`)
    } catch (e2) { setErr(e2.response?.data?.message || 'Lỗi tạo booking'); setLoading(false) }
  }

  const types = [...new Map(rooms.map((r) => [r.roomType._id, r.roomType])).values()]
  const filtered = typeFilter.length ? rooms.filter((r) => typeFilter.includes(r.roomType._id)) : rooms
  // Phòng chưa sẵn sàng xuống cuối (vẫn chọn được — chỉ là ưu tiên phòng nhận được ngay).
  const shown = [...filtered].sort((a, b) => {
    const ra = readyLabel(a), rb = readyLabel(b)
    if (!ra || !rb) return 0
    return (ra.ready === rb.ready) ? 0 : (ra.ready ? -1 : 1)
  })
  const notReady = filtered.filter((r) => { const s = readyLabel(r); return s && !s.ready }).length

  return (
    // Bước 1: form 2 cột + thẻ gợi ý -> ~1120px là vừa mắt (1 cột hẹp thì dài lê thê và bỏ trống
    // nửa màn phải). Bước 2/3 là BẢNG 6 cột -> phải được rộng hết khung, trước đây kẹp cứng
    // 760px làm cột "Tình trạng" (chứa cả câu "Đang dọn — Trần Thị Mai") bị bóp.
    <div style={{ maxWidth: step === 1 ? 1120 : '100%' }}>
      <div className="rc-bar">
        <div className="rc-bar-titles">
          <h2>Tạo đặt phòng tại quầy</h2>
          <p className="rc-sub">Khách tới quầy không đặt trước — nhập thông tin, chọn phòng còn trống rồi thu cọc.</p>
        </div>
      </div>
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
        <div className="rc-form-grid">
          <form onSubmit={search} className="rc-form" noValidate>
            <fieldset className="rc-fs">
              <legend>Khách hàng</legend>
              <div className="rc-fs-row">
                <label>Tên khách <span className="req">*</span>
                  <input className={errors.guestName ? 'err' : ''} value={form.guestName}
                    onChange={(e) => set('guestName', e.target.value)} placeholder="Nguyễn Văn A" />
                  {errors.guestName && <span className="rc-field-err">{errors.guestName}</span>}
                </label>
                <label>Số điện thoại <span className="req">*</span>
                  <input className={errors.guestPhone ? 'err' : ''} value={form.guestPhone}
                    onChange={(e) => set('guestPhone', e.target.value)} placeholder="0901234567" />
                  {errors.guestPhone && <span className="rc-field-err">{errors.guestPhone}</span>}
                </label>
              </div>
            </fieldset>

            <fieldset className="rc-fs">
              <legend>Thời gian lưu trú</legend>
              <div className="rc-fs-row">
                <label>Ngày nhận <span className="req">*</span>
                  <DateField value={form.checkIn} onChange={(v) => set('checkIn', v)} min={todayStr}
                    status={errors.checkIn ? 'error' : undefined} />
                  <span className="rc-hint">nhận lúc 14:00</span>
                  {errors.checkIn && <span className="rc-field-err">{errors.checkIn}</span>}
                </label>
                <label>Ngày trả <span className="req">*</span>
                  <DateField value={form.checkOut} onChange={(v) => set('checkOut', v)} min={form.checkIn || todayStr}
                    status={errors.checkOut ? 'error' : undefined} />
                  <span className="rc-hint">trả lúc 12:00</span>
                  {errors.checkOut && <span className="rc-field-err">{errors.checkOut}</span>}
                </label>
              </div>
              {nights > 0 && <span className="rc-nights">🌙 {nights} đêm</span>}
            </fieldset>

            <fieldset className="rc-fs">
              <legend>Số khách</legend>
              <div className="rc-fs-row">
                <label>Tổng người lớn <span className="req">*</span>
                  <span className="rc-stepper-num">
                    <button type="button" onClick={() => bump('adults', -1, 1)} aria-label="Bớt 1 người lớn">−</button>
                    <input className={errors.adults ? 'err' : ''} type="number" min={1} value={form.adults}
                      onChange={(e) => set('adults', e.target.value)} />
                    <button type="button" onClick={() => bump('adults', 1, 1)} aria-label="Thêm 1 người lớn">+</button>
                  </span>
                  {errors.adults && <span className="rc-field-err">{errors.adults}</span>}
                </label>
                <label>Tổng trẻ em
                  <span className="rc-stepper-num">
                    <button type="button" onClick={() => bump('children', -1, 0)} aria-label="Bớt 1 trẻ em">−</button>
                    <input className={errors.children ? 'err' : ''} type="number" min={0} value={form.children}
                      onChange={(e) => set('children', e.target.value)} />
                    <button type="button" onClick={() => bump('children', 1, 0)} aria-label="Thêm 1 trẻ em">+</button>
                  </span>
                  {errors.children && <span className="rc-field-err">{errors.children}</span>}
                </label>
              </div>
              <span className="rc-hint">Tổng cho cả nhóm — hệ thống sẽ tự chia vào các phòng ở bước sau.</span>
            </fieldset>

            <div className="rc-form-foot">
              <button type="button" className="link" onClick={resetForm}>Xoá hết</button>
              <button className="primary" disabled={loading}>{loading ? 'Đang tìm…' : 'Tìm phòng →'}</button>
            </div>
          </form>

          <aside className="rc-tips">
            <h3><span className="rc-tips-icon">💡</span> Gợi ý cho lễ tân</h3>
            <ul>
              <li>Hỏi khách ở mấy đêm trước khi chọn phòng.</li>
              <li>Số khách là <b>tổng cả nhóm</b>, không phải mỗi phòng.</li>
              <li>Cọc thu <b>1 lần cho cả nhóm</b> ở bước 3.</li>
            </ul>
          </aside>
        </div>
      )}

      {/* ── Bước 2: chọn nhiều phòng ── */}
      {step === 2 && (
        <div>
          <div className="rc-search-summary">
            <div className="rc-sum-item">
              <span className="lbl">Khách hàng</span>
              <span className="val">{form.guestName || '(chưa nhập tên)'}{form.guestPhone && ` · ${form.guestPhone}`}</span>
            </div>
            <div className="rc-sum-item">
              <span className="lbl">Thời gian lưu trú</span>
              <span className="val">Nhận {fmtDate(form.checkIn)} 14:00 → Trả {fmtDate(form.checkOut)} 12:00</span>
            </div>
            <div className="rc-sum-item">
              <span className="lbl">Số lượng khách</span>
              <span className="val">{form.adults} người lớn{Number(form.children) > 0 ? ` + ${form.children} trẻ em` : ''}</span>
            </div>
            <div className="rc-sum-edit">
              <button className="link" onClick={() => setStep(1)}>Sửa thông tin</button>
            </div>
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

          {notReady > 0 && (
            <p className="rc-muted" style={{ margin: '0 0 12px' }}>
              Có <b>{notReady}</b> phòng chưa sẵn sàng ngay (đang dọn / chờ bổ sung). <b>Vẫn đặt được</b> —
              nhưng khách chỉ nhận được sau khi dọn xong. Cột <b>Tình trạng</b> cho biết ai đang dọn để gọi giục.
            </p>
          )}

          <table className="rc-table">
            <thead><tr>
              <th style={{ width: 44 }}></th><th>Phòng</th><th>Loại</th><th>Sức chứa</th>
              <th className="rc-num">Tiền phòng ({rooms[0]?.nights || 0} đêm)</th><th>Tình trạng</th>
            </tr></thead>
            <tbody>
              {shown.map((r) => {
                const rd = readyLabel(r)
                const on = isPicked(r.roomId)
                return (
                  <tr key={r.roomId} className={(on ? 'rc-row-on' : '') + (rd && !rd.ready && !on ? ' rc-row-dim' : '')}
                    style={{ cursor: 'pointer' }} onClick={() => togglePick(r)}>
                    <td><input type="checkbox" checked={on} readOnly /></td>
                    <td><b style={{ fontSize: 15 }}>{r.roomNumber}</b><br /><small>Tầng {r.floor}</small></td>
                    <td>{r.roomType.name}</td>
                    <td>{r.roomType.capacity} người</td>
                    <td className="rc-num">{vnd(r.roomCharge)}</td>
                    <td>{rd ? <span className={'rc-fit ' + rd.cls}>{rd.text}</span> : <span className="rc-muted">—</span>}</td>
                  </tr>
                )
              })}
              {!shown.length && <tr><td colSpan={6} className="rc-empty">Không có phòng</td></tr>}
            </tbody>
          </table>

          <div className="rc-sticky-foot">
            <div className="rc-foot-info">
              <span className="main">
                Đã chọn <b>{picked.length}</b> phòng
                {picked.length > 0 && ` · ${picked.map((r) => r.roomNumber).join(', ')}`}
              </span>
              <span className="sub">
                {form.adults} người lớn{Number(form.children) > 0 ? ` + ${form.children} trẻ em` : ''}
                {/* Con số lấy từ backend (đã tự chia tối ưu) — không tự suy ra ở FE nữa */}
                {picked.length > 0 && quoteErr && <span className="rc-field-err"> · {quoteErr}</span>}
                {picked.length > 0 && !quoteErr && quote && (extraBedsTotal > 0
                  ? <span className="rc-field-err"> · cần {extraBedsTotal} giường phụ (+{vnd(quote.totalSurcharge)})</span>
                  : <span className="rc-ok-text"> · vừa đủ, không phát sinh giường phụ</span>)}
                {picked.length > 0 && !quote && !quoteErr && <span className="rc-muted"> · đang tính…</span>}
              </span>
            </div>
            {quote && !quoteErr && (
              <div className="rc-foot-total">
                <span className="lbl">Tạm tính</span>
                <span className="val">{vnd(quote.totalAmount)}</span>
              </div>
            )}
            <button className="primary" disabled={!canCreate} onClick={() => setStep(3)}>Tiếp tục →</button>
          </div>
        </div>
      )}

      {/* ── Bước 3: phân bổ khách + báo giá ── */}
      {step === 3 && (
        <div>
          <div className="rc-bar">
            <button className="link" onClick={() => setStep(2)}>← Chọn phòng khác</button>
          </div>

          <p className="rc-note">
            Hệ thống đã tự xếp <b>{form.adults} người lớn{Number(form.children) > 0 ? ` + ${form.children} trẻ em` : ''}</b> vào {picked.length} phòng
            theo cách <b>ít tốn nhất cho khách</b>. Khách vẫn đi lại tự do giữa các phòng đã thuê — bảng dưới chỉ để tính tiền
            {extraBedsTotal > 0 && ' và cho biết phòng nào cần kê thêm giường'}.
          </p>

          {quoteErr && <p className="rc-err">{quoteErr}</p>}

          <div className="rc-alloc-grid">
            <div>
              <table className="rc-table">
                <thead><tr>
                  <th>Phòng</th><th>Sức chứa</th><th>Người lớn</th><th>Trẻ em</th><th>Phụ phí</th><th className="rc-num">Tiền phòng</th>
                </tr></thead>
                <tbody>
                  {(quote?.rooms || []).map((q) => {
                    const f = fitLabel(q)
                    return (
                      <tr key={q.roomId}>
                        <td><b style={{ fontSize: 15 }}>{q.roomNumber}</b><br /><small>{q.roomType?.name}</small></td>
                        <td>{q.capacity}</td>
                        <td>{q.adults}</td>
                        <td>{q.children}</td>
                        <td><span className={'rc-fit ' + f.cls}>{f.text}</span></td>
                        <td className="rc-num">{vnd(q.total)}</td>
                      </tr>
                    )
                  })}
                  {!quote && <tr><td colSpan={6} className="rc-empty">Đang tính…</td></tr>}
                </tbody>
              </table>

              {/* Dịch vụ kèm — chỉ khi đặt 1 phòng */}
              {picked.length === 1 && (
                <>
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
                    {!services.length && <span className="rc-muted">Chưa có dịch vụ</span>}
                  </div>
                </>
              )}
            </div>

            {/* Cột tóm tắt — tiền cọc là con số lễ tân thu ngay, nên tách hẳn ra khối vàng */}
            {quote && (
              <aside className="rc-alloc-side">
                <h3>Tóm tắt đơn</h3>
                <table className="rc-bill" style={{ marginTop: 0 }}><tbody>
                  <tr><td>Tiền phòng ({quote.roomCount} phòng)</td><td>{vnd(quote.totalRoomCharge)}</td></tr>
                  {quote.totalSurcharge > 0 && <tr><td>Phụ phí giường phụ</td><td>{vnd(quote.totalSurcharge)}</td></tr>}
                  <tr className="tot"><td>Tổng nhóm</td><td>{vnd(quote.totalAmount)}</td></tr>
                </tbody></table>
                <div className="rc-deposit-box">
                  <span className="lbl">Tiền đặt cọc</span>
                  <span className="val">{vnd(quote.depositAmount)}</span>
                  <span className="hint">Thu 1 lần cho cả nhóm</span>
                </div>
              </aside>
            )}
          </div>

          <div className="rc-sticky-foot">
            <div className="rc-foot-info">
              <span className="main">{picked.length === 1 ? 'Tạo đặt phòng (1 phòng · 1 mã)' : `Tạo nhóm ${picked.length} phòng (1 mã, 1 cọc)`}</span>
              <span className="sub">{form.guestName} · {form.guestPhone} · {fmtDate(form.checkIn)} → {fmtDate(form.checkOut)}</span>
            </div>
            {quote && (
              <div className="rc-foot-total">
                <span className="lbl">Cọc cần thu</span>
                <span className="val">{vnd(quote.depositAmount)}</span>
              </div>
            )}
            <button className="primary" disabled={loading || !canCreate} onClick={create}>{loading ? 'Đang tạo…' : 'Tạo booking'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
