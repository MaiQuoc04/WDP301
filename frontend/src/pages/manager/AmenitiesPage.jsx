import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'
import { vnd } from '../../services'
import PageHeader from '../../components/common/PageHeader'

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [formModalVisible, setFormModalVisible] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState(null)

  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await roomService.getAmenities()
      setAmenities(data)
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tải danh sách tiện nghi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFormSubmit = async (values) => {
    try {
      if (editingAmenity) {
        await roomService.updateAmenity(editingAmenity._id, values)
        message.success('Cập nhật tiện nghi thành công')
      } else {
        await roomService.createAmenity(values)
        message.success('Thêm tiện nghi mới thành công')
      }
      setFormModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi lưu tiện nghi'
      })
    }
  }

  const handleDeactivate = async (id) => {
    try {
      await roomService.deactivateAmenity(id)
      message.success('Đã ngưng hoạt động tiện nghi và tự động gỡ khỏi mọi phòng')
      loadData()
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi ngưng hoạt động tiện nghi')
    }
  }

  const startEdit = (record) => {
    setEditingAmenity(record)
    form.setFieldsValue({
      name: record.name,
      missingPrice: record.missingPrice,
      unit: record.unit
    })
    setFormModalVisible(true)
  }

  const startCreate = () => {
    setEditingAmenity(null)
    form.resetFields()
    setFormModalVisible(true)
  }

  const columns = [
    {
      title: 'Tên tiện nghi',
      dataIndex: 'name',
      key: 'name',
      render: (text, r) => (
        <div className="mgr-cell-name">
          <span className="mgr-row-ic"><InboxOutlined /></span>
          <div>
            <b>{text}</b>
            <div className="mgr-cell-sub">Đơn vị: {r.unit || 'cái'}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Đơn vị tính',
      dataIndex: 'unit',
      key: 'unit',
      render: (text) => text || 'cái'
    },
    {
      title: 'Giá phạt đền bù (khi mất mát)',
      dataIndex: 'missingPrice',
      key: 'missingPrice',
      render: (price) => price > 0 ? (
        <span style={{ color: 'var(--color-error-bright)', fontWeight: '500' }}>{vnd(price)}</span>
      ) : (
        <Tag color="success">Không tính phí đền</Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => startEdit(record)}>Sửa</Button>
          {record.status === 'active' && (
            <Popconfirm
              title="Ngưng hoạt động tiện nghi này? Tiện nghi sẽ tự động bị gỡ khỏi toàn bộ RoomType & phòng vật lý đang gán."
              onConfirm={() => handleDeactivate(record._id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button type="text" danger icon={<DeleteOutlined />}>Ngưng hoạt động</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="mgr-page">
      <PageHeader
        title="Quản lý tiện nghi phòng"
        subtitle="Danh mục vật dụng trang bị trong phòng và giá đền bù khi làm mất"
        count={amenities.length}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={startCreate}>Thêm tiện nghi</Button>}
      />

      <div className="mgr-toolbar">
        <Input className="mgr-search" allowClear prefix={<SearchOutlined />}
          placeholder="Tìm tiện nghi theo tên..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mgr-card">
        <Table
          dataSource={amenities.filter((a) => (a.name || '').toLowerCase().includes(q.trim().toLowerCase()))}
          columns={columns}
          rowKey="_id"
          loading={loading}
        />
      </div>

      <Modal
        title={editingAmenity ? 'Cập nhật tiện nghi' : 'Thêm tiện nghi mới'}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ missingPrice: 0, unit: 'cái' }}
        >
          <Form.Item
            name="name"
            label="Tên tiện nghi"
            rules={[{ required: true, message: 'Nhập tên tiện nghi!' }]}
          >
            <Input placeholder="Ví dụ: Máy sấy tóc, Áo choàng tắm, Dép lê..." />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Đơn vị tính"
            rules={[{ required: true, message: 'Nhập đơn vị tính!' }]}
          >
            <Input placeholder="Ví dụ: cái, bộ, chiếc..." />
          </Form.Item>

          <Form.Item
            name="missingPrice"
            label="Giá trị bồi thường khi mất/hỏng (VNĐ)"
            rules={[{ required: true, type: 'number', min: 0, message: 'Nhập số tiền đền bù >= 0!' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập giá phạt đền bù (0đ nếu miễn phí bồi thường)..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
