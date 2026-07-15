import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin, Button, Alert } from 'antd'
import { roomService } from '../../services/roomService'
import { fmtDateTime } from '../../utils/date'
import {
  HomeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  AppstoreOutlined,
  DollarOutlined,
  ApartmentOutlined,
  CustomerServiceOutlined,
  RightOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import './dashboard-overview.css'

export default function DashboardOverview() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [grown, setGrown] = useState(false) // trigger animate cột mọc từ 0
  const [error, setError] = useState('')
  const [data, setData] = useState({
    rooms: [], roomTypes: [], amenities: [], services: [], issues: [], tasks: [], hkFloors: [],
  })

  const loadData = async () => {
    setLoading(true); setError('')
    try {
      const [rooms, roomTypes, amenities, services, issues, tasks, hkFloors] = await Promise.all([
        roomService.getRooms(),
        roomService.getRoomTypes(),
        roomService.getAmenities(),
        roomService.getServices(),
        roomService.getRoomIssues(),
        roomService.getHousekeepingTasks(),
        roomService.getHousekeeperFloors().catch(() => []),
      ])
      setData({ rooms, roomTypes, amenities, services, issues, tasks, hkFloors })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu thống kê')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Cột biểu đồ mọc từ 0 lên mỗi khi data sẵn sàng (và khi bấm "Làm mới")
  useEffect(() => {
    if (loading) { setGrown(false); return }
    const t = setTimeout(() => setGrown(true), 90)
    return () => clearTimeout(t)
  }, [loading])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <Spin size="large" tip="Đang tải dữ liệu tổng quan..." />
      </div>
    )
  }

  const totalRooms = data.rooms.length
  const byStatus = (s) => data.rooms.filter((r) => r.status === s).length
  const occupiedRooms = byStatus('occupied')
  const availableRooms = byStatus('available')
  const cleaningRooms = byStatus('cleaning')
  const maintenanceRooms = byStatus('maintenance')
  const lockedRooms = byStatus('locked')

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
  const openIssues = data.issues.filter((i) => i.status === 'open')
  const pendingTasks = data.tasks.filter((t) => t.status === 'pending')
  const unassignedFloors = data.hkFloors.filter((h) => !h.floors || h.floors.length === 0).length

  // ---- KPI ----
  const kpis = [
    {
      icon: <HomeOutlined />, label: 'Hiệu suất phòng', value: `${occupancyRate}%`,
      ctx: `${occupiedRooms} đang ở`, tone: 'flat',
    },
    {
      icon: <CheckCircleOutlined />, label: 'Phòng trống sẵn sàng', value: `${availableRooms}`,
      ctx: `/ ${totalRooms} phòng`, tone: 'flat',
    },
    {
      icon: <SyncOutlined />, label: 'Dọn dẹp chờ xử lý', value: `${pendingTasks.length}`,
      ctx: pendingTasks.length > 0 ? 'cần làm' : 'đã xong', tone: pendingTasks.length > 0 ? 'down' : 'up',
    },
    {
      icon: <WarningOutlined />, label: 'Sự cố chưa giải quyết', value: `${openIssues.length}`,
      ctx: openIssues.length > 0 ? 'cần xử lý' : 'ổn định', tone: openIssues.length > 0 ? 'down' : 'up',
    },
  ]

  // ---- Bar chart: phân bổ trạng thái phòng vật lý ----
  const bars = [
    { label: 'Trống', value: availableRooms },
    { label: 'Đang ở', value: occupiedRooms },
    { label: 'Đang dọn', value: cleaningRooms },
    { label: 'Bảo trì', value: maintenanceRooms },
    { label: 'Khóa', value: lockedRooms },
  ]
  const maxBar = Math.max(...bars.map((b) => b.value), 1)

  // ---- Quick actions ----
  const actions = [
    { icon: <AppstoreOutlined />, label: 'Quản lý loại phòng', to: '/manager/room-types' },
    { icon: <DollarOutlined />, label: 'Cấu hình giá phòng', to: '/manager/room-prices' },
    { icon: <ApartmentOutlined />, label: 'Phân tầng buồng phòng', to: '/manager/floors' },
    { icon: <CustomerServiceOutlined />, label: 'Quản lý dịch vụ', to: '/manager/services' },
  ]

  const SEV = {
    high: { cls: 'high', label: 'Cao' },
    medium: { cls: 'medium', label: 'Trung bình' },
    low: { cls: 'low', label: 'Thấp' },
  }

  return (
    <div className="ov-wrap">
      {/* Header */}
      <div className="ov-head">
        <div>
          <h2>Xin chào, Quản lý</h2>
          <p>Tổng quan tình trạng hoạt động của chi nhánh hôm nay</p>
        </div>
        <Button type="primary" icon={<SyncOutlined />} onClick={loadData}>Làm mới</Button>
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}
      {unassignedFloors > 0 && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 20 }}
          message={`Có ${unassignedFloors} nhân viên buồng phòng chưa được phân tầng`}
          description="Lễ tân giao việc theo tầng phụ trách — hãy phân tầng để hệ thống gợi ý chính xác."
          action={<Button size="small" type="primary" onClick={() => navigate('/manager/floors')}>Phân tầng ngay</Button>}
        />
      )}

      {/* KPI */}
      <div className="ov-kpis">
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

      {/* Chart + Quick actions */}
      <div className="ov-mid">
        <div className="ov-card">
          <div className="ov-card-head">
            <h3 className="ov-card-title">Phân bổ trạng thái phòng vật lý</h3>
            <button className="ov-link" onClick={() => navigate('/manager/rooms')}>Xem phòng</button>
          </div>
          <div className="ov-bars">
            {bars.map((b) => (
              <div className="ov-bar-col" key={b.label}>
                <div className="ov-bar-track">
                  <div
                    className={`ov-bar ${b.value === maxBar && maxBar > 0 ? 'is-max' : ''} ${grown ? 'grown' : ''}`}
                    style={{ height: grown ? `${Math.max((b.value / maxBar) * 100, b.value > 0 ? 8 : 0)}%` : '0%' }}
                  >
                    <span className="ov-bar-val">{b.value}</span>
                  </div>
                </div>
                <span className="ov-bar-label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ov-card">
          <div className="ov-card-head">
            <h3 className="ov-card-title">Tác vụ nhanh</h3>
          </div>
          <div className="ov-actions">
            {actions.map((a) => (
              <button className="ov-action" key={a.to} onClick={() => navigate(a.to)}>
                {a.icon}
                <span style={{ flex: 1 }}>{a.label}</span>
                <RightOutlined style={{ fontSize: 12, color: '#c9bfb2' }} />
              </button>
            ))}
            <div className="ov-hint">
              <InboxOutlined />
              <div>
                <b>Bổ sung thiết bị</b>
                <span>Kiểm tra & nhập kho phòng</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent issues */}
      <div className="ov-card">
        <div className="ov-card-head">
          <h3 className="ov-card-title">Sự cố phòng cần xử lý gấp</h3>
          <button className="ov-link" onClick={() => navigate('/manager/issues')}>Xem tất cả</button>
        </div>
        {openIssues.length === 0 ? (
          <div className="ov-empty">
            <CheckCircleOutlined />
            Không có sự cố nào chưa giải quyết
          </div>
        ) : (
          <table className="ov-table">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Mô tả sự cố</th>
                <th>Mức độ</th>
                <th>Ngày báo cáo</th>
              </tr>
            </thead>
            <tbody>
              {openIssues.slice(0, 6).map((it) => {
                const sev = SEV[it.severity] || { cls: 'low', label: it.severity }
                return (
                  <tr key={it._id}>
                    <td><span className="ov-room-chip">{it.room?.roomNumber || '—'}</span></td>
                    <td>{it.description}</td>
                    <td><span className={`ov-pill ${sev.cls}`}>{sev.label}</span></td>
                    <td>{fmtDateTime(it.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
