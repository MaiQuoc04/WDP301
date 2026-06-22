import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  fetchStaff, 
  createStaff, 
  toggleAccount, 
  fetchBranches,
  changeStaffRole,
  assignStaffBranch,
  removeStaffBranch,
  fetchUsers
} from '../../redux/slices/adminSlice'

const StaffManagement = () => {
  const dispatch = useDispatch()
  const { staffList, branches, usersList, loading, error } = useSelector(state => state.admin)
  
  const [activeTab, setActiveTab] = useState('staff')
  const [showModal, setShowModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')

  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    fullName: '', 
    phone: '', 
    gender: 'male', 
    role: 'receptionist', 
    branchId: ''
  })

  useEffect(() => {
    dispatch(fetchBranches())
    setSearchQuery('') // Reset search query on tab change
    if (activeTab === 'staff') {
      dispatch(fetchStaff())
    } else {
      dispatch(fetchUsers('customer'))
    }
  }, [dispatch, activeTab])

  const handleCreate = async (e) => {
    e.preventDefault()
    await dispatch(createStaff(formData))
    setShowModal(false)
    setFormData({ email: '', password: '', fullName: '', phone: '', gender: 'male', role: 'receptionist', branchId: '' })
    dispatch(fetchStaff()) // reload to get populated data
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
    setSelectedBranchId('')
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
      await dispatch(assignStaffBranch({ accountId: selectedStaff.account?._id, branchId: selectedBranchId })).unwrap()
      setSelectedBranchId('')
      const updatedStaff = await dispatch(fetchStaff()).unwrap()
      const current = updatedStaff.find(s => s.account?._id === selectedStaff.account?._id)
      if (current) setSelectedStaff(current)
    } catch (err) {
      alert(err || 'Không thể gán chi nhánh')
    }
  }

  const handleRemoveBranch = async (assignmentId) => {
    if (window.confirm('Bạn có chắc muốn gỡ nhân viên khỏi chi nhánh này?')) {
      try {
        await dispatch(removeStaffBranch(assignmentId)).unwrap()
        const updatedStaff = await dispatch(fetchStaff()).unwrap()
        const current = updatedStaff.find(s => s.account?._id === selectedStaff.account?._id)
        if (current) setSelectedStaff(current)
      } catch (err) {
        alert(err || 'Không thể gỡ chi nhánh')
      }
    }
  }

  // Filter lists based on search query
  const filteredStaff = staffList.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.account?.email && s.account.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.phone && s.phone.includes(searchQuery)) ||
    (s.account?.role && s.account.role.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredCustomers = usersList.filter(u => 
    (u.profile?.fullName && u.profile.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.profile?.phone && u.profile.phone.includes(searchQuery))
  )

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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--color-black)', margin: 0 }}>
            {activeTab === 'staff' ? 'Quản Lý Nhân Sự' : 'Quản Lý Khách Hàng'}
          </h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0, fontSize: '14px' }}>
            {activeTab === 'staff' 
              ? 'Thêm nhân viên mới, phân quyền hệ thống và quản lý chi nhánh làm việc cho nhân viên' 
              : 'Theo dõi danh sách khách hàng đã đăng ký tài khoản trong hệ thống HBMS'}
          </p>
        </div>
        
        {activeTab === 'staff' && (
          <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tạo tài khoản nhân viên
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="admin-tabs" style={{ marginBottom: '20px' }}>
        <button 
          className={`admin-tab ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          Nhân viên (Staff)
        </button>
        <button 
          className={`admin-tab ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          Khách hàng (Customer)
        </button>
      </div>

      {/* Search and Filters */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder={activeTab === 'staff' ? "Tìm kiếm theo tên, email, sđt, vai trò..." : "Tìm kiếm khách hàng theo tên, email, sđt..."}
            className="admin-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--color-light-gray)' }}>
          Hiển thị <strong>{activeTab === 'staff' ? filteredStaff.length : filteredCustomers.length}</strong> tài khoản
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '16px' }}>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && (activeTab === 'staff' ? staffList.length === 0 : usersList.length === 0) ? (
        <div className="admin-card text-center" style={{ padding: '40px 0' }}>
          <p style={{ color: 'var(--color-light-gray)' }}>Đang tải dữ liệu...</p>
        </div>
      ) : activeTab === 'staff' ? (
        /* Staff List Table */
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Họ tên nhân viên</th>
                <th>Thông tin liên hệ</th>
                <th>Vai trò</th>
                <th>Chi nhánh hoạt động</th>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {s.assignments?.map(a => (
                        <div key={a._id} style={{ fontSize: '13px' }}>
                          📍 {a.branch?.name} <span style={{ color: 'var(--color-pale-gray)' }}>({a.branch?.code})</span>
                        </div>
                      ))}
                      {(!s.assignments || s.assignments.length === 0) && (
                        <span style={{ color: 'var(--color-pale-gray)', fontStyle: 'italic', fontSize: '13px' }}>Chưa gán</span>
                      )}
                    </div>
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
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-light-gray)' }}>
                    Không tìm thấy nhân viên nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Customer List Table */
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

      {/* Modal: Create Staff */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Tạo Tài Khoản Nhân Viên</h3>
              <span className="admin-modal-close" onClick={() => setShowModal(false)}>&times;</span>
            </div>
            <form onSubmit={handleCreate}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Họ tên nhân viên:</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})} 
                  />
                </div>
                
                <div className="admin-form-group">
                  <label>Email (Tên đăng nhập):</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>

                <div className="admin-form-group">
                  <label>Mật khẩu đăng nhập:</label>
                  <input 
                    required 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group">
                    <label>Số điện thoại:</label>
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Giới tính:</label>
                    <select 
                      value={formData.gender} 
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>
                </div>
                
                <div className="admin-form-group">
                  <label>Vai trò (Role):</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="receptionist">Receptionist (Lễ tân)</option>
                    <option value="housekeeper">Housekeeper (Buồng phòng)</option>
                    <option value="branch_manager">Branch Manager (Quản lý chi nhánh)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Gán chi nhánh đầu tiên:</label>
                  <select 
                    required 
                    value={formData.branchId} 
                    onChange={e => setFormData({...formData, branchId: e.target.value})}
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches.filter(b => b.isActive).map(b => (
                      <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Tạo Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Staff Role & Branch assignments */}
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
              
              {/* Update Role Section */}
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px', marginBottom: '20px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Thay đổi vai trò (Role):</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select className="admin-select" style={{ flex: 1 }} value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="receptionist">Receptionist (Lễ tân)</option>
                    <option value="housekeeper">Housekeeper (Buồng phòng)</option>
                    <option value="branch_manager">Branch Manager (Quản lý chi nhánh)</option>
                  </select>
                  <button className="admin-btn admin-btn-primary" onClick={handleRoleChange}>
                    Cập nhật
                  </button>
                </div>
              </div>

              {/* Branch Assignment Section */}
              <div>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Danh sách chi nhánh phụ trách:</label>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedStaff.assignments?.map(a => (
                    <li 
                      key={a._id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '8px 12px', 
                        backgroundColor: '#fafafa', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '4px' 
                      }}
                    >
                      <span style={{ fontSize: '13.5px', fontWeight: '500' }}>📍 {a.branch?.name} ({a.branch?.code})</span>
                      <button 
                        className="admin-btn admin-btn-danger" 
                        style={{ height: '28px', padding: '0 10px', fontSize: '11.5px' }}
                        onClick={() => handleRemoveBranch(a._id)}
                      >
                        Gỡ chi nhánh
                      </button>
                    </li>
                  ))}
                  {(!selectedStaff.assignments || selectedStaff.assignments.length === 0) && (
                    <li style={{ color: 'var(--color-pale-gray)', fontStyle: 'italic', fontSize: '13px', padding: '8px 0' }}>
                      Chưa gán chi nhánh nào. Nhân viên này sẽ không đăng nhập được các hệ thống của chi nhánh.
                    </li>
                  )}
                </ul>

                <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Gán chi nhánh làm việc mới:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    className="admin-select" 
                    style={{ flex: 1 }} 
                    value={selectedBranchId} 
                    onChange={e => setSelectedBranchId(e.target.value)}
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches
                      .filter(b => b.isActive && !selectedStaff.assignments?.some(a => a.branch?._id === b._id))
                      .map(b => (
                        <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                      ))
                    }
                  </select>
                  <button 
                    className="admin-btn admin-btn-primary" 
                    onClick={handleAssignBranch} 
                    disabled={!selectedBranchId}
                  >
                    Gán chi nhánh
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowRoleModal(false)}>
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffManagement
