import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, message } from 'antd'
import {
  SyncOutlined, LogoutOutlined, CheckCircleOutlined, OrderedListOutlined,
  CheckSquareOutlined, ToolOutlined, HistoryOutlined, RightOutlined,
} from '@ant-design/icons'
import { taskService } from '../../services/taskService'
import '../manager/dashboard-overview.css'

const typeLabel = { inspection: 'Kiểm tra', turnover: 'Dọn (trả phòng)', mid_stay: 'Dọn (yêu cầu)' }
const TYPE_PILL = { inspection: 'gold', turnover: 'medium', mid_stay: 'low' }
const statusLabel = { pending: 'Chờ làm', in_progress: 'Đang làm', urgent: 'Khẩn' }
const STATUS_PILL = { pending: 'neutral', in_progress: 'medium', urgent: 'high' }
const fmtTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-')

export default function DashboardPage() {
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await taskService.getDashboard()) }
    catch (e) { message.error(e.response?.data?.message || 'Lỗi tải dashboard') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const c = data?.counts || {}

  const kpis = [
    { icon: <LogoutOutlined />, label: 'Phòng trả hôm nay', value: `${c.checkoutsToday || 0}`, ctx: 'cần dọn', tone: 'flat' },
    { icon: <OrderedListOutlined />, label: 'Việc của tôi đang mở', value: `${c.myActive || 0}`, ctx: (c.myActive || 0) > 0 ? 'cần làm' : 'trống', tone: (c.myActive || 0) > 0 ? 'down' : 'up' },
    { icon: <CheckCircleOutlined />, label: 'Hoàn tất hôm nay', value: `${c.doneToday || 0}`, ctx: 'đã xong', tone: 'up' },
  ]

  const actions = [
    { icon: <CheckSquareOutlined />, label: 'Task đang mở', to: '/housekeeping/tasks' },
    { icon: <ToolOutlined />, label: 'Phòng bảo trì', to: '/housekeeping/maintenance' },
    { icon: <HistoryOutlined />, label: 'Lịch sử công việc', to: '/housekeeping/history' },
  ]

  return (
    <div className="ov-wrap">
      <div className="ov-head">
        <div>
          <h2>Hôm nay</h2>
          <p>Phòng sắp trả & việc được giao cho bạn (làm theo thứ tự)</p>
        </div>
        <Button type="primary" icon={<SyncOutlined spin={loading} />} onClick={load}>Làm mới</Button>
      </div>

      {/* KPI */}
      <div className="ov-kpis flow">
        {kpis.map((k) => (
          <div className="ov-kpi" key={k.label}>
            <div className="ov-kpi-top">
              <span className="ov-kpi-icon">{k.icon}</span>
              <span className={`ov-kpi-trend ${k.tone}`}>{k.ctx}</span>
            </div>
            <div className="ov-kpi-value">{k.value}</div>
            <div className="ov-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Việc của tôi + Quick actions */}
      <div className="ov-mid">
        <div className="ov-card">
          <div className="ov-card-head">
            <h3 className="ov-card-title">Việc của tôi (làm theo thứ tự)</h3>
            <button className="ov-link" onClick={() => nav('/housekeeping/tasks')}>Tất cả task</button>
          </div>
          {(!data?.myTasks || data.myTasks.length === 0) ? (
            <div className="ov-empty"><CheckCircleOutlined />Bạn chưa được giao việc nào.</div>
          ) : (
            <table className="ov-table">
              <thead>
                <tr><th>Thứ tự</th><th>Loại việc</th><th>Phòng</th><th>Trạng thái</th><th></th></tr>
              </thead>
              <tbody>
                {data.myTasks.map((r, i) => (
                  <tr key={r._id}>
                    <td>{i === 0 ? <span className="ov-pill gold">Làm trước</span> : <span style={{ color: '#aaa', fontWeight: 600 }}>{i + 1}</span>}</td>
                    <td><span className={`ov-pill ${TYPE_PILL[r.type] || 'neutral'}`}>{typeLabel[r.type] || 'Việc phòng'}</span></td>
                    <td><span className="ov-room-chip">{r.room?.roomNumber || '-'}</span></td>
                    <td><span className={`ov-pill ${STATUS_PILL[r.status] || 'neutral'}`}>{statusLabel[r.status] || r.status}</span></td>
                    <td><button className="ov-mini-btn" onClick={() => nav(`/housekeeping/tasks/${r._id}`)}>Chi tiết</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="ov-card">
          <div className="ov-card-head"><h3 className="ov-card-title">Tác vụ nhanh</h3></div>
          <div className="ov-actions">
            {actions.map((a) => (
              <button className="ov-action" key={a.to} onClick={() => nav(a.to)}>
                {a.icon}
                <span style={{ flex: 1 }}>{a.label}</span>
                <RightOutlined style={{ fontSize: 12, color: '#c9bfb2' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Phòng sẽ trả hôm nay */}
      <div className="ov-card">
        <div className="ov-card-head">
          <h3 className="ov-card-title">Phòng sẽ trả hôm nay</h3>
        </div>
        {(!data?.checkouts || data.checkouts.length === 0) ? (
          <div className="ov-empty"><CheckCircleOutlined />Hôm nay không có phòng nào trả.</div>
        ) : (
          <table className="ov-table">
            <thead>
              <tr><th>Phòng</th><th>Tầng</th><th>Loại phòng</th><th>Khách</th><th>Giờ trả dự kiến</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {data.checkouts.map((r) => (
                <tr key={r._id}>
                  <td><span className="ov-room-chip">{r.room?.roomNumber || '-'}</span></td>
                  <td>{r.room?.floor ?? '-'}</td>
                  <td>{r.roomType?.name || '-'}</td>
                  <td>{r.guestName || '-'}</td>
                  <td>{fmtTime(r.checkOut)}</td>
                  <td><span className={`ov-pill ${r.status === 'checked_out' ? 'neutral' : 'low'}`}>{r.status === 'checked_out' ? 'Đã trả' : 'Đang ở'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
