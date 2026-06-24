import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Select, Space, Table, Tag, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { taskService } from '../../services/taskService'

const statusColor = {
  pending: 'default',
  in_progress: 'processing',
  urgent: 'error',
  completed: 'success',
  missed: 'warning',
}

const statusLabel = {
  pending: 'Chờ nhận',
  in_progress: 'Đang làm',
  urgent: 'Khẩn cấp',
  completed: 'Hoàn tất',
  missed: 'Missed',
}

const typeLabel = { inspection: 'Kiểm tra', turnover: 'Dọn (trả phòng)', mid_stay: 'Dọn (yêu cầu)' }
const typeColor = { inspection: 'purple', turnover: 'volcano', mid_stay: 'cyan' }

const formatDateTime = (date) => date ? new Date(date).toLocaleString('vi-VN') : '-'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', assigned: '' })

  const loadTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        status: filters.status || undefined,
        assigned: filters.assigned || undefined,
      }
      setTasks(await taskService.listTasks(params))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải task')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTasks() }, [filters.status, filters.assigned])

  const quickAction = async (task, action) => {
    try {
      if (action === 'claim') await taskService.claimTask(task._id)
      if (action === 'start') await taskService.startTask(task._id)
      message.success('Cập nhật task thành công')
      loadTasks()
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Thao tác thất bại')
    }
  }

  const columns = [
    {
      title: 'Phòng',
      key: 'room',
      render: (_, task) => (
        <div>
          <strong>{task.room?.roomNumber || '-'}</strong>
          <div className="hk-muted">Tầng {task.room?.floor || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Booking',
      key: 'booking',
      render: (_, task) => (
        <div>
          <strong>{task.booking?.code || '-'}</strong>
          <div className="hk-muted">{task.booking?.guestName || 'Khách lưu trú'}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status, task) => (
        <Space wrap>
          <Tag color={typeColor[task.type] || 'default'}>{typeLabel[task.type] || 'Việc phòng'}</Tag>
          <Tag color={statusColor[status]}>{statusLabel[status] || status}</Tag>
          {task.isUrgent && status !== 'urgent' && <Tag color="red">Ưu tiên</Tag>}
        </Space>
      ),
    },
    {
      title: 'Người nhận',
      key: 'assignedTo',
      render: (_, task) => task.assignedTo?.email || <span className="hk-muted">Chưa ai nhận</span>,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      render: (date) => formatDateTime(date),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, task) => (
        <Space>
          {!task.assignedTo && (
            <Button size="small" onClick={() => quickAction(task, 'claim')}>Nhận</Button>
          )}
          {task.assignedTo && ['pending', 'urgent'].includes(task.status) && (
            <Button size="small" type="primary" onClick={() => quickAction(task, 'start')}>Bắt đầu</Button>
          )}
          <Link to={`/housekeeping/tasks/${task._id}`}>Chi tiết</Link>
        </Space>
      ),
    },
  ]

  columns.splice(2, 0, {
    title: 'Ngày trả phòng',
    key: 'checkOut',
    render: (_, task) => formatDateTime(task.booking?.checkOut),
  })

  return (
    <div>
      <div className="hk-page-head">
        <div>
          <h1>Task buồng phòng</h1>
          <p>Theo dõi task chưa nhận, đang làm và task khẩn cấp trong chi nhánh của bạn.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadTasks}>Làm mới</Button>
      </div>

      <div className="hk-toolbar">
        <Select
          value={filters.status}
          onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
          style={{ width: 180 }}
          options={[
            { value: '', label: 'Task đang mở' },
            { value: 'pending', label: 'Chờ nhận' },
            { value: 'in_progress', label: 'Đang làm' },
            { value: 'urgent', label: 'Khẩn cấp' },
          ]}
        />
        <Select
          value={filters.assigned}
          onChange={(assigned) => setFilters((prev) => ({ ...prev, assigned }))}
          style={{ width: 180 }}
          options={[
            { value: '', label: 'Tất cả của tôi/ trống' },
            { value: 'unassigned', label: 'Chưa ai nhận' },
            { value: 'mine', label: 'Đã giao cho tôi' },
          ]}
        />
      </div>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Table rowKey="_id" loading={loading} dataSource={tasks} columns={columns} scroll={{ x: true }} />
    </div>
  )
}
