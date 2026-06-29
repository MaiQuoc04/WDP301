import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import {
  SyncOutlined, LoginOutlined, LogoutOutlined, TeamOutlined,
  ClockCircleOutlined, HomeOutlined, DollarOutlined,
  UserAddOutlined, BookOutlined, AppstoreOutlined, CalendarOutlined,
  RightOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { bookingService, vnd, fmtDateTime, bookingStatusLabel } from '../../services'
import '../manager/dashboard-overview.css'

// Trạng thái booking -> class pill
const PILL = {
  pending: 'medium', confirmed: 'gold', checked_in: 'low', checked_out: 'neutral',
  completed: 'low', cancelled: 'high', no_show: 'high',
}
const compactVND = (n) => {
  n = n || 0
  if (n >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ'
  if (n >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' Tr'
  return n.toLocaleString('vi-VN')
}

export default function ReceptionDashboardPage() {
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await bookingService.dashboard()) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const c = data?.counts || {}

  const kpis = [
    { icon: <LoginOutlined />, label: 'Nhận hôm nay', value: `${c.arrivalsToday || 0}`, ctx: 'check-in', tone: 'flat' },
    { icon: <LogoutOutlined />, label: 'Trả hôm nay', value: `${c.departuresToday || 0}`, ctx: 'check-out', tone: 'flat' },
    { icon: <TeamOutlined />, label: 'Đang lưu trú', value: `${c.inHouse || 0}`, ctx: 'khách', tone: 'up' },
    { icon: <ClockCircleOutlined />, label: 'Chờ cọc', value: `${c.pending || 0}`, ctx: (c.pending || 0) > 0 ? 'cần xử lý' : 'ổn', tone: (c.pending || 0) > 0 ? 'down' : 'up' },
    { icon: <HomeOutlined />, label: 'Phòng trống', value: `${c.roomsAvailable || 0}`, ctx: `/ ${c.roomsTotal || 0}`, tone: 'flat' },
    { icon: <DollarOutlined />, label: 'Doanh thu hôm nay', value: `${compactVND(c.revenueToday)} ₫`, ctx: 'hôm nay', tone: 'flat' },
  ]

  const actions = [
    { icon: <UserAddOutlined />, label: 'Nhận khách Walk-in', to: '/reception/walk-in' },
    { icon: <BookOutlined />, label: 'Danh sách bookings', to: '/reception/bookings' },
    { icon: <AppstoreOutlined />, label: 'Sơ đồ phòng', to: '/reception/rooms' },
    { icon: <CalendarOutlined />, label: 'Lịch nhận/trả', to: '/reception/schedule' },
  ]

  const renderRows = (list, timeField) => (
    (list || []).map((b) => (
      <tr key={b._id}>
        <td><strong>{b.code}</strong></td>
        <td>{b.customer?.fullName || b.guestName || '-'}</td>
        <td>{b.room?.roomNumber ? <span className="ov-room-chip">{b.room.roomNumber}</span> : <span style={{ color: '#bbb' }}>—</span>}</td>
        <td>{fmtDateTime(b[timeField])}</td>
        <td><span className={`ov-pill ${PILL[b.status] || 'neutral'}`}>{bookingStatusLabel(b.status)}</span></td>
        <td><button className="ov-mini-btn" onClick={() => nav(`/reception/bookings/${b._id}`)}>Chi tiết</button></td>
      </tr>
    ))
  )

  const Table = ({ title, list, timeField, timeLabel, empty }) => (
    <div className="ov-card">
      <div className="ov-card-head">
        <h3 className="ov-card-title">{title}</h3>
        <button className="ov-link" onClick={() => nav('/reception/bookings')}>Tất cả bookings</button>
      </div>
      {(!list || list.length === 0) ? (
        <div className="ov-empty"><CheckCircleOutlined />{empty}</div>
      ) : (
        <table className="ov-table">
          <thead>
            <tr><th>Mã</th><th>Khách</th><th>Phòng</th><th>{timeLabel}</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>{renderRows(list, timeField)}</tbody>
        </table>
      )}
    </div>
  )

  return (
    <div className="ov-wrap">
      <div className="ov-head">
        <div>
          <h2>Tổng quan trong ngày</h2>
          <p>Nhận/trả phòng hôm nay, tình trạng lưu trú & doanh thu</p>
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

      {/* Arrivals + Quick actions */}
      <div className="ov-mid">
        <Table
          title="Nhận phòng hôm nay" list={data?.arrivals} timeField="checkIn"
          timeLabel="Giờ nhận" empty="Hôm nay không có khách nhận phòng."
        />
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

      {/* Departures */}
      <Table
        title="Trả phòng hôm nay" list={data?.departures} timeField="checkOut"
        timeLabel="Giờ trả" empty="Hôm nay không có khách trả phòng."
      />
    </div>
  )
}
