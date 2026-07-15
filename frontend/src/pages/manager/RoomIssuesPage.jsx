import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, SyncOutlined, EyeOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'
import { fmtDateTime } from '../../utils/date'

const STATUS_LABEL = { open: 'Chờ duyệt', maintaining: 'Đang bảo trì', fix_requested: 'Chờ xác nhận sửa', resolved: 'Đã khắc phục', cancelled: 'Đã hủy' }
const SEV_LABEL = { high: 'Nghiêm trọng', medium: 'Trung bình', low: 'Thấp' }
const fmtDT = (d) => fmtDateTime(d) || '-'
const NoteBox = ({ children }) => (
  <div style={{ whiteSpace: 'pre-wrap', background: '#f7f7f9', border: '1px solid #eee', borderRadius: 6, padding: '8px 12px', marginTop: 4 }}>{children}</div>
)

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
  const [detailIssue, setDetailIssue] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)

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
      message.success('Đã tạo & chuyển phòng sang bảo trì')
      setCreateModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi gửi báo cáo sự cố'
      })
    }
  }

  // Approve maintenance (open -> maintaining)
  const handleApprove = async (record) => {
    try {
      await roomService.approveRoomMaintenance(record._id)
      message.success('Đã duyệt — phòng chuyển sang bảo trì')
      loadData()
    } catch (err) {
      Modal.error({ title: 'Không thể duyệt', content: err.response?.data?.message || err.message || 'Lỗi duyệt bảo trì' })
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
      key: 'description',
      render: (t) => <span style={{ display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }} title={t}>{t}</span>
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
        const colors = { open: 'gold', maintaining: 'processing', fix_requested: 'warning', resolved: 'success', cancelled: 'default' }
        const labels = { open: 'Chờ duyệt', maintaining: 'Đang bảo trì', fix_requested: 'Chờ xác nhận sửa', resolved: 'Đã khắc phục', cancelled: 'Đã hủy' }
        return <Tag color={colors[status]}>{labels[status] || status}</Tag>
      }
    },
    {
      title: 'Người sửa',
      key: 'fixedBy',
      render: (_, r) => r.fixRequestedBy?.email || <span style={{ color: '#bbb' }}>—</span>
    },
    {
      title: 'Người xác nhận',
      key: 'confirmedBy',
      render: (_, r) => {
        if (r.status === 'resolved') return r.resolvedBy?.email || '-'
        if (r.status === 'cancelled') return <span style={{ color: '#999' }}>{r.cancelledBy?.email || 'Đã hủy'}</span>
        return <span style={{ color: '#bbb' }}>—</span>
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const s = record.status
        return (
          <Space>
            <Button type="text" icon={<EyeOutlined />} onClick={() => { setDetailIssue(record); setDetailVisible(true) }}>Chi tiết</Button>
            {s === 'open' && (
              <Button type="text" icon={<CheckOutlined />} style={{ color: '#1677ff' }} onClick={() => handleApprove(record)}>
                Duyệt bảo trì
              </Button>
            )}
            {['maintaining', 'fix_requested'].includes(s) && (
              <Button type="text" icon={<CheckOutlined />} style={{ color: '#2e7d32' }}
                onClick={() => { setSelectedIssue(record); resolveForm.resetFields(); setResolveModalVisible(true) }}>
                Xác nhận đã sửa
              </Button>
            )}
            {!['resolved', 'cancelled'].includes(s) && (
              <Button type="text" icon={<CloseOutlined />} danger
                onClick={() => { setSelectedIssue(record); cancelForm.resetFields(); setCancelModalVisible(true) }}>
                {s === 'open' ? 'Từ chối' : 'Hủy'}
              </Button>
            )}
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
              <Select.Option value="open">Chờ duyệt</Select.Option>
              <Select.Option value="maintaining">Đang bảo trì</Select.Option>
              <Select.Option value="fix_requested">Chờ xác nhận sửa</Select.Option>
              <Select.Option value="resolved">Đã khắc phục</Select.Option>
              <Select.Option value="cancelled">Đã hủy bỏ</Select.Option>
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

      {/* DETAIL MODAL — xem đầy đủ note (mô tả dài / ghi chú xác nhận / lý do hủy) */}
      <Modal
        title={`Chi tiết sự cố — Phòng ${detailIssue?.room?.roomNumber || ''}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>Đóng</Button>]}
        width={560}
      >
        {detailIssue && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0 }}><b>Trạng thái:</b> {STATUS_LABEL[detailIssue.status] || detailIssue.status} · <b>Mức độ:</b> {SEV_LABEL[detailIssue.severity] || detailIssue.severity}</p>
            <p style={{ margin: 0 }}><b>HK báo cần bảo trì:</b> {detailIssue.reporter?.email || '-'} · {fmtDT(detailIssue.createdAt)}</p>
            <div><b>Mô tả sự cố:</b><NoteBox>{detailIssue.description}</NoteBox></div>
            {detailIssue.approvedAt && <p style={{ margin: 0 }}><b>QL duyệt bảo trì:</b> {fmtDT(detailIssue.approvedAt)}</p>}
            {detailIssue.fixRequestedBy && <p style={{ margin: 0 }}><b>Người sửa (HK báo đã sửa):</b> {detailIssue.fixRequestedBy.email} · {fmtDT(detailIssue.fixRequestedAt)}</p>}
            {detailIssue.status === 'resolved' && (
              <>
                <p style={{ margin: 0 }}><b>Người xác nhận:</b> {detailIssue.resolvedBy?.email || '-'} · {fmtDT(detailIssue.resolvedAt)}</p>
                {detailIssue.resolutionNote && <div><b>Ghi chú xác nhận:</b><NoteBox>{detailIssue.resolutionNote}</NoteBox></div>}
              </>
            )}
            {detailIssue.status === 'cancelled' && (
              <>
                <p style={{ margin: 0 }}><b>Người từ chối:</b> {detailIssue.cancelledBy?.email || '-'}</p>
                {detailIssue.cancellationReason && <div><b>Lý do từ chối:</b><NoteBox>{detailIssue.cancellationReason}</NoteBox></div>}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
