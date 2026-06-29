import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import {
  DollarOutlined,
  RiseOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  TeamOutlined,
  PictureOutlined,
  BarChartOutlined,
  RightOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { fetchDashboardStats } from '../../redux/slices/adminSlice'
import '../manager/dashboard-overview.css'

const compactVND = (n) => {
  n = n || 0
  if (n >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ ₫'
  if (n >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' Tr ₫'
  return (n).toLocaleString('vi-VN') + ' ₫'
}
const fullVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

const DashboardIndex = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { dashboardStats, loading, error } = useSelector((state) => state.admin)
  const [grown, setGrown] = useState(false)

  useEffect(() => { dispatch(fetchDashboardStats()) }, [dispatch])

  // Cột mọc từ 0 mỗi khi stats sẵn sàng
  useEffect(() => {
    if (!dashboardStats) { setGrown(false); return }
    const t = setTimeout(() => setGrown(true), 90)
    return () => clearTimeout(t)
  }, [dashboardStats])

  if (loading && !dashboardStats) {
    return <div className="ov-empty" style={{ padding: '90px 0' }}>Đang tải dữ liệu báo cáo hệ thống...</div>
  }
  if (error) {
    return (
      <div className="ov-card" style={{ borderLeft: '4px solid #c0392b' }}>
        <h4 style={{ color: '#c0392b', margin: '0 0 8px' }}>Lỗi tải dữ liệu</h4>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    )
  }

  const summary = dashboardStats?.summary || { totalBranches: 0, totalRevenue: 0, averageOccupancy: 0, averageMissedRate: 0 }
  const revenueByBranch = dashboardStats?.revenueByBranch || []
  const monthlyBookingTrend = dashboardStats?.monthlyBookingTrend || []

  const totalRevenue = summary.totalRevenue || 0

  // ---- KPI ----
  const kpis = [
    { icon: <DollarOutlined />, label: 'Tổng doanh thu chuỗi', value: compactVND(totalRevenue), ctx: 'toàn hệ thống', tone: 'flat' },
    { icon: <RiseOutlined />, label: 'Tỷ lệ lấp đầy bình quân', value: `${summary.averageOccupancy || 0}%`, ctx: (summary.averageOccupancy || 0) >= 70 ? 'tốt' : 'theo dõi', tone: (summary.averageOccupancy || 0) >= 70 ? 'up' : 'flat' },
    { icon: <ApartmentOutlined />, label: 'Chi nhánh hoạt động', value: `${summary.totalBranches || 0}`, ctx: 'đang mở', tone: 'flat' },
    { icon: <ClockCircleOutlined />, label: 'Tỷ lệ dọn dẹp trễ', value: `${summary.averageMissedRate || 0}%`, ctx: (summary.averageMissedRate || 0) > 0 ? 'cần cải thiện' : 'đúng hạn', tone: (summary.averageMissedRate || 0) > 0 ? 'down' : 'up' },
  ]

  // ---- Bar chart: lượt đặt phòng theo tháng ----
  const bars = monthlyBookingTrend.map((t) => ({ label: t.label, value: t.count }))
  const maxBar = Math.max(...bars.map((b) => b.value), 1)

  // ---- Quick actions ----
  const actions = [
    { icon: <ShopOutlined />, label: 'Quản lý chi nhánh', to: '/admin/branches' },
    { icon: <TeamOutlined />, label: 'Quản lý khách hàng', to: '/admin/staff' },
    { icon: <PictureOutlined />, label: 'Thư viện ảnh', to: '/admin/gallery' },
    { icon: <BarChartOutlined />, label: 'Báo cáo chi tiết', to: '/admin/reports' },
  ]

  // ---- Bảng hiệu suất theo chi nhánh ----
  const topRevenue = Math.max(...revenueByBranch.map((r) => r.total), 0)
  const rankedBranches = [...revenueByBranch].sort((a, b) => b.total - a.total)

  return (
    <div className="ov-wrap">
      <div className="ov-head">
        <div>
          <h2>Báo cáo toàn doanh nghiệp</h2>
          <p>Dữ liệu tổng hợp tình hình kinh doanh & dịch vụ của toàn hệ thống</p>
        </div>
        <Button type="primary" icon={<SyncOutlined />} onClick={() => dispatch(fetchDashboardStats())}>Làm mới</Button>
      </div>

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
            <h3 className="ov-card-title">Lượt đặt phòng theo tháng</h3>
            <button className="ov-link" onClick={() => navigate('/admin/reports')}>Báo cáo chi tiết</button>
          </div>
          {bars.length === 0 ? (
            <div className="ov-empty"><BarChartOutlined />Chưa có dữ liệu xu hướng đặt phòng</div>
          ) : (
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
          )}
        </div>

        <div className="ov-card">
          <div className="ov-card-head"><h3 className="ov-card-title">Tác vụ nhanh</h3></div>
          <div className="ov-actions">
            {actions.map((a) => (
              <button className="ov-action" key={a.to} onClick={() => navigate(a.to)}>
                {a.icon}
                <span style={{ flex: 1 }}>{a.label}</span>
                <RightOutlined style={{ fontSize: 12, color: '#c9bfb2' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bảng hiệu suất theo chi nhánh */}
      <div className="ov-card">
        <div className="ov-card-head">
          <h3 className="ov-card-title">Hiệu suất theo chi nhánh</h3>
          <button className="ov-link" onClick={() => navigate('/admin/branches')}>Quản lý chi nhánh</button>
        </div>
        {rankedBranches.length === 0 ? (
          <div className="ov-empty"><ShopOutlined />Chưa có dữ liệu doanh thu chi nhánh</div>
        ) : (
          <table className="ov-table">
            <thead>
              <tr>
                <th>Chi nhánh</th>
                <th>Mã</th>
                <th>Doanh thu</th>
                <th>Tỷ trọng</th>
                <th>Xếp hạng</th>
              </tr>
            </thead>
            <tbody>
              {rankedBranches.map((r, i) => {
                const share = totalRevenue > 0 ? Math.round((r.total / totalRevenue) * 100) : 0
                return (
                  <tr key={r._id || r.code || i}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><span className="ov-room-chip">{r.code}</span></td>
                    <td>{fullVND(r.total)}</td>
                    <td>{share}%</td>
                    <td>
                      <span className={`ov-pill ${r.total === topRevenue && topRevenue > 0 ? 'gold' : 'neutral'}`}>
                        {r.total === topRevenue && topRevenue > 0 ? 'Dẫn đầu' : 'Hoạt động'}
                      </span>
                    </td>
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

export default DashboardIndex
