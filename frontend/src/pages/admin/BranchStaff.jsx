import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { 
  fetchStaff, 
  fetchBranches,
  createStaff,
  toggleAccount,
  changeStaffRole,
  assignStaffBranch,
  removeStaffBranch
} from '../../redux/slices/adminSlice'

const BranchStaff = () => {
  const { branchId } = useParams()
  const dispatch = useDispatch()
  const { staffList, branches, loading, error } = useSelector(state => state.admin)

  const [showModal, setShowModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')

  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', phone: '', gender: 'male', role: 'receptionist', branchId: ''
  })

  useEffect(() => {
    dispatch(fetchStaff())
    dispatch(fetchBranches())
  }, [dispatch])

  // Set default branchId for creating new staff
  useEffect(() => {
    if (branchId) {
      setFormData(prev => ({ ...prev, branchId }))
    }
  }, [branchId])

  const currentBranch = branches.find(b => b._id === branchId)

  // Filter staff that belong to this branch
  const branchStaff = staffList.filter(s =>
    s.assignments?.some(a => a.branch?._id === branchId)
  )

  const filteredStaff = branchStaff.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.account?.email && s.account.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.phone && s.phone.includes(searchQuery)) ||
    (s.account?.role && s.account.role.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    await dispatch(createStaff({ ...formData, branchId }))
    setShowModal(false)
    setFormData({ email: '', password: '', fullName: '', phone: '', gender: 'male', role: 'receptionist', branchId })
    dispatch(fetchStaff())
  }

  const handleToggle = (accountId, name, currentStatus) => {
    const statusText = currentStatus ? 'khóa' : 'mở khóa'
    if (window.confirm(`Bạn có chắc muốn ${statusText} tài khoản của "${name}"?`)) {
      dispatch(toggleAccount(accountId))
    }
  }

  const handleManageStaff = (staff) => {
    setSelectedStaff(staff)
    setNewRole(staff.account?.role || 'receptionist')
    const currentBrId = staff.assignments && staff.assignments[0] ? staff.assignments[0].branch?._id : ''
    setSelectedBranchId(currentBrId || '')
    setShowRoleModal(true)
  }

  const handleRoleChange = async () => {
    try {
      await dispatch(changeStaffRole({ accountId: selectedStaff.account?._id, role: newRole })).unwrap()
      alert('Cập nhật vai trò thành công!')
      const updatedStaff = await dispatch(fetchStaff()).unwrap()
      const current = updatedStaff.find(s => s.account?._id === selectedStaff.account?._id)
      if (current) setSelectedStaff(current)
    } catch (err) {
      alert(err || 'Không thể cập nhật vai trò')
    }
  }

  const handleAssignBranch = async () => {
    try {
      if (!selectedBranchId) {
        const currentAssignment = selectedStaff.assignments && selectedStaff.assignments[0]
        if (currentAssignment) {
          await dispatch(removeStaffBranch(currentAssignment._id)).unwrap()
          alert('Đã gỡ nhân viên khỏi chi nhánh!')
        }
      } else {
        await dispatch(assignStaffBranch({ accountId: selectedStaff.account?._id, branchId: selectedBranchId })).unwrap()
        alert('Cập nhật chi nhánh thành công!')
      }
      const updatedStaff = await dispatch(fetchStaff()).unwrap()
      const current = updatedStaff.find(s => s.account?._id === selectedStaff.account?._id)
      if (current) setSelectedStaff(current)
    } catch (err) {
      alert(err || 'Không thể gán chi nhánh')
    }
  }

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'branch_manager': return 'admin-badge-manager'
      case 'receptionist': return 'admin-badge-receptionist'
      case 'housekeeper': return 'admin-badge-housekeeper'
      default: return 'admin-badge-role'
    }
  }

  const getRoleLabel = (role) => {
    switch(role) {
      case 'branch_manager': return 'Quản lý Chi nhánh'
      case 'receptionist': return 'Lễ tân'
      case 'housekeeper': return 'Buồng phòng'
      case 'super_admin': return 'Super Admin'
      default: return role
    }
  }

  return (
    <div>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <Link to="/admin/branches" className="admin-btn-icon" style={{ borderRadius: '50%' }} title="Quay lại danh sách chi nhánh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </Link>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--color-black)', margin: 0 }}>
              Nhân viên chi nhánh: {currentBranch?.name || '...'}
            </h2>
            {currentBranch?.code && <span className="admin-badge admin-badge-role">{currentBranch.code}</span>}
          </div>
          <p style={{ color: 'var(--color-light-gray)', margin: 0, fontSize: '14px', paddingLeft: '40px' }}>
            Danh sách nhân viên đang làm việc tại chi nhánh này
          </p>
        </div>

        <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tạo tài khoản nhân viên
        </button>
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
            placeholder="Tìm kiếm theo tên, email, sđt, vai trò..."
            className="admin-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--color-light-gray)' }}>
          Hiển thị <strong>{filteredStaff.length}</strong> nhân viên
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '16px' }}>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && staffList.length === 0 ? (
        <div className="admin-card text-center" style={{ padding: '40px 0' }}>
          <p style={{ color: 'var(--color-light-gray)' }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Họ tên nhân viên</th>
                <th>Thông tin liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="admin-avatar" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                        {s.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <strong style={{ fontSize: '15px' }}>{s.fullName}</strong>
                    </div>
                  </td>
                  <td>
                    <div>{s.account?.email}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-light-gray)' }}>{s.phone || 'Chưa cập nhật'}</div>
                  </td>
                  <td>
                    <span className={`admin-badge ${getRoleBadgeClass(s.account?.role)}`}>
                      {getRoleLabel(s.account?.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${s.account?.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                      {s.account?.isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {s.account?.role !== 'super_admin' ? (
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          className="admin-btn admin-btn-secondary" 
                          style={{ height: '32px', padding: '0 12px', fontSize: '12.5px' }}
                          onClick={() => handleManageStaff(s)}
                        >
                          Phân công & Role
                        </button>
                        <button 
                          className={`admin-btn ${s.account?.isActive ? 'admin-btn-danger' : 'admin-btn-primary'}`} 
                          style={{ height: '32px', padding: '0 12px', fontSize: '12.5px' }}
                          onClick={() => handleToggle(s.account?._id, s.fullName, s.account?.isActive)}
                        >
                          {s.account?.isActive ? 'Khóa' : 'Mở'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-pale-gray)', fontStyle: 'italic', fontSize: '13px' }}>Mặc định</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-light-gray)' }}>
                    Chưa có nhân viên nào được gán vào chi nhánh này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Staff */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Tạo Tài Khoản Nhân Viên — {currentBranch?.name}</h3>
              <span className="admin-modal-close" onClick={() => setShowModal(false)}>&times;</span>
            </div>
            <form onSubmit={handleCreate}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Họ tên nhân viên:</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="admin-form-group">
                  <label>Email (Tên đăng nhập):</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="admin-form-group">
                  <label>Mật khẩu đăng nhập:</label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Số điện thoại:</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="admin-form-group">
                    <label>Giới tính:</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Vai trò (Role):</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="receptionist">Receptionist (Lễ tân)</option>
                    <option value="housekeeper">Housekeeper (Buồng phòng)</option>
                    <option value="branch_manager">Branch Manager (Quản lý chi nhánh)</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                <button type="submit" className="admin-btn admin-btn-primary">Tạo Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Staff Role & Branch */}
      {showRoleModal && selectedStaff && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Quản Lý Nhân Viên: {selectedStaff.fullName}</h3>
              <span className="admin-modal-close" onClick={() => setShowRoleModal(false)}>&times;</span>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: '0 0 20px 0', color: 'var(--color-light-gray)', fontSize: '13.5px' }}>
                Email: <strong>{selectedStaff.account?.email}</strong> | Vai trò hiện tại: <strong>{getRoleLabel(selectedStaff.account?.role)}</strong>
              </p>
              
              {/* Update Role */}
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px', marginBottom: '20px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Thay đổi vai trò (Role):</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select className="admin-select" style={{ flex: 1 }} value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="receptionist">Receptionist (Lễ tân)</option>
                    <option value="housekeeper">Housekeeper (Buồng phòng)</option>
                    <option value="branch_manager">Branch Manager (Quản lý chi nhánh)</option>
                  </select>
                  <button className="admin-btn admin-btn-primary" onClick={handleRoleChange}>Cập nhật</button>
                </div>
              </div>

              {/* Branch Assignment */}
              <div>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Chi nhánh làm việc (Branch):</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select className="admin-select" style={{ flex: 1 }} value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)}>
                    <option value="">-- Chưa gán chi nhánh --</option>
                    {branches.filter(b => b.isActive).map(b => (
                      <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                  <button className="admin-btn admin-btn-primary" onClick={handleAssignBranch}>Cập nhật</button>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowRoleModal(false)}>Đóng lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BranchStaff
