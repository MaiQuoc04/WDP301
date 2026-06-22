import { useState, useEffect } from 'react'
import { Button, Space, Modal, Form, Input, InputNumber, Select, Tag, Popconfirm, message, Spin, Empty, Divider, Card, Badge, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFloor, setFilterFloor] = useState('')

  // Modal states
  const [formModalVisible, setFormModalVisible] = useState(false)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [editingRoom, setEditingRoom] = useState(null)

  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterType) params.roomType = filterType
      if (filterStatus) params.status = filterStatus
      if (filterFloor) params.floor = filterFloor

      const roomsData = await roomService.getRooms(params)
      setRooms(roomsData)

      // Only load room types for options if we haven't loaded them
      if (roomTypes.length === 0) {
        const typesData = await roomService.getRoomTypeOptions()
        setRoomTypes(typesData)
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tải danh sách phòng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterType, filterStatus, filterFloor])

  // Submit Add / Edit
  const handleFormSubmit = async (values) => {
    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom._id, values)
        message.success('Cập nhật thông tin phòng thành công')
      } else {
        await roomService.createRoom(values)
        message.success('Tạo phòng mới thành công')
      }
      setFormModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi lưu thông tin phòng'
      })
    }
  }

  // Soft Delete Room
  const handleDeactivate = async (id) => {
    try {
      await roomService.deactivateRoom(id)
      message.success('Đã ngưng hoạt động phòng (soft delete)')
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Không thể deactivate',
        content: err.response?.data?.message || err.message || 'Lỗi ngưng hoạt động phòng'
      })
    }
  }

  // Quick Status update
  const handleStatusChange = async (status) => {
    try {
      await roomService.updateRoomStatus(selectedRoom._id, status)
      message.success(`Đã cập nhật trạng thái phòng sang: ${status}`)
      setStatusModalVisible(false)
      loadData()
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái')
    }
  }

  // Edit Trigger
  const startEdit = (room, e) => {
    e.stopPropagation() // Chặn nổi bọt click card
    setEditingRoom(room)
    form.setFieldsValue({
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType?._id || room.roomType,
      notes: room.notes
    })
    setFormModalVisible(true)
  }

  // Create Trigger
  const startCreate = () => {
    setEditingRoom(null)
    form.resetFields()
    setFormModalVisible(true)
  }

  // Group rooms by floor
  const roomsByFloor = rooms.reduce((groups, room) => {
    const fl = room.floor || 1
    if (!groups[fl]) groups[fl] = []
    groups[fl].push(room)
    return groups
  }, {})

  // Sort floors ascending
  const sortedFloors = Object.keys(roomsByFloor).sort((a, b) => Number(a) - Number(b))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Quản lý phòng vật lý</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Quản lý danh mục phòng, sơ đồ tầng và cập nhật trạng thái phòng</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={startCreate}>Thêm phòng mới</Button>
      </div>

      {/* Filter Bar */}
      <div className="rooms-filter-bar">
        <div className="filter-group">
          <div>
            <span style={{ marginRight: 8, fontWeight: 500 }}>Loại phòng:</span>
            <Select value={filterType} onChange={setFilterType} style={{ width: 180 }} allowClear placeholder="Tất cả loại phòng">
              {roomTypes.map(t => (
                <Select.Option key={t._id} value={t._id}>{t.name}</Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <span style={{ marginRight: 8, fontWeight: 500 }}>Trạng thái:</span>
            <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 150 }} allowClear placeholder="Tất cả trạng thái">
              <Select.Option value="available">Sẵn sàng (Available)</Select.Option>
              <Select.Option value="occupied">Đang ở (Occupied)</Select.Option>
              <Select.Option value="cleaning">Đang dọn (Cleaning)</Select.Option>
              <Select.Option value="maintenance">Bảo trì (Maintenance)</Select.Option>
              <Select.Option value="locked">Khóa (Locked)</Select.Option>
            </Select>
          </div>

          <div>
            <span style={{ marginRight: 8, fontWeight: 500 }}>Tầng:</span>
            <InputNumber value={filterFloor} onChange={setFilterFloor} style={{ width: 100 }} placeholder="Tầng" min={1} />
          </div>
        </div>
        
        <Button type="text" onClick={() => { setFilterType(''); setFilterStatus(''); setFilterFloor('') }}>Làm sạch bộ lọc</Button>
      </div>

      {/* Grid Floor Visualization */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 100 }}>
          <Spin size="large" tip="Đang tải sơ đồ phòng..." />
        </div>
      ) : sortedFloors.length === 0 ? (
        <Empty description="Không tìm thấy phòng nào phù hợp với bộ lọc" />
      ) : (
        sortedFloors.map(floorNum => (
          <div key={floorNum} className="floor-section">
            <div className="floor-title">Tầng {floorNum}</div>
            <div className="rooms-grid">
              {roomsByFloor[floorNum].map(room => (
                <div 
                  key={room._id} 
                  className={`room-card-box st-${room.status}`}
                  onClick={() => { setSelectedRoom(room); setStatusModalVisible(true); }}
                >
                  <div className="room-box-header">
                    <span className="room-box-number">{room.roomNumber}</span>
                    <span className="room-box-badge">{room.status}</span>
                  </div>
                  
                  <div className="room-box-type" title={room.roomType?.name || 'Không rõ loại'}>
                    {room.roomType?.name || 'Chưa phân loại'}
                  </div>

                  {room.notes && (
                    <Tooltip title={room.notes}>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <InfoCircleOutlined style={{ fontSize: 10 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{room.notes}</span>
                      </div>
                    </Tooltip>
                  )}

                  <div className="room-box-actions">
                    <Button 
                      type="link" 
                      size="small" 
                      style={{ padding: 0, height: 'auto', fontSize: 12 }} 
                      icon={<EditOutlined />} 
                      onClick={(e) => startEdit(room, e)}
                    >
                      Sửa
                    </Button>
                    <Popconfirm
                      title="Deactivate phòng này? (Không thể khôi phục lại trực tiếp từ giao diện)"
                      onConfirm={(e) => { e.stopPropagation(); handleDeactivate(room._id); }}
                      onCancel={(e) => e.stopPropagation()}
                      okText="Đồng ý"
                      cancelText="Không"
                    >
                      <Button 
                        type="link" 
                        danger 
                        size="small" 
                        style={{ padding: 0, height: 'auto', fontSize: 12 }} 
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Xóa
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* CREATE / EDIT ROOM MODAL */}
      <Modal
        title={editingRoom ? 'Cập nhật phòng' : 'Thêm phòng mới'}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ floor: 1 }}
        >
          <Form.Item
            name="roomNumber"
            label="Số phòng"
            rules={[{ required: true, message: 'Nhập số phòng!' }]}
          >
            <Input placeholder="Ví dụ: 101, 204..." />
          </Form.Item>

          <Form.Item
            name="floor"
            label="Số tầng"
            rules={[{ required: true, message: 'Nhập số tầng!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="roomType"
            label="Loại phòng"
            rules={[{ required: true, message: 'Chọn loại phòng!' }]}
          >
            <Select placeholder="Chọn loại phòng cho phòng vật lý...">
              {roomTypes.map(t => (
                <Select.Option key={t._id} value={t._id}>{t.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú thêm"
          >
            <Input.TextArea rows={2} placeholder="Nhập ghi chú phòng (ví dụ: view hồ bơi, phòng VIP...)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* QUICK STATUS UPDATE MODAL */}
      <Modal
        title={`Cập nhật trạng thái phòng: ${selectedRoom?.roomNumber}`}
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <p style={{ color: 'var(--color-light-gray)' }}>Chọn trạng thái mới cho phòng vật lý này:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '20px 0' }}>
          <Button onClick={() => handleStatusChange('available')} type={selectedRoom?.status === 'available' ? 'primary' : 'default'} block style={{ textAlign: 'left' }}>
            🟢 Khả dụng (Available) - Sẵn sàng đón khách
          </Button>
          <Button onClick={() => handleStatusChange('occupied')} type={selectedRoom?.status === 'occupied' ? 'primary' : 'default'} block style={{ textAlign: 'left' }}>
            🔴 Đang có khách ở (Occupied)
          </Button>
          <Button onClick={() => handleStatusChange('cleaning')} type={selectedRoom?.status === 'cleaning' ? 'primary' : 'default'} block style={{ textAlign: 'left' }}>
            🟡 Đang dọn dẹp (Cleaning)
          </Button>
          <Button onClick={() => handleStatusChange('maintenance')} type={selectedRoom?.status === 'maintenance' ? 'primary' : 'default'} block style={{ textAlign: 'left' }}>
            🛠️ Đang bảo trì (Maintenance)
          </Button>
          <Button onClick={() => handleStatusChange('locked')} type={selectedRoom?.status === 'locked' ? 'primary' : 'default'} block style={{ textAlign: 'left' }}>
            🔒 Đang khóa (Locked) - Ngưng sử dụng tạm thời
          </Button>
        </div>
      </Modal>
    </div>
  )
}
