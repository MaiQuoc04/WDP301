import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Table, Tag, Button } from 'antd'
import { ReloadOutlined, LoginOutlined, LogoutOutlined, TeamOutlined, ClockCircleOutlined, HomeOutlined, DollarOutlined } from '@ant-design/icons'
import { bookingService, vnd, fmtDateTime, bookingStatusLabel } from '../../services'

const STATUS_COLOR = {
  pending: 'gold', confirmed: 'blue', checked_in: 'green',
  checked_out: 'default', completed: 'default', cancelled: 'red', no_show: 'volcano',
}

export default function ReceptionDashboardPage() {
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await bookingService.dashboard()) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const c = data?.counts || {}

  const cols = (timeField, timeLabel) => [
    { title: 'Mã', render: (_, b) => <strong>{b.code}</strong> },
    { title: 'Khách', render: (_, b) => b.customer?.fullName || b.guestName || '-' },
    { title: 'Loại phòng', render: (_, b) => b.roomType?.name || '-' },
    { title: 'Phòng', render: (_, b) => b.room?.roomNumber || <span style={{ color: '#bbb' }}>—</span> },
    { title: timeLabel, render: (_, b) => fmtDateTime(b[timeField]) },
    { title: 'Trạng thái', render: (_, b) => <Tag color={STATUS_COLOR[b.status]}>{bookingStatusLabel(b.status)}</Tag> },
    { title: '', render: (_, b) => <Button size="small" onClick={() => nav(`/reception/bookings/${b._id}`)}>Chi tiết</Button> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Tổng quan trong ngày</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Nhận/trả phòng hôm nay, tình trạng lưu trú & doanh thu</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>Làm mới</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col xs={12} md={8} lg={4}><Card><Statistic title="Nhận hôm nay" value={c.arrivalsToday || 0} prefix={<LoginOutlined />} /></Card></Col>
        <Col xs={12} md={8} lg={4}><Card><Statistic title="Trả hôm nay" value={c.departuresToday || 0} prefix={<LogoutOutlined />} /></Card></Col>
        <Col xs={12} md={8} lg={4}><Card><Statistic title="Đang lưu trú" value={c.inHouse || 0} prefix={<TeamOutlined />} valueStyle={{ color: '#15803d' }} /></Card></Col>
        <Col xs={12} md={8} lg={4}><Card><Statistic title="Chờ cọc" value={c.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: (c.pending || 0) > 0 ? '#d97706' : undefined }} /></Card></Col>
        <Col xs={12} md={8} lg={4}><Card><Statistic title="Phòng trống" value={c.roomsAvailable || 0} suffix={`/ ${c.roomsTotal || 0}`} prefix={<HomeOutlined />} /></Card></Col>
        <Col xs={12} md={8} lg={4}><Card><Statistic title="Doanh thu hôm nay" value={c.revenueToday || 0} formatter={(v) => vnd(v)} prefix={<DollarOutlined />} valueStyle={{ color: 'var(--color-gold)' }} /></Card></Col>
      </Row>

      <Card title="🛬 Nhận phòng hôm nay" style={{ marginTop: 16 }}>
        <Table rowKey="_id" loading={loading} dataSource={data?.arrivals || []} columns={cols('checkIn', 'Giờ nhận')}
          pagination={false} size="small" locale={{ emptyText: 'Hôm nay không có khách nhận phòng.' }} />
      </Card>

      <Card title="🛫 Trả phòng hôm nay" style={{ marginTop: 16 }}>
        <Table rowKey="_id" loading={loading} dataSource={data?.departures || []} columns={cols('checkOut', 'Giờ trả')}
          pagination={false} size="small" locale={{ emptyText: 'Hôm nay không có khách trả phòng.' }} />
      </Card>
    </div>
  )
}
