import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchBranchDashboard, fetchBranches, fetchDashboardStats } from '../../redux/slices/adminSlice'

const BranchDashboard = () => {
  const { branchId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { branchDashboard, dashboardStats, branches, loading, error } = useSelector(state => state.admin)

  useEffect(() => {
    if (branchId) {
      dispatch(fetchBranchDashboard(branchId))
    }
  }, [dispatch, branchId])

  // Fetch branches list for dropdown select selector
  useEffect(() => {
    if (!branches || branches.length === 0) {
      dispatch(fetchBranches())
    }
  }, [dispatch, branches])

  // Fetch global dashboard stats (for the branch list table) if no branchId is specified
  useEffect(() => {
    if (!branchId && !dashboardStats) {
      dispatch(fetchDashboardStats())
    }
  }, [dispatch, branchId, dashboardStats])

  // ----------------------------------------------------
  // CASE 1: Render All Branches Performance Table (no branchId specified)
  // ----------------------------------------------------
  if (!branchId) {
    if (loading && !dashboardStats) {
      return (
        <div className="admin-card text-center" style={{ padding: '80px 0' }}>
          <p style={{ color: 'var(--color-light-gray)' }}>Đang tải hiệu năng hoạt động các chi nhánh...</p>
        </div>
      )
    }

    if (error && !dashboardStats) {
      return (
        <div className="admin-card" style={{ borderLeft: '4px solid var(--color-error)' }}>
          <h4 style={{ color: 'var(--color-error)', marginBottom: '8px' }}>Lỗi Tải Dữ Liệu</h4>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )
    }

    const occupancyByBranch = dashboardStats?.occupancyByBranch || []
    const housekeepingKPI = dashboardStats?.housekeepingKPI || []

    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--color-black)', margin: '0 0 4px 0' }}>
            Hiệu Năng Hoạt Động Các Chi Nhánh
          </h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0, fontSize: '14px' }}>
            Báo cáo chi tiết và giám sát hiệu suất phòng, công việc dọn dẹp theo từng chi nhánh
          </p>
        </div>

        {/* Branch Performance Table */}
        <div className="admin-card" style={{ marginBottom: '24px' }}>
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
                  const hk = housekeepingKPI.find(h => h._id === branch._id) || { missedRate: 0, totalTasks: 0, missedTasks: 0 }
                  return (
                    <tr key={branch._id}>
                      <td>
                        <strong style={{ fontSize: '15px' }}>{branch.name}</strong>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-role" style={{ fontSize: '11px' }}>{branch.code}</span>
                      </td>
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
                          to={`/admin/reports/${branch._id}`} 
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

  // ----------------------------------------------------
  // CASE 2: Render Single Branch Dashboard (branchId is specified)
  // ----------------------------------------------------
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
        <Link to="/admin/reports" className="admin-btn admin-btn-secondary">Quay lại Danh Sách</Link>
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
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <Link to="/admin/reports" className="admin-btn-icon" style={{ borderRadius: '50%' }} title="Quay lại danh sách">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--color-black)', margin: 0 }}>
            Báo Cáo Chi Nhánh:
          </h2>
          <select
            value={branchId || ''}
            onChange={(e) => navigate(`/admin/reports/${e.target.value}`)}
            style={{
              padding: '8px 32px 8px 16px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-charcoal)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              minWidth: '240px',
              outline: 'none',
              boxShadow: 'var(--shadow-subtle)',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '16px',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
          >
            {branches.map(b => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
          {branch.code && <span className="admin-badge admin-badge-role" style={{ height: 'fit-content' }}>{branch.code}</span>}
        </div>
        {branch.address && (
          <p style={{ color: 'var(--color-light-gray)', margin: 0, fontSize: '14px', paddingLeft: '40px' }}>
            Địa chỉ: {branch.address} | Điện thoại: {branch.phone || branch.hotline || 'N/A'}
          </p>
        )}
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
            <h3 className="admin-card-title">Xu hình đặt phòng tại chi nhánh (6 tháng)</h3>
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
