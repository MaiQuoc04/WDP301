import { useState, useEffect } from 'react'
import { Table, Button, Space, Select, Tag, Switch, Modal, Form, Input, message, Alert } from 'antd'
import { UserOutlined, WarningOutlined, AlertOutlined, SyncOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'
import PageHeader from '../../components/common/PageHeader'

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState([])
  const [housekeepers, setHousekeepers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  
  // Issue reporting modal
  const [issueModalVisible, setIssueModalVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      
      const tasksData = await roomService.getHousekeepingTasks(params)
      setTasks(tasksData)
      
      const hkData = await roomService.getHousekeepers()
      setHousekeepers(hkData)
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu buồng phòng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterStatus])

  // Assign staff
  const handleAssignChange = async (taskId, staffId) => {
    try {
      await roomService.assignHousekeepingTask(taskId, staffId || null)
      message.success(staffId ? 'Phân công nhân viên thành công' : 'Đã hủy phân công nhân viên')
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Phân công thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi phân công'
      })
    }
  }

  // Toggle Urgent status
  const handleUrgentToggle = async (taskId) => {
    try {
      await roomService.markHousekeepingTaskUrgent(taskId)
      message.success('Đã cập nhật trạng thái khẩn cấp của công việc')
      loadData()
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi cập nhật độ khẩn cấp')
    }
  }

  // Submit Issue Report from Task
  const handleReportIssue = async (values) => {
    try {
      await roomService.createRoomIssueFromTask(selectedTask._id, values)
      message.success('Báo cáo sự cố phòng thành công! Trạng thái phòng đã chuyển sang Bảo trì.')
      setIssueModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Báo lỗi thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi báo sự cố từ task dọn phòng'
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
      title: 'Độ khẩn cấp',
      dataIndex: 'isUrgent',
      key: 'isUrgent',
      render: (urgent, record) => (
        <Space>
          <Switch 
            checked={urgent} 
            onChange={() => handleUrgentToggle(record._id)} 
            checkedChildren={<AlertOutlined />} 
            unCheckedChildren="-" 
            disabled={['completed', 'missed'].includes(record.status)}
          />
          {urgent && <Tag color="error">Khẩn cấp</Tag>}
        </Space>
      )
    },
    {
      title: 'Nhân viên dọn dẹp',
      dataIndex: ['assignedTo', '_id'],
      key: 'assignedTo',
      render: (assignedToId, record) => {
        const isCompleted = ['completed', 'missed'].includes(record.status)
        return (
          <Select
            value={assignedToId}
            onChange={(val) => handleAssignChange(record._id, val)}
            style={{ width: 220 }}
            placeholder="Chọn nhân viên dọn..."
            allowClear
            disabled={isCompleted}
          >
            {housekeepers.map(hk => (
              <Select.Option key={hk._id} value={hk._id}>
                {hk.fullName || hk.email}
              </Select.Option>
            ))}
          </Select>
        )
      }
    },
    {
      title: 'Người phân công',
      dataIndex: ['assignedBy', 'email'],
      key: 'assignedBy',
      render: (email) => email ? <span style={{ fontSize: 13, color: '#666' }}>{email}</span> : '-'
    },
    {
      title: 'Trạng thái dọn',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = {
          pending: { color: 'default', text: 'Chờ xử lý' },
          urgent: { color: 'warning', text: 'Chờ dọn (khẩn)' },
          in_progress: { color: 'processing', text: 'Đang dọn dẹp' },
          completed: { color: 'success', text: 'Hoàn thành' },
          missed: { color: 'error', text: 'Bỏ lỡ' }
        }
        const s = config[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: 'Sự cố phát sinh',
      dataIndex: 'issueNote',
      key: 'issueNote',
      render: (note) => note ? (
        <span style={{ color: 'var(--color-error-bright)', fontSize: 13 }}>⚠️ {note}</span>
      ) : '-'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const isCompleted = ['completed', 'missed'].includes(record.status)
        return (
          <Space>
            <Button 
              type="text" 
              danger 
              icon={<WarningOutlined />} 
              onClick={() => { setSelectedTask(record); form.resetFields(); setIssueModalVisible(true); }}
              disabled={isCompleted}
            >
              Báo sự cố
            </Button>
          </Space>
        )
      }
    }
  ]

  return (
    <div className="mgr-page">
      <PageHeader
        title="Giám sát buồng phòng"
        subtitle="Điều phối công việc dọn dẹp phòng, chỉ định nhân viên và kiểm soát chất lượng"
        count={tasks.length}
      />

      {/* Bộ lọc */}
      <div className="mgr-toolbar">
        <span className="mgr-toolbar-label">Trạng thái</span>
        <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 200 }} placeholder="Lọc trạng thái">
          <Select.Option value="">Tất cả trạng thái</Select.Option>
          <Select.Option value="pending">Chờ xử lý (Pending)</Select.Option>
          <Select.Option value="in_progress">Đang dọn dẹp (In Progress)</Select.Option>
          <Select.Option value="completed">Đã hoàn thành (Completed)</Select.Option>
          <Select.Option value="missed">Bỏ lỡ (Missed)</Select.Option>
        </Select>
        <Button className="spacer" icon={<SyncOutlined />} onClick={loadData}>Làm mới</Button>
      </div>

      <div className="mgr-card">
        <Table
          dataSource={tasks}
          columns={columns}
          rowKey="_id"
          loading={loading}
        />
      </div>

      {/* REPORT ISSUE FROM TASK MODAL */}
      <Modal
        title={`Báo cáo sự cố từ task dọn dẹp phòng ${selectedTask?.room?.roomNumber}`}
        open={issueModalVisible}
        onCancel={() => setIssueModalVisible(false)}
        onOk={() => form.submit()}
        okText="Báo cáo"
        cancelText="Hủy"
        destroyOnClose
      >
        <Alert 
          message="Lưu ý" 
          description="Báo cáo sự cố sẽ tự động gán phòng này vào trạng thái Bảo trì (Maintenance) ngay khi gửi, cho đến khi sự cố được đóng/giải quyết." 
          type="warning" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleReportIssue}
          initialValues={{ severity: 'medium' }}
        >
          <Form.Item
            name="description"
            label="Mô tả chi tiết sự cố"
            rules={[{ required: true, message: 'Nhập mô tả sự cố phòng!' }]}
          >
            <Input.TextArea rows={3} placeholder="Mô tả rõ vật dụng hỏng hóc cần sửa chữa..." />
          </Form.Item>

          <Form.Item
            name="severity"
            label="Mức độ nghiêm trọng"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="low">Thấp (Có thể sửa sau, không cản trở sử dụng)</Select.Option>
              <Select.Option value="medium">Trung bình (Cần sửa sớm để đón khách)</Select.Option>
              <Select.Option value="high">Cao (Cực kỳ nghiêm trọng, hỏng toàn bộ hệ thống)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
