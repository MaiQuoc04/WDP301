import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Row, Col, Progress, Table, Tag, Button, Spin, Empty, Alert } from 'antd'
import { roomService } from '../../services/roomService'
import { vnd } from '../../services'
import { 
  HomeOutlined, 
  ToolOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons'

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    rooms: [],
    roomTypes: [],
    amenities: [],
    services: [],
    issues: [],
    tasks: [],
    hkFloors: []
  })

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [rooms, roomTypes, amenities, services, issues, tasks, hkFloors] = await Promise.all([
        roomService.getRooms(),
        roomService.getRoomTypes(),
        roomService.getAmenities(),
        roomService.getServices(),
        roomService.getRoomIssues(),
        roomService.getHousekeepingTasks(),
        roomService.getHousekeeperFloors().catch(() => [])
      ])
      setData({ rooms, roomTypes, amenities, services, issues, tasks, hkFloors })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu thống kê')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" tip="Đang tải dữ liệu tổng quan..." />
      </div>
    )
  }

  const totalRooms = data.rooms.length
  const occupiedRooms = data.rooms.filter(r => r.status === 'occupied').length
  const availableRooms = data.rooms.filter(r => r.status === 'available').length
  const cleaningRooms = data.rooms.filter(r => r.status === 'cleaning').length
  const maintenanceRooms = data.rooms.filter(r => r.status === 'maintenance').length
  const lockedRooms = data.rooms.filter(r => r.status === 'locked').length

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
  const activeAmenities = data.amenities.filter(a => a.status === 'active').length
  const activeServices = data.services.filter(s => s.status === 'active').length
  const openIssues = data.issues.filter(i => i.status === 'open')
  const pendingTasks = data.tasks.filter(t => t.status === 'pending')

  const issueColumns = [
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
      title: 'Độ nghiêm trọng',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => {
        const colorMap = { high: 'error', medium: 'warning', low: 'processing' }
        const labelMap = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }
        return <Tag color={colorMap[severity]}>{labelMap[severity] || severity}</Tag>
      }
    },
    {
      title: 'Ngày báo cáo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('vi-VN')
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Xin chào Quản lý</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Tổng quan tình trạng hoạt động của chi nhánh hôm nay</p>
        </div>
        <Button type="primary" icon={<SyncOutlined />} onClick={loadData}>Làm mới</Button>
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}

      {data.hkFloors.filter((h) => !h.floors || h.floors.length === 0).length > 0 && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 24 }}
          message={`Có ${data.hkFloors.filter((h) => !h.floors || h.floors.length === 0).length} nhân viên buồng phòng chưa được phân tầng`}
          description="Lễ tân giao việc theo tầng phụ trách — hãy phân tầng để hệ thống gợi ý chính xác."
          action={<Link to="/manager/floors"><Button size="small" type="primary">Phân tầng ngay</Button></Link>}
        />
      )}

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon rooms"><HomeOutlined /></div>
          <div className="stat-info">
            <span className="stat-title">Hiệu suất phòng</span>
            <span className="stat-value">{occupancyRate}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon types"><CheckCircleOutlined /></div>
          <div className="stat-info">
            <span className="stat-title">Phòng trống sẵn sàng</span>
            <span className="stat-value">{availableRooms} / {totalRooms}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon clean"><SyncOutlined spin={pendingTasks.length > 0} /></div>
          <div className="stat-info">
            <span className="stat-title">Dọn dẹp chờ xử lý</span>
            <span className="stat-value">{pendingTasks.length} tác vụ</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon issues"><WarningOutlined /></div>
          <div className="stat-info">
            <span className="stat-title">Sự cố chưa giải quyết</span>
            <span className="stat-value">{openIssues.length} báo cáo</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdowns */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={10}>
          <Card title="Phân bổ trạng thái phòng vật lý" style={{ height: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Progress type="circle" percent={occupancyRate} strokeColor="var(--color-gold)" format={() => `${occupiedRooms} Phòng Đang ở`} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🟢 Trống sẵn sàng (Available)</span>
                <strong>{availableRooms} phòng</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🔴 Khách đang ở (Occupied)</span>
                <strong>{occupiedRooms} phòng</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🟡 Đang dọn dẹp (Cleaning)</span>
                <strong>{cleaningRooms} phòng</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🛠️ Đang bảo trì (Maintenance)</span>
                <strong>{maintenanceRooms} phòng</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🔒 Đang khóa (Locked)</span>
                <strong>{lockedRooms} phòng</strong>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title="Dữ liệu danh mục & Phân khúc" style={{ height: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card type="inner" title="Loại phòng (Room Types)">
                  <h3 style={{ fontSize: 36, margin: '12px 0 6px 0', color: 'var(--color-gold)' }}>{data.roomTypes.length}</h3>
                  <p style={{ margin: 0, color: 'var(--color-light-gray)' }}>Phân khúc loại phòng</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card type="inner" title="Tiện nghi (Amenities)">
                  <h3 style={{ fontSize: 36, margin: '12px 0 6px 0', color: 'var(--color-gold)' }}>{activeAmenities}</h3>
                  <p style={{ margin: 0, color: 'var(--color-light-gray)' }}>Tiện nghi đang hoạt động</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card type="inner" title="Dịch vụ (Services)">
                  <h3 style={{ fontSize: 36, margin: '12px 0 6px 0', color: 'var(--color-gold)' }}>{activeServices}</h3>
                  <p style={{ margin: 0, color: 'var(--color-light-gray)' }}>Dịch vụ đang phục vụ</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card type="inner" title="Tác vụ buồng phòng">
                  <h3 style={{ fontSize: 36, margin: '12px 0 6px 0', color: 'var(--color-gold)' }}>{data.tasks.length}</h3>
                  <p style={{ margin: 0, color: 'var(--color-light-gray)' }}>Tổng số tác vụ được tạo hôm nay</p>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Issues Table */}
      <Card title="Sự cố phòng cần xử lý gấp (Open Issues)">
        {openIssues.length === 0 ? (
          <Empty description="Không có sự cố nào chưa giải quyết" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table 
            dataSource={openIssues.slice(0, 5)} 
            columns={issueColumns} 
            rowKey="_id" 
            pagination={false} 
            size="middle"
          />
        )}
      </Card>
    </div>
  )
}
