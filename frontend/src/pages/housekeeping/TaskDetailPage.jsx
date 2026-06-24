import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Button, Form, Input, InputNumber, Modal, Select, Space, Spin, Table, Tag, message } from 'antd'
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

// Loại việc — quyết định có cần kiểm kê thiết bị hay không
const typeLabel = {
  inspection: 'Kiểm tra thiết bị',
  turnover: 'Dọn sau trả phòng',
  mid_stay: 'Dọn theo yêu cầu',
}
const typeColor = { inspection: 'purple', turnover: 'volcano', mid_stay: 'cyan' }

export default function TaskDetailPage() {
  const { id } = useParams()
  const [task, setTask] = useState(null)
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [issueOpen, setIssueOpen] = useState(false)
  const [issueForm] = Form.useForm()

  const loadTask = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await taskService.getTaskDetail(id)
      setTask(data)
      setReport((data.amenityReport || []).map((item) => ({
        _id: item._id,
        amenity: item.amenity,
        name: item.name,
        expected: item.expected || 0,
        actual: item.actual ?? item.expected ?? 0,
        missing: item.missing || 0,
        condition: item.condition || 'active',
        note: item.note || '',
        chargedAt: item.chargedAt,
      })))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải chi tiết task')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTask() }, [id])

  const act = async (fn, ok) => {
    try {
      setSaving(true)
      await fn()
      message.success(ok)
      await loadTask()
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Thao tác thất bại')
    } finally {
      setSaving(false)
    }
  }

  const updateReport = (index, patch) => {
    setReport((prev) => prev.map((row, i) => {
      if (i !== index) return row
      const next = { ...row, ...patch }
      if (patch.actual !== undefined || patch.expected !== undefined) {
        next.missing = Math.max(0, Number(next.expected || 0) - Number(next.actual || 0))
        if (next.missing > 0 && next.condition === 'active') next.condition = 'missing'
      }
      return next
    }))
  }

  const saveReport = () => act(
    () => taskService.saveAmenityReport(id, report),
    'Đã lưu báo cáo kiểm kê'
  )

  const submitIssue = async () => {
    const values = await issueForm.validateFields()
    await act(() => taskService.reportIssue(id, values), 'Đã báo sự cố phòng')
    issueForm.resetFields()
    setIssueOpen(false)
  }

  if (loading) return <div className="hk-center"><Spin size="large" /></div>
  if (error) return <Alert type="error" message={error} showIcon />
  if (!task) return null

  const done = ['completed', 'missed'].includes(task.status)
  const assigned = !!task.assignedTo
  const canStart = assigned && ['pending', 'urgent'].includes(task.status)
  const canEdit = assigned && !done
  // mid_stay (dọn theo yêu cầu) không kiểm kê; inspection + turnover đều có bảng số lượng.
  const needsInventory = task.type !== 'mid_stay'
  const isTurnover = task.type === 'turnover'

  const columns = [
    { title: 'Thiết bị', dataIndex: 'name' },
    {
      // "Cần có" = SỐ CHUẨN do manager đặt — housekeeper KHÔNG sửa được
      title: 'Cần có (chuẩn)',
      width: 110,
      render: (_, row) => <strong>{row.expected ?? 0}</strong>,
    },
    {
      title: isTurnover ? 'Hiện có (sau bổ sung)' : 'Thực tế',
      width: 150,
      render: (_, row, index) => (
        <InputNumber min={0} value={row.actual} disabled={done} onChange={(value) => updateReport(index, { actual: value || 0 })} />
      ),
    },
    {
      title: 'Thiếu',
      width: 90,
      render: (_, row) => <Tag color={row.missing > 0 ? 'red' : 'green'}>{row.missing || 0}</Tag>,
    },
    {
      title: 'Tình trạng',
      width: 150,
      render: (_, row, index) => (
        <Select
          value={row.condition}
          disabled={done}
          onChange={(condition) => updateReport(index, { condition })}
          style={{ width: 130 }}
          options={[
            { value: 'active', label: 'Tốt' },
            { value: 'broken', label: 'Hỏng' },
            { value: 'missing', label: 'Thiếu' },
          ]}
        />
      ),
    },
    {
      title: 'Ghi chú',
      render: (_, row, index) => (
        <Input value={row.note} disabled={done} onChange={(e) => updateReport(index, { note: e.target.value })} />
      ),
    },
    // Cột Bill chỉ có nghĩa với inspection (cộng phụ phí cho khách); turnover không cộng bill
    ...(isTurnover ? [] : [{
      title: 'Bill',
      width: 110,
      render: (_, row) => row.chargedAt ? <Tag color="gold">Đã cộng</Tag> : <span className="hk-muted">Chưa cộng</span>,
    }]),
  ]

  return (
    <div>
      <div className="hk-page-head">
        <div>
          <Link to="/housekeeping">← Quay lại danh sách</Link>
          <h1>Task phòng {task.room?.roomNumber}</h1>
          <p>{task.booking?.code || 'Không có booking'} · {task.booking?.guestName || 'Khách lưu trú'}</p>
        </div>
        <Space>
          <Tag color={typeColor[task.type] || 'default'}>{typeLabel[task.type] || 'Việc phòng'}</Tag>
          <Tag color={statusColor[task.status]}>{statusLabel[task.status] || task.status}</Tag>
        </Space>
      </div>

      <div className="hk-detail-grid">
        <section className="hk-panel">
          <h3>Thông tin task</h3>
          <p><b>Phòng:</b> {task.room?.roomNumber} · {task.room?.status}</p>
          <p><b>Booking:</b> {task.booking?.code || '-'}</p>
          <p><b>Khách:</b> {task.booking?.guestName || '-'} {task.booking?.guestPhone ? `· ${task.booking.guestPhone}` : ''}</p>
          <p><b>Người nhận:</b> {task.assignedTo?.email || 'Chưa ai nhận'}</p>
          {needsInventory && <p><b>Đã kiểm kê:</b> {task.amenityChecked ? 'Có' : 'Chưa'}</p>}
          {task.issueNote && <p><b>Ghi chú sự cố:</b><br />{task.issueNote}</p>}

          <Space wrap>
            {!assigned && !done && (
              <Button loading={saving} onClick={() => act(() => taskService.claimTask(id), 'Đã nhận task')}>Nhận task</Button>
            )}
            {canStart && (
              <Button type="primary" loading={saving} onClick={() => act(() => taskService.startTask(id), 'Đã bắt đầu task')}>Bắt đầu</Button>
            )}
            {canEdit && (
              <>
                <Button onClick={() => setIssueOpen(true)}>Báo sự cố</Button>
                <Button danger onClick={() => act(() => taskService.markMaintenance(id, { note: 'Housekeeper chuyển phòng sang bảo trì' }), 'Đã chuyển phòng sang bảo trì')}>
                  Mark maintenance
                </Button>
                <Button type="primary" disabled={needsInventory && !task.amenityChecked} loading={saving} onClick={() => act(() => taskService.completeTask(id), 'Đã hoàn tất task')}>
                  Hoàn tất
                </Button>
              </>
            )}
          </Space>
        </section>

        <section className="hk-panel">
          <h3>Hướng dẫn thao tác</h3>
          {task.type === 'inspection' && (
            <>
              <p className="hk-muted">Nhập số <strong>Thực tế</strong> sau khi kiểm tra phòng (“Cần có” là số chuẩn, không sửa được). Nếu thiếu, hệ thống cộng phí vào bill khi booking còn có thể chỉnh.</p>
              <p className="hk-muted">Lưu báo cáo kiểm kê rồi mới hoàn tất được. Có hỏng hóc cần quản lý xử lý thì dùng “Báo sự cố”.</p>
            </>
          )}
          {task.type === 'turnover' && (
            <p className="hk-muted">
              Dọn phòng sau khi khách trả, bổ sung đồ rồi nhập số <strong>Hiện có</strong>. Lưu rồi bấm “Hoàn tất”:
              đủ chuẩn → phòng mở bán; còn thiếu → tự động báo quản lý bổ sung (phòng tạm chưa mở bán).
            </p>
          )}
          {task.type === 'mid_stay' && (
            <p className="hk-muted">Dọn theo yêu cầu của khách (miễn phí). Dọn xong bấm “Hoàn tất” — không cần kiểm kê, phòng giữ nguyên trạng thái đang ở.</p>
          )}
        </section>
      </div>

      {needsInventory && (
        <section className="hk-panel">
          <div className="hk-panel-head">
            <h3>{isTurnover ? 'Bổ sung & số lượng hiện có' : 'Kiểm kê thiết bị'}</h3>
            <Button type="primary" disabled={done} loading={saving} onClick={saveReport}>{isTurnover ? 'Lưu số hiện có' : 'Lưu báo cáo'}</Button>
          </div>
          <Table
            rowKey={(row) => row._id || row.amenity}
            dataSource={report}
            columns={columns}
            pagination={false}
            locale={{ emptyText: 'Loại phòng chưa cấu hình thiết bị chuẩn. Bạn vẫn có thể lưu rỗng để hoàn tất task.' }}
          />
        </section>
      )}

      <Modal
        title="Báo sự cố phòng"
        open={issueOpen}
        onCancel={() => setIssueOpen(false)}
        onOk={submitIssue}
        okText="Gửi báo cáo"
        cancelText="Hủy"
      >
        <Form form={issueForm} layout="vertical" initialValues={{ severity: 'medium' }}>
          <Form.Item name="description" label="Mô tả sự cố" rules={[{ required: true, message: 'Vui lòng nhập mô tả sự cố' }]}>
            <Input.TextArea rows={4} placeholder="Ví dụ: Điều hòa rò nước, đèn phòng tắm không sáng..." />
          </Form.Item>
          <Form.Item name="severity" label="Mức độ">
            <Select
              options={[
                { value: 'low', label: 'Thấp' },
                { value: 'medium', label: 'Trung bình' },
                { value: 'high', label: 'Cao' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
