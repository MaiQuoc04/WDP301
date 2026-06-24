import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Button, message } from 'antd'
import { ReloadOutlined, LogoutOutlined, CheckCircleOutlined, ClockCircleOutlined, InboxOutlined } from '@ant-design/icons'
import { taskService } from '../../services/taskService'
import TaskCooldown from './TaskCooldown'

const typeLabel = { inspection: 'Kiểm tra', turnover: 'Dọn (trả phòng)', mid_stay: 'Dọn (yêu cầu)' }
const typeColor = { inspection: 'purple', turnover: 'volcano', mid_stay: 'cyan' }
const fmtTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-')

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await taskService.getDashboard()) }
    catch (e) { message.error(e.response?.data?.message || 'Lỗi tải dashboard') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const claim = async (id) => {
    setClaiming(id)
    try { await taskService.claimTask(id); message.success('Đã nhận việc'); load() }
    catch (e) { message.error(e.response?.data?.message || 'Không nhận được việc'); load() }
    finally { setClaiming('') }
  }

  const c = data?.counts || {}

  const checkoutCols = [
    { title: 'Phòng', render: (_, r) => <strong>{r.room?.roomNumber || '-'}</strong> },
    { title: 'Tầng', render: (_, r) => r.room?.floor ?? '-' },
    { title: 'Loại phòng', render: (_, r) => r.roomType?.name || '-' },
    { title: 'Khách', render: (_, r) => r.guestName || '-' },
    { title: 'Giờ trả dự kiến', render: (_, r) => fmtTime(r.checkOut) },
    { title: 'Trạng thái', render: (_, r) => r.status === 'checked_out' ? <Tag>Đã trả</Tag> : <Tag color="green">Đang ở</Tag> },
  ]

  const unclaimedCols = [
    { title: 'Loại việc', render: (_, r) => <Tag color={typeColor[r.type] || 'default'}>{typeLabel[r.type] || 'Việc phòng'}</Tag> },
    { title: 'Phòng', render: (_, r) => <strong>{r.room?.roomNumber || '-'}</strong> },
    { title: 'Hạn nhận', render: (_, r) => <TaskCooldown createdAt={r.createdAt} escalatedAt={r.escalatedAt} /> },
    { title: 'Thao tác', render: (_, r) => <Button type="primary" size="small" loading={claiming === r._id} onClick={() => claim(r._id)}>Nhận</Button> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Hôm nay</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Phòng sắp trả & việc đang chờ — chủ động nhận trước khi chuyển quản lý</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>Làm mới</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}><Card><Statistic title="Phòng trả hôm nay" value={c.checkoutsToday || 0} prefix={<LogoutOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Việc đang chờ nhận" value={c.unclaimed || 0} prefix={<InboxOutlined />} valueStyle={{ color: (c.unclaimed || 0) > 0 ? '#d97706' : undefined }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Việc tôi đang làm" value={c.myActive || 0} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Hoàn tất hôm nay" value={c.doneToday || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#15803d' }} /></Card></Col>
      </Row>

      <Card title="Phòng sẽ trả hôm nay" style={{ marginBottom: 20 }}>
        <Table
          rowKey="_id" loading={loading} dataSource={data?.checkouts || []} columns={checkoutCols}
          pagination={false} size="small"
          locale={{ emptyText: 'Hôm nay không có phòng nào trả.' }}
        />
      </Card>

      <Card title="Việc đang chờ nhận">
        <Table
          rowKey="_id" loading={loading} dataSource={data?.unclaimed || []} columns={unclaimedCols}
          pagination={false} size="small"
          locale={{ emptyText: 'Không còn việc nào đang chờ nhận 🎉' }}
        />
      </Card>
    </div>
  )
}
