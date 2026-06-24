import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleAccount, fetchUsers } from '../../redux/slices/adminSlice'

const StaffManagement = () => {
  const dispatch = useDispatch()
  const { usersList, loading, error } = useSelector(state => state.admin)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    dispatch(fetchUsers('customer'))
  }, [dispatch])

  const handleToggle = (accountId, name, currentStatus) => {
    const statusText = currentStatus ? 'khóa' : 'mở khóa'
    if (window.confirm(`Bạn có chắc muốn ${statusText} tài khoản của "${name}"?`)) {
      dispatch(toggleAccount(accountId))
    }
  }

  const filteredCustomers = usersList.filter(u => 
    (u.profile?.fullName && u.profile.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.profile?.phone && u.profile.phone.includes(searchQuery))
  )

  return (
    <div>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--color-black)', margin: '0 0 4px 0' }}>
          Quản Lý Tài Khoản Khách Hàng
        </h2>
        <p style={{ color: 'var(--color-light-gray)', margin: 0, fontSize: '14px' }}>
          Theo dõi danh sách khách hàng đã đăng ký tài khoản trong hệ thống HBMS
        </p>
      </div>

      {/* Search */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Tìm kiếm khách hàng theo tên, email, sđt..."
            className="admin-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--color-light-gray)' }}>
          Hiển thị <strong>{filteredCustomers.length}</strong> tài khoản
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '16px' }}>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && usersList.length === 0 ? (
        <div className="admin-card text-center" style={{ padding: '40px 0' }}>
          <p style={{ color: 'var(--color-light-gray)' }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Thông tin liên hệ</th>
                <th>Phương thức đăng nhập</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="admin-avatar" style={{ width: '36px', height: '36px', fontSize: '13px', background: 'linear-gradient(135deg, var(--color-luxury-blue) 0%, #007bff 100%)' }}>
                        {(u.profile?.fullName || 'K').charAt(0).toUpperCase()}
                      </div>
                      <strong style={{ fontSize: '15px' }}>{u.profile?.fullName || 'Khách hàng'}</strong>
                    </div>
                  </td>
                  <td>
                    <div>{u.email}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-light-gray)' }}>{u.profile?.phone || 'Chưa cập nhật'}</div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-role" style={{ textTransform: 'capitalize' }}>
                      {u.authProvider}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                      {u.isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className={`admin-btn ${u.isActive ? 'admin-btn-danger' : 'admin-btn-primary'}`} 
                      style={{ height: '32px', padding: '0 12px', fontSize: '12.5px' }}
                      onClick={() => handleToggle(u._id, u.profile?.fullName || u.email, u.isActive)}
                    >
                      {u.isActive ? 'Khóa tài khoản' : 'Mở tài khoản'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-light-gray)' }}>
                    Không tìm thấy khách hàng nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default StaffManagement
