import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchDashboardStats } from '../../redux/slices/adminSlice'

const DashboardIndex = () => {
  const dispatch = useDispatch()
  const { dashboardStats, loading, error } = useSelector(state => state.admin)

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  if (loading && !dashboardStats) {
    return (
      <div className="admin-card text-center" style={{ padding: '80px 0' }}>
        <p style={{ color: 'var(--color-light-gray)' }}>Đang tải dữ liệu báo cáo hệ thống...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-card" style={{ borderLeft: '4px solid var(--color-error)' }}>
        <h4 style={{ color: 'var(--color-error)', marginBottom: '8px' }}>Lỗi Tải Dữ Liệu</h4>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    )
  }

  // Fallbacks if stats not loaded yet
  const summary = dashboardStats?.summary || { totalBranches: 0, totalRevenue: 0, averageOccupancy: 0, averageMissedRate: 0 }
  const revenueByBranch = dashboardStats?.revenueByBranch || []
  const occupancyByBranch = dashboardStats?.occupancyByBranch || []
  const monthlyBookingTrend = dashboardStats?.monthlyBookingTrend || []
  const housekeepingKPI = dashboardStats?.housekeepingKPI || []

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

  const maxRevenue = Math.max(...revenueByBranch.map(r => r.total), 1000000)

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--color-black)', margin: '0 0 4px 0' }}>Báo Cáo Toàn Doanh Nghiệp</h2>
        <p style={{ color: 'var(--color-light-gray)', margin: 0, fontSize: '14px' }}>Dữ liệu tổng hợp tình hình kinh doanh và dịch vụ của toàn bộ hệ thống</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card kpi-revenue">
          <div className="admin-kpi-info">
            <h3>Tổng doanh thu chuỗi</h3>
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
            <h3>Tỷ lệ lấp đầy bình quân</h3>
            <div className="admin-kpi-val">{summary.averageOccupancy}%</div>
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
            <div className="admin-kpi-val">{summary.averageMissedRate}%</div>
          </div>
          <div className="admin-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Chi nhánh hoạt động</h3>
            <div className="admin-kpi-val">{summary.totalBranches}</div>
          </div>
          <div className="admin-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="admin-charts-grid">
        {/* Branch Revenue Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Doanh thu theo chi nhánh</h3>
          </div>
          {revenueByBranch.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-light-gray)' }}>
              Chưa có dữ liệu doanh thu
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 220, paddingBottom: '16px' }}>
              {revenueByBranch.map(r => {
                const percentHeight = (r.total / maxRevenue) * 100
                return (
                  <div key={r._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }} title={`${r.name}: ${formatVND(r.total)}`}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-charcoal)', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      {formatVND(r.total / 1000000)}M
                    </div>
                    <div style={{ height: 140, width: '28px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                      <div className="chart-svg-bar" style={{ width: '100%', height: `${percentHeight}%`, background: 'linear-gradient(to top, var(--color-gold), #d4af37)', borderRadius: '4px', transition: 'height 0.6s ease' }} />
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-light-gray)', marginTop: '8px' }}>{r.code}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Booking Trend Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Xu hướng đặt phòng (6 tháng)</h3>
          </div>
          {monthlyBookingTrend.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-light-gray)' }}>
              Chưa có dữ liệu xu hướng đặt phòng
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.0" />
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
                {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

                {/* Line Path */}
                {linePath && <path d={linePath} fill="none" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round" />}

                {/* Dots */}
                {trendPoints.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="5" fill="var(--color-gold)" stroke="var(--color-white)" strokeWidth="2" />
                    <text x={p.x} y={p.y - 10} fill="var(--color-black)" fontSize="11" fontWeight="bold" textAnchor="middle">{p.count}</text>
                    <text x={p.x} y={svgHeight - paddingY + 18} fill="var(--color-light-gray)" fontSize="10" textAnchor="middle">{p.label}</text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Branch Table with drilldown to branch dashboard */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Hiệu năng hoạt động các chi nhánh</h3>
        </div>
        
        <div className="admin-table-wrapper" style={{ boxShadow: 'none', margin: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Chi nhánh</th>
                <th>Mã</th>
                <th>Tỷ lệ lấp đầy</th>
                <th>Tỷ lệ dọn dẹp trễ</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {occupancyByBranch.map(branch => {
                const hk = housekeepingKPI.find(h => h._id === branch._id) || { missedRate: 0, totalTasks: 0 }
                return (
                  <tr key={branch._id}>
                    <td>
                      <strong style={{ fontSize: '15px' }}>{branch.name}</strong>
                    </td>
                    <td><span className="admin-badge admin-badge-role" style={{ fontSize: '11px' }}>{branch.code}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ minWidth: '40px', fontWeight: 'bold' }}>{branch.occupancyRate}%</span>
                        <div style={{ height: '6px', width: '80px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${branch.occupancyRate}%`, backgroundColor: '#8cb92b', borderRadius: '4px' }} />
                        </div>
                        <small style={{ color: 'var(--color-light-gray)' }}>({branch.occupiedRooms}/{branch.totalRooms} phòng)</small>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ minWidth: '40px', fontWeight: 'bold' }}>{hk.missedRate}%</span>
                        <div style={{ height: '6px', width: '80px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${hk.missedRate}%`, backgroundColor: hk.missedRate > 30 ? 'var(--color-error)' : 'var(--color-warning)', borderRadius: '4px' }} />
                        </div>
                        <small style={{ color: 'var(--color-light-gray)' }}>({hk.missedTasks}/{hk.totalTasks} việc)</small>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-active">Đang mở</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link 
                        to={`/admin/branches/${branch._id}/dashboard`} 
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 12px', height: '32px', fontSize: '12.5px' }}
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {occupancyByBranch.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-light-gray)' }}>
                    Chưa có chi nhánh nào hoạt động
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DashboardIndex
