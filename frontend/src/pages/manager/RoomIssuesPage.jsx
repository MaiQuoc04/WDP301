import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, SyncOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'

export default function RoomIssuesPage() {
  const [issues, setIssues] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [resolveModalVisible, setResolveModalVisible] = useState(false)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  
  const [selectedIssue, setSelectedIssue] = useState(null)

  const [createForm] = Form.useForm()
  const [resolveForm] = Form.useForm()
  const [cancelForm] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterSeverity) params.severity = filterSeverity

      const data = await roomService.getRoomIssues(params)
      setIssues(data)

      const roomsData = await roomService.getRooms()
      setRooms(roomsData)
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tải danh sách sự cố')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterStatus, filterSeverity])

  // Create manual issue
  const handleCreateIssue = async (values) => {
    try {
      await roomService.createRoomIssue(values)
      message.success('Báo cáo sự cố mới thành công! Trạng thái phòng được đồng bộ.')
      setCreateModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi gửi báo cáo sự cố'
      })
    }
  }

  // Resolve issue
  const handleResolveIssue = async (values) => {
    try {
      await roomService.resolveRoomIssue(selectedIssue._id, values)
      message.success('Đã giải quyết sự cố phòng')
      setResolveModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Không thể giải quyết',
        content: err.response?.data?.message || err.message || 'Lỗi xử lý sự cố'
      })
    }
  }

  // Cancel issue
  const handleCancelIssue = async (values) => {
    try {
      await roomService.cancelRoomIssue(selectedIssue._id, values)
      message.success('Đã hủy bỏ báo cáo sự cố')
      setCancelModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Không thể hủy sự cố',
        content: err.response?.data?.message || err.message || 'Lỗi hủy sự cố'
      })
    }
  }

  const columns = [
    {
      title: 'Phòng',
      dataIndex: ['room', 'roomNumber'],
      key: 'roomNumber',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Mô tả sự cố',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      key: 'severity',
      render: (sev) => {
        const colors = { high: 'red', medium: 'orange', low: 'blue' }
        const labels = { high: 'Nghiêm trọng (High)', medium: 'Trung bình (Medium)', low: 'Thấp (Low)' }
        return <Tag color={colors[sev]}>{labels[sev] || sev}</Tag>
      }
    },
    {
      title: 'Người báo cáo',
      dataIndex: ['reporter', 'email'],
      key: 'reporter',
      render: (text) => text || 'Nhân viên dọn dẹp'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { open: 'error', resolved: 'success', cancelled: 'default' }
        const labels = { open: 'Chưa xử lý', resolved: 'Đã khắc phục', cancelled: 'Đã hủy' }
        return <Tag color={colors[status]}>{labels[status] || status}</Tag>
      }
    },
    {
      title: 'Khắc phục bởi',
      key: 'resolvedInfo',
      render: (_, record) => {
        if (record.status === 'resolved') {
          return (
            <div>
              <div style={{ fontSize: 13, fontWeight: '500' }}>{record.resolvedBy?.email}</div>
              {record.resolutionNote && (
                <div style={{ fontSize: 11, color: '#666' }}>Note: {record.resolutionNote}</div>
              )}
            </div>
          )
        }
        if (record.status === 'cancelled') {
          return (
            <div>
              <div style={{ fontSize: 13, color: '#999' }}>Đã hủy</div>
              {record.cancellationReason && (
                <div style={{ fontSize: 11, color: '#666' }}>Lý do: {record.cancellationReason}</div>
              )}
            </div>
          )
        }
        return '-'
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        if (record.status !== 'open') return '-'
        return (
          <Space>
            <Button 
              type="text" 
              icon={<CheckOutlined />} 
              style={{ color: '#2e7d32' }} 
              onClick={() => { setSelectedIssue(record); resolveForm.resetFields(); setResolveModalVisible(true); }}
            >
              Giải quyết
            </Button>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              danger 
              onClick={() => { setSelectedIssue(record); cancelForm.resetFields(); setCancelModalVisible(true); }}
            >
              Hủy
            </Button>
          </Space>
        )
      }
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Nhật ký sự cố phòng & Sửa chữa</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Ghi nhận hư hỏng, theo dõi khắc phục kỹ thuật và giải tỏa trạng thái bảo trì phòng</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateModalVisible(true); }}>Báo sự cố thủ công</Button>
      </div>

      {/* Filter Row */}
      <div className="rooms-filter-bar">
        <div className="filter-group">
          <div>
            <span style={{ marginRight: 8, fontWeight: 500 }}>Trạng thái sự cố:</span>
            <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 160 }} placeholder="Tất cả trạng thái">
              <Select.Option value="">Tất cả trạng thái</Select.Option>
              <Select.Option value="open">Chưa xử lý (Open)</Select.Option>
              <Select.Option value="resolved">Đã khắc phục (Resolved)</Select.Option>
              <Select.Option value="cancelled">Đã hủy bỏ (Cancelled)</Select.Option>
            </Select>
          </div>

          <div>
            <span style={{ marginRight: 8, fontWeight: 500 }}>Độ nghiêm trọng:</span>
            <Select value={filterSeverity} onChange={setFilterSeverity} style={{ width: 160 }} placeholder="Tất cả mức độ">
              <Select.Option value="">Tất cả mức độ</Select.Option>
              <Select.Option value="low">Thấp (Low)</Select.Option>
              <Select.Option value="medium">Trung bình (Medium)</Select.Option>
              <Select.Option value="high">Cao (High)</Select.Option>
            </Select>
          </div>
        </div>
        <Button type="primary" icon={<SyncOutlined />} onClick={loadData}>Làm mới</Button>
      </div>

      <Table 
        dataSource={issues} 
        columns={columns} 
        rowKey="_id" 
        loading={loading}
      />

      {/* CREATE MANUAL ISSUE MODAL */}
      <Modal
        title="Báo cáo sự cố phòng mới"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
        okText="Báo cáo"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateIssue}
          initialValues={{ severity: 'medium' }}
        >
          <Form.Item
            name="room"
            label="Chọn phòng vật lý xảy ra sự cố"
            rules={[{ required: true, message: 'Chọn phòng xảy ra sự cố!' }]}
          >
            <Select placeholder="Chọn phòng..." showSearch optionFilterProp="children">
              {rooms.map(r => (
                <Select.Option key={r._id} value={r._id}>Phòng {r.roomNumber} ({r.roomType?.name})</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả sự cố"
            rules={[{ required: true, message: 'Nhập mô tả sự cố phòng!' }]}
          >
            <Input.TextArea rows={3} placeholder="Ví dụ: Vòi nước bồn rửa mặt rò rỉ, điều hòa không mát..." />
          </Form.Item>

          <Form.Item
            name="severity"
            label="Mức độ nghiêm trọng"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="low">Thấp (Low)</Select.Option>
              <Select.Option value="medium">Trung bình (Medium)</Select.Option>
              <Select.Option value="high">Nghiêm trọng (High)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* RESOLVE ISSUE MODAL */}
      <Modal
        title={`Xác nhận đã khắc phục sự cố phòng ${selectedIssue?.room?.roomNumber}`}
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        onOk={() => resolveForm.submit()}
        okText="Hoàn thành khắc phục"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={resolveForm}
          layout="vertical"
          onFinish={handleResolveIssue}
        >
          <Form.Item
            name="resolutionNote"
            label="Ghi chú nội dung khắc phục (ví dụ: đã thay bóng đèn mới, nạp thêm ga...)"
            rules={[{ required: true, message: 'Nhập nội dung khắc phục sự cố!' }]}
          >
            <Input.TextArea rows={3} placeholder="Đã xử lý sự cố thế nào..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* CANCEL ISSUE MODAL */}
      <Modal
        title={`Hủy bỏ báo cáo sự cố phòng ${selectedIssue?.room?.roomNumber}`}
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        onOk={() => cancelForm.submit()}
        okText="Hủy sự cố"
        cancelText="Đóng"
        destroyOnClose
      >
        <Form
          form={cancelForm}
          layout="vertical"
          onFinish={handleCancelIssue}
        >
          <Form.Item
            name="cancellationReason"
            label="Lý do hủy bỏ báo cáo sự cố"
            rules={[{ required: true, message: 'Vui lòng nhập lý do hủy báo cáo!' }]}
          >
            <Input.TextArea rows={3} placeholder="Ví dụ: Báo nhầm phòng, sự cố khách tự bấm nhầm nút khóa..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
