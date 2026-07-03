// Owner: Quốc — hộp thư tin nhắn liên hệ (dùng chung lễ tân & QL). Phản hồi thủ công qua email (mailto).
import { useEffect, useState, useCallback } from 'react'

const fmt = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '')

const S = {
  wrap: { maxWidth: 900 },
  bar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  select: { padding: '6px 10px', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 14 },
  card: { border: '1px solid #ececec', borderRadius: 12, padding: 16, marginBottom: 12, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  subject: { fontSize: 16, fontWeight: 600, color: '#1f2937', margin: 0 },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  body: { marginTop: 10, padding: 12, background: '#f9fafb', borderRadius: 8, fontSize: 14, color: '#374151', whiteSpace: 'pre-wrap' },
  foot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  actions: { display: 'flex', gap: 8 },
  btn: { padding: '7px 14px', borderRadius: 8, border: '1px solid #b08d57', background: '#fff', color: '#b08d57', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' },
  btnPrimary: { padding: '7px 14px', borderRadius: 8, border: 'none', background: '#b08d57', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  pill: (handled) => ({ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: handled ? '#DCFCE7' : '#FEF3C7', color: handled ? '#15803D' : '#B45309', whiteSpace: 'nowrap' }),
  empty: { textAlign: 'center', color: '#888', padding: '48px 0' },
  err: { color: '#b91c1c', marginBottom: 12 },
}

export default function ContactsInbox({ fetchList, onHandle, title = 'Hộp thư liên hệ' }) {
  const [status, setStatus] = useState('')
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setErr('')
    try { setList(await fetchList({ status: status || undefined })) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải tin nhắn') }
  }, [fetchList, status])
  useEffect(() => { load() }, [load])

  const handle = async (id) => {
    setBusyId(id)
    try { await onHandle(id); await load() }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi cập nhật') }
    finally { setBusyId(null) }
  }

  const mailto = (m) =>
    `mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}` +
    `&body=${encodeURIComponent(`\n\n———\nPhản hồi cho tin nhắn:\n"${m.message}"\n\nTrân trọng,\nKhách sạn Hà Nội`)}`

  const newCount = list.filter((m) => m.status !== 'handled').length

  return (
    <div style={S.wrap}>
      <div style={S.bar}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {newCount > 0 && <span style={S.pill(false)}>{newCount} chưa xử lý</span>}
        <span style={{ flex: 1 }} />
        <select style={S.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="new">Chưa xử lý</option>
          <option value="handled">Đã xử lý</option>
        </select>
      </div>

      {err && <p style={S.err}>{err}</p>}

      {list.map((m) => {
        const handled = m.status === 'handled'
        return (
          <div key={m._id} style={S.card}>
            <div style={S.head}>
              <div>
                <p style={S.subject}>{m.subject}</p>
                <div style={S.meta}>
                  <b>{m.name}</b> · {m.email}{m.phone ? ` · ${m.phone}` : ''}
                  {m.branch?.name ? ` · ${m.branch.name}` : ''}
                </div>
              </div>
              <span style={S.pill(handled)}>{handled ? '✓ Đã xử lý' : 'Chưa xử lý'}</span>
            </div>

            <div style={S.body}>{m.message}</div>

            <div style={S.foot}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                Gửi {fmt(m.createdAt)}
                {handled && m.handledAt ? ` · Xử lý ${fmt(m.handledAt)}${m.handledBy?.email ? ` bởi ${m.handledBy.email}` : ''}` : ''}
              </span>
              <div style={S.actions}>
                <a style={S.btn} href={mailto(m)}>✉ Trả lời qua email</a>
                {!handled && (
                  <button style={S.btnPrimary} disabled={busyId === m._id} onClick={() => handle(m._id)}>
                    {busyId === m._id ? '...' : 'Đánh dấu đã xử lý'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {!list.length && <div style={S.empty}>Không có tin nhắn</div>}
    </div>
  )
}
