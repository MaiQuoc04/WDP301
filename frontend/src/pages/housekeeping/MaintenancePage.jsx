import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { taskService } from '../../services/taskService'

const statusLabel = { maintaining: 'Đang bảo trì', fix_requested: 'Đã báo sửa — chờ xác nhận' }
const fmt = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-')

export default function MaintenancePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setRows(await taskService.listMaintenance()) }
    catch (e) { message.error(e.response?.data?.message || 'Lỗi tải danh sách') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const reportFixed = (issue) => {
    Modal.confirm({
      title: `Báo đã sửa xong phòng ${issue.room?.roomNumber || ''}?`,
      content: 'Quản lý sẽ kiểm tra và xác nhận mở lại phòng.',
      okText: 'Đã sửa xong', cancelText: 'Hủy',
      onOk: async () => {
        try { await taskService.requestFix(issue._id); message.success('Đã báo quản lý xác nhận'); load() }
        catch (e) { message.error(e.response?.data?.message || 'Lỗi') }
      },
    })
  }

  const columns = [
    { title: 'Phòng', render: (_, r) => <strong>{r.room?.roomNumber || '-'}</strong> },
    { title: 'Tầng', render: (_, r) => r.room?.floor ?? '-' },
    { title: 'Mô tả sự cố', dataIndex: 'description' },
    { title: 'Trạng thái', render: (_, r) => <Tag color={r.status === 'fix_requested' ? 'processing' : 'warning'}>{statusLabel[r.status] || r.status}</Tag> },
    { title: 'Từ lúc', render: (_, r) => fmt(r.approvedAt || r.createdAt) },
    {
      title: 'Thao tác',
      render: (_, r) => r.status === 'maintaining'
        ? <Button type="primary" size="small" onClick={() => reportFixed(r)}>Đã sửa xong</Button>
        : <span style={{ color: '#999' }}>Chờ quản lý xác nhận</span>,
    },
  ]

  return (
    <div>
      <div className="hk-page-head">
        <div>
          <h1>Phòng đang bảo trì</h1>
          <p>Bấm “Đã sửa xong” để báo quản lý kiểm tra & xác nhận mở lại phòng.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>Làm mới</Button>
      </div>
      <Table rowKey="_id" loading={loading} dataSource={rows} columns={columns}
        locale={{ emptyText: 'Không có phòng nào đang bảo trì' }} />
    </div>
  )
}
