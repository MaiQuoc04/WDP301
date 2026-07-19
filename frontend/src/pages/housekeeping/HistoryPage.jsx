import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Select, Table, Tag } from 'antd'
import { taskService } from '../../services/taskService'
import { fmtDateTime } from '../../utils/date'
import PageHeader from '../../components/common/PageHeader'

const statusColor = {
  completed: 'success',
  missed: 'warning',
}

const statusLabel = {
  completed: 'Hoàn tất',
  missed: 'Missed',
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadHistory = async () => {
    setLoading(true)
    setError('')
    try {
      setTasks(await taskService.getHistory({ status: status || undefined }))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải lịch sử task')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [status])

  const columns = [
    {
      title: 'Phòng',
      render: (_, task) => <strong>{task.room?.roomNumber || '-'}</strong>,
    },
    {
      title: 'Booking',
      render: (_, task) => (
        <div>
          <strong>{task.booking?.code || '-'}</strong>
          <div className="hk-muted">{task.booking?.guestName || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (value) => <Tag color={statusColor[value]}>{statusLabel[value] || value}</Tag>,
    },
    {
      title: 'Hoàn tất lúc',
      dataIndex: 'completedAt',
      render: (date, task) => fmtDateTime(date || task.updatedAt),
    },
    {
      title: 'Chi tiết',
      render: (_, task) => <Link to={`/housekeeping/tasks/${task._id}`}>Xem</Link>,
    },
  ]

  return (
    <div className="mgr-page">
      <PageHeader
        title="Lịch sử buồng phòng"
        subtitle="Các task bạn đã hoàn tất hoặc bị bỏ lỡ."
        count={tasks.length}
        actions={
          <Select
            value={status}
            onChange={setStatus}
            style={{ width: 170 }}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'completed', label: 'Hoàn tất' },
              { value: 'missed', label: 'Bỏ lỡ' },
            ]}
          />
        }
      />

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16, borderRadius: 12 }} />}
      <div className="mgr-card">
        <Table rowKey="_id" loading={loading} dataSource={tasks} columns={columns} />
      </div>
    </div>
  )
}
