import { useEffect, useState } from 'react'
import { bookingService, vnd, fmtDateTime } from '../../services'

const TYPE_LABEL = { deposit: 'Cọc', remaining: 'Còn lại' }
const STATUS_LABEL = { paid: 'Đã thu', pending: 'Chờ thanh toán', expired: 'Hết hạn', failed: 'Thất bại' }
// Enum DB -> tiếng Việt: cột này đang hiện thẳng 'cash'/'online_qr' cho lễ tân đọc.
const METHOD_LABEL = { cash: 'Tiền mặt', online_qr: 'QR PayOS', bank_transfer: 'Chuyển khoản', card: 'Thẻ' }

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
        <div className="rc-bar-titles">
          <h2>Giao dịch</h2>
          <p className="rc-sub">Toàn bộ khoản đã thu tại chi nhánh — tiền cọc và tiền còn lại khi trả phòng.</p>
        </div>
        <div className="rc-filters" style={{ margin: 0 }}>
          <span className="rc-filters-label">Loại:</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tất cả</option><option value="deposit">Cọc</option><option value="remaining">Còn lại</option>
          </select>
        </div>
      </div>
      {err && <p className="rc-err">{err}</p>}

      <table className="rc-table">
        <thead><tr>
          <th>Thời gian</th><th>Booking</th><th>Loại</th><th>Phương thức</th>
          <th className="rc-num">Số tiền</th><th>Trạng thái</th><th>Mã giao dịch</th>
        </tr></thead>
        <tbody>
          {list.map((t) => (
            <tr key={t._id}>
              <td>{fmtDateTime(t.paidAt || t.createdAt)}</td>
              <td><b>{t.booking?.code}</b>{t.booking?.guestName && <><br /><small>{t.booking.guestName}</small></>}</td>
              <td>{TYPE_LABEL[t.type] || t.type}</td>
              <td>{METHOD_LABEL[t.method] || t.method}</td>
              <td className="rc-num"><b>{vnd(t.amount)}</b></td>
              <td><span className={'rc-badge tx-' + t.status}>{STATUS_LABEL[t.status] || t.status}</span></td>
              <td><small>{t.transactionCode || t.transactionRef || '—'}</small></td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan={7} className="rc-empty">Chưa có giao dịch</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
