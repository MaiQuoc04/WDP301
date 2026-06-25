import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Table, Tag, Button, message } from 'antd'
import { ReloadOutlined, LogoutOutlined, CheckCircleOutlined, ClockCircleOutlined, OrderedListOutlined } from '@ant-design/icons'
import { taskService } from '../../services/taskService'

const typeLabel = { inspection: 'Kiểm tra', turnover: 'Dọn (trả phòng)', mid_stay: 'Dọn (yêu cầu)' }
const typeColor = { inspection: 'purple', turnover: 'volcano', mid_stay: 'cyan' }
const statusLabel = { pending: 'Chờ làm', in_progress: 'Đang làm', urgent: 'Khẩn' }
const fmtTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-')

export default function DashboardPage() {
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await taskService.getDashboard()) }
    catch (e) { message.error(e.response?.data?.message || 'Lỗi tải dashboard') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const c = data?.counts || {}

  const checkoutCols = [
    { title: 'Phòng', render: (_, r) => <strong>{r.room?.roomNumber || '-'}</strong> },
    { title: 'Tầng', render: (_, r) => r.room?.floor ?? '-' },
    { title: 'Loại phòng', render: (_, r) => r.roomType?.name || '-' },
    { title: 'Khách', render: (_, r) => r.guestName || '-' },
    { title: 'Giờ trả dự kiến', render: (_, r) => fmtTime(r.checkOut) },
    { title: 'Trạng thái', render: (_, r) => r.status === 'checked_out' ? <Tag>Đã trả</Tag> : <Tag color="green">Đang ở</Tag> },
  ]

  // Việc của tôi theo thứ tự được giao — dòng đầu là việc PHẢI LÀM TRƯỚC
  const myCols = [
    { title: 'Thứ tự', width: 70, render: (_, r, i) => i === 0 ? <Tag color="gold">Làm trước</Tag> : <span style={{ color: '#aaa' }}>{i + 1}</span> },
    { title: 'Loại việc', render: (_, r) => <Tag color={typeColor[r.type] || 'default'}>{typeLabel[r.type] || 'Việc phòng'}</Tag> },
    { title: 'Phòng', render: (_, r) => <strong>{r.room?.roomNumber || '-'}</strong> },
    { title: 'Trạng thái', render: (_, r) => <Tag color={r.status === 'in_progress' ? 'processing' : (r.status === 'urgent' ? 'error' : 'default')}>{statusLabel[r.status] || r.status}</Tag> },
    { title: 'Giao lúc', render: (_, r) => fmtTime(r.assignedAt) },
    { title: 'Thao tác', render: (_, r) => <Button size="small" onClick={() => nav(`/housekeeping/tasks/${r._id}`)}>Chi tiết</Button> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Hôm nay</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Phòng sắp trả & việc được giao cho bạn (làm theo thứ tự)</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>Làm mới</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} md={8}><Card><Statistic title="Phòng trả hôm nay" value={c.checkoutsToday || 0} prefix={<LogoutOutlined />} /></Card></Col>
        <Col xs={12} md={8}><Card><Statistic title="Việc của tôi đang mở" value={c.myActive || 0} prefix={<OrderedListOutlined />} valueStyle={{ color: (c.myActive || 0) > 0 ? '#d97706' : undefined }} /></Card></Col>
        <Col xs={12} md={8}><Card><Statistic title="Hoàn tất hôm nay" value={c.doneToday || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#15803d' }} /></Card></Col>
      </Row>

      <Card title="Việc của tôi (làm theo thứ tự)" style={{ marginBottom: 20 }}>
        <Table
          rowKey="_id" loading={loading} dataSource={data?.myTasks || []} columns={myCols}
          pagination={false} size="small"
          locale={{ emptyText: 'Bạn chưa được giao việc nào.' }}
        />
      </Card>

      <Card title="Phòng sẽ trả hôm nay">
        <Table
          rowKey="_id" loading={loading} dataSource={data?.checkouts || []} columns={checkoutCols}
          pagination={false} size="small"
          locale={{ emptyText: 'Hôm nay không có phòng nào trả.' }}
        />
      </Card>
    </div>
  )
}
