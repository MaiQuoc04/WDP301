import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { fetchBranchDashboard } from '../../redux/slices/adminSlice'

const BranchDashboard = () => {
  const { branchId } = useParams()
  const dispatch = useDispatch()
  const { branchDashboard, loading, error } = useSelector(state => state.admin)

  useEffect(() => {
    if (branchId) {
      dispatch(fetchBranchDashboard(branchId))
    }
  }, [dispatch, branchId])

  if (loading && !branchDashboard) {
    return (
      <div className="admin-card text-center" style={{ padding: '80px 0' }}>
        <p style={{ color: 'var(--color-light-gray)' }}>Đang tải báo cáo chi nhánh...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-card" style={{ borderLeft: '4px solid var(--color-error)' }}>
        <h4 style={{ color: 'var(--color-error)', marginBottom: '8px' }}>Lỗi Tải Dữ Liệu</h4>
        <p style={{ marginBottom: '16px' }}>{error}</p>
        <Link to="/admin" className="admin-btn admin-btn-secondary">Quay lại Tổng Quan</Link>
      </div>
    )
  }

  const branch = branchDashboard?.branch || {}
  const summary = branchDashboard?.summary || { totalRevenue: 0, totalRooms: 0, occupiedRooms: 0, occupancyRate: 0, totalTasks: 0, missedTasks: 0, missedRate: 0 }
  const monthlyBookingTrend = branchDashboard?.monthlyBookingTrend || []

  // Formatting currency
  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0)
  }

  // Booking Trend SVG parameters
  const maxTrendVal = Math.max(...monthlyBookingTrend.map(t => t.count), 5)
  const svgWidth = 500
  const svgHeight = 220
  const paddingX = 40
  const paddingY = 30
  const chartWidth = svgWidth - paddingX * 2
  const chartHeight = svgHeight - paddingY * 2

  const trendPoints = monthlyBookingTrend.map((t, index) => {
    const x = paddingX + (index * chartWidth) / Math.max(monthlyBookingTrend.length - 1, 1)
    const y = svgHeight - paddingY - (t.count / maxTrendVal) * chartHeight
    return { x, y, label: t.label, count: t.count }
  })

  const linePath = trendPoints.length > 0 
    ? `M ${trendPoints[0].x} ${trendPoints[0].y} ` + trendPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') 
    : ''

  const areaPath = trendPoints.length > 0 
    ? `${linePath} L ${trendPoints[trendPoints.length - 1].x} ${svgHeight - paddingY} L ${trendPoints[0].x} ${svgHeight - paddingY} Z`
    : ''

  return (
    <div>
      {/* Back button and title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <Link to="/admin" className="admin-btn-icon" style={{ borderRadius: '50%' }} title="Quay lại">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </Link>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--color-black)', margin: 0 }}>
              Báo Cáo Chi Nhánh: {branch.name}
            </h2>
            <span className="admin-badge admin-badge-role">{branch.code}</span>
          </div>
          <p style={{ color: 'var(--color-light-gray)', margin: 0, fontSize: '14px' }}>
            Địa chỉ: {branch.address} | Điện thoại: {branch.phone}
          </p>
        </div>

        <Link to="/admin" className="admin-btn admin-btn-secondary">
          Quay lại Báo cáo chung
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card kpi-revenue">
          <div className="admin-kpi-info">
            <h3>Doanh thu chi nhánh</h3>
            <div className="admin-kpi-val">{formatVND(summary.totalRevenue)}</div>
          </div>
          <div className="admin-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>

        <div className="admin-kpi-card kpi-occupancy">
          <div className="admin-kpi-info">
            <h3>Tỷ lệ lấp đầy phòng</h3>
            <div className="admin-kpi-val">{summary.occupancyRate}%</div>
            <p style={{ fontSize: '11px', color: 'var(--color-light-gray)', margin: '4px 0 0 0' }}>
              Đã lấp đầy {summary.occupiedRooms} / {summary.totalRooms} phòng
            </p>
          </div>
          <div className="admin-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>

        <div className="admin-kpi-card kpi-missed">
          <div className="admin-kpi-info">
            <h3>Tỷ lệ dọn dẹp trễ</h3>
            <div className="admin-kpi-val">{summary.missedRate}%</div>
            <p style={{ fontSize: '11px', color: 'var(--color-light-gray)', margin: '4px 0 0 0' }}>
              Bỏ lỡ {summary.missedTasks} / {summary.totalTasks} công việc dọn dẹp
            </p>
          </div>
          <div className="admin-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* Reports and Charts */}
      <div className="admin-charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Xu hướng đặt phòng tại chi nhánh (6 tháng)</h3>
          </div>
          {monthlyBookingTrend.length === 0 ? (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-light-gray)' }}>
              Chưa có dữ liệu xu hướng đặt phòng cho chi nhánh này
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaGradBranch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-luxury-blue)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-luxury-blue)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const y = paddingY + p * chartHeight
                  const gridVal = Math.round(maxTrendVal * (1 - p))
                  return (
                    <g key={idx}>
                      <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} className="chart-svg-grid" strokeDasharray="3 3" />
                      <text x={paddingX - 10} y={y + 4} fill="var(--color-light-gray)" fontSize="10" textAnchor="end">{gridVal}</text>
                    </g>
                  )
                })}

                {/* Shaded Area */}
                {areaPath && <path d={areaPath} fill="url(#areaGradBranch)" />}

                {/* Line Path */}
                {linePath && <path d={linePath} fill="none" stroke="var(--color-luxury-blue)" strokeWidth="3" strokeLinecap="round" />}

                {/* Dots */}
                {trendPoints.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="5" fill="var(--color-luxury-blue)" stroke="var(--color-white)" strokeWidth="2" />
                    <text x={p.x} y={p.y - 10} fill="var(--color-black)" fontSize="11" fontWeight="bold" textAnchor="middle">{p.count}</text>
                    <text x={p.x} y={svgHeight - paddingY + 18} fill="var(--color-light-gray)" fontSize="10" textAnchor="middle">{p.label}</text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BranchDashboard
