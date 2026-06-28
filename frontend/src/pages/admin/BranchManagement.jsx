import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchBranches, createBranch, toggleBranch, updateBranch } from '../../redux/slices/adminSlice'

const PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/

const BranchManagement = () => {
  const dispatch = useDispatch()
  const { branches, loading, error } = useSelector(state => state.admin)
  
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedBranchId, setSelectedBranchId] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({ 
    code: '', 
    name: '', 
    location: '', 
    hotline: '',
    depositRate: 30, // Default 30%
    pendingTimeoutMinutes: 15
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    dispatch(fetchBranches())
  }, [dispatch])

  const handleEditClick = (branch) => {
    setSelectedBranchId(branch._id)
    setFormData({ 
      code: branch.code, 
      name: branch.name, 
      location: branch.location || '', 
      hotline: branch.hotline || '',
      depositRate: branch.depositRate ? Math.round(branch.depositRate * 100) : 30,
      pendingTimeoutMinutes: branch.pendingTimeoutMinutes || 15
    })
    setEditMode(true)
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditMode(false)
    setSelectedBranchId(null)
    setFormErrors({})
    setFormData({ 
      code: '', 
      name: '', 
      location: '', 
      hotline: '',
      depositRate: 30,
      pendingTimeoutMinutes: 15
    })
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.code.trim()) {
      errors.code = 'Vui lòng nhập mã chi nhánh'
    }
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập tên chi nhánh'
    }
    if (formData.hotline && !PHONE_REGEX.test(formData.hotline)) {
      errors.hotline = 'Số hotline không hợp lệ (VD: 0912345678)'
    }
    if (!formData.depositRate && formData.depositRate !== 0) {
      errors.depositRate = 'Vui lòng nhập tỷ lệ đặt cọc'
    } else if (formData.depositRate < 0 || formData.depositRate > 100) {
      errors.depositRate = 'Tỷ lệ đặt cọc phải từ 0% đến 100%'
    }
    if (!formData.pendingTimeoutMinutes) {
      errors.pendingTimeoutMinutes = 'Vui lòng nhập thời gian giữ phòng'
    } else if (formData.pendingTimeoutMinutes < 5 || formData.pendingTimeoutMinutes > 120) {
      errors.pendingTimeoutMinutes = 'Thời gian giữ phòng phải từ 5 đến 120 phút'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    // Convert depositRate percentage back to decimal
    const payload = {
      ...formData,
      depositRate: formData.depositRate / 100
    }
    
    if (editMode) {
      await dispatch(updateBranch({ id: selectedBranchId, data: payload }))
    } else {
      await dispatch(createBranch(payload))
    }
    handleCloseModal()
  }

  const handleToggle = (id, name, currentStatus) => {
    const statusText = currentStatus ? 'khóa' : 'mở khóa'
    if (window.confirm(`Bạn có chắc muốn ${statusText} chi nhánh "${name}"?`)) {
      dispatch(toggleBranch(id))
    }
  }

  // Search logic
  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.location && b.location.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--color-black)', margin: 0 }}>
            Quản Lý Chi Nhánh
          </h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0, fontSize: '14px' }}>
            Quản lý thông tin, cấu hình tiền cọc và theo dõi hiệu suất hoạt động từng chi nhánh
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Thêm chi nhánh
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo mã, tên hoặc địa chỉ..." 
            className="admin-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--color-light-gray)' }}>
          Hiển thị <strong>{filteredBranches.length}</strong> chi nhánh
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '16px' }}>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && branches.length === 0 ? (
        <div className="admin-card text-center" style={{ padding: '40px 0' }}>
          <p style={{ color: 'var(--color-light-gray)' }}>Đang tải danh sách chi nhánh...</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên chi nhánh</th>
                <th>Địa chỉ</th>
                <th>Hotline</th>
                <th>Đặt cọc / Hết hạn</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map(b => (
                <tr key={b._id}>
                  <td>
                    <span className="admin-badge admin-badge-role">{b.code}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '15px' }}>{b.name}</strong>
                  </td>
                  <td>{b.location || <span style={{ color: 'var(--color-pale-gray)' }}>Chưa cập nhật</span>}</td>
                  <td>{b.hotline || <span style={{ color: 'var(--color-pale-gray)' }}>Chưa cập nhật</span>}</td>
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      Cọc: <strong>{b.depositRate ? Math.round(b.depositRate * 100) : 30}%</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-light-gray)' }}>
                      Giữ phòng: {b.pendingTimeoutMinutes || 15} phút
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${b.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                      {b.isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Link 
                        to={`/admin/branches/${b._id}/staff`}
                        className="admin-btn admin-btn-secondary"
                        style={{ height: '32px', padding: '0 12px', fontSize: '12.5px' }}
                      >
                        Chi tiết
                      </Link>
                      <button 
                        className="admin-btn admin-btn-secondary"
                        style={{ height: '32px', padding: '0 12px', fontSize: '12.5px' }}
                        onClick={() => handleEditClick(b)}
                      >
                        Sửa
                      </button>
                      <button 
                        className={`admin-btn ${b.isActive ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                        style={{ height: '32px', padding: '0 12px', fontSize: '12.5px' }}
                        onClick={() => handleToggle(b._id, b.name, b.isActive)}
                      >
                        {b.isActive ? 'Khóa' : 'Mở'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBranches.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-light-gray)' }}>
                    Không tìm thấy chi nhánh nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editMode ? 'Cập Nhật Chi Nhánh' : 'Thêm Chi Nhánh Mới'}</h3>
              <span className="admin-modal-close" onClick={handleCloseModal}>&times;</span>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="admin-modal-body">
                <div className={`admin-form-group ${formErrors.code ? 'has-error' : ''}`}>
                  <label>Mã chi nhánh (ví dụ: HN01, DN02):</label>
                  <input 
                    type="text"
                    value={formData.code} 
                    onChange={e => {
                      setFormData({...formData, code: e.target.value.toUpperCase()})
                      if (formErrors.code) setFormErrors(prev => ({...prev, code: ''}))
                    }} 
                  />
                  {formErrors.code && <span className="admin-form-error">{formErrors.code}</span>}
                </div>
                <div className={`admin-form-group ${formErrors.name ? 'has-error' : ''}`}>
                  <label>Tên chi nhánh:</label>
                  <input 
                    type="text"
                    value={formData.name} 
                    onChange={e => {
                      setFormData({...formData, name: e.target.value})
                      if (formErrors.name) setFormErrors(prev => ({...prev, name: ''}))
                    }} 
                  />
                  {formErrors.name && <span className="admin-form-error">{formErrors.name}</span>}
                </div>
                <div className="admin-form-group">
                  <label>Địa chỉ:</label>
                  <input 
                    type="text"
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                  />
                </div>
                <div className={`admin-form-group ${formErrors.hotline ? 'has-error' : ''}`}>
                  <label>Hotline:</label>
                  <input 
                    type="text"
                    value={formData.hotline} 
                    onChange={e => {
                      setFormData({...formData, hotline: e.target.value})
                      if (formErrors.hotline) setFormErrors(prev => ({...prev, hotline: ''}))
                    }} 
                    placeholder="VD: 0912345678"
                  />
                  {formErrors.hotline && <span className="admin-form-error">{formErrors.hotline}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className={`admin-form-group ${formErrors.depositRate ? 'has-error' : ''}`}>
                    <label>Tỷ lệ đặt cọc (%):</label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={formData.depositRate} 
                      onChange={e => {
                        setFormData({...formData, depositRate: parseInt(e.target.value) || 0})
                        if (formErrors.depositRate) setFormErrors(prev => ({...prev, depositRate: ''}))
                      }} 
                    />
                    {formErrors.depositRate && <span className="admin-form-error">{formErrors.depositRate}</span>}
                  </div>
                  <div className={`admin-form-group ${formErrors.pendingTimeoutMinutes ? 'has-error' : ''}`}>
                    <label>Thời gian giữ phòng (phút):</label>
                    <input 
                      type="number"
                      min="5"
                      max="120"
                      value={formData.pendingTimeoutMinutes} 
                      onChange={e => {
                        setFormData({...formData, pendingTimeoutMinutes: parseInt(e.target.value) || 15})
                        if (formErrors.pendingTimeoutMinutes) setFormErrors(prev => ({...prev, pendingTimeoutMinutes: ''}))
                      }} 
                    />
                    {formErrors.pendingTimeoutMinutes && <span className="admin-form-error">{formErrors.pendingTimeoutMinutes}</span>}
                  </div>
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={handleCloseModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editMode ? 'Cập nhật' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BranchManagement

