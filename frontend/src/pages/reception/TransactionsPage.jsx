import { useEffect, useState } from 'react'
import { bookingService, vnd, fmtDateTime } from '../../services'

export default function TransactionsPage() {
  const [list, setList] = useState([])
  const [type, setType] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => {
    bookingService.transactions({ type: type || undefined }).then(setList).catch((e) => setErr(e.response?.data?.message || 'Lỗi'))
  }, [type])
  return (
    <div>
      <div className="rc-bar">
        <h2>Giao dịch</h2>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tất cả</option><option value="deposit">Cọc</option><option value="remaining">Còn lại</option>
        </select>
      </div>
      {err && <p className="rc-err">{err}</p>}
      <table className="rc-table">
        <thead><tr><th>Thời gian</th><th>Booking</th><th>Loại</th><th>Phương thức</th><th>Số tiền</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {list.map((t) => (
            <tr key={t._id}>
              <td>{fmtDateTime(t.createdAt)}</td><td>{t.booking?.code}</td><td>{t.type}</td>
              <td>{t.method}</td><td>{vnd(t.amount)}</td><td>{t.status}</td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>Chưa có giao dịch</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
