import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'
import { vnd } from '../../services'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [formModalVisible, setFormModalVisible] = useState(false)
  const [editingService, setEditingService] = useState(null)

  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await roomService.getServices()
      setServices(data)
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tải danh sách dịch vụ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFormSubmit = async (values) => {
    try {
      if (editingService) {
        await roomService.updateService(editingService._id, values)
        message.success('Cập nhật dịch vụ thành công')
      } else {
        await roomService.createService(values)
        message.success('Thêm dịch vụ mới thành công')
      }
      setFormModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi lưu thông tin dịch vụ'
      })
    }
  }

  const handleDeactivate = async (id) => {
    try {
      await roomService.deactivateService(id)
      message.success('Đã ngưng hoạt động dịch vụ thành công')
      loadData()
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi ngưng hoạt động dịch vụ')
    }
  }

  const startEdit = (record) => {
    setEditingService(record)
    form.setFieldsValue({
      name: record.name,
      price: record.price,
      description: record.description
    })
    setFormModalVisible(true)
  }

  const startCreate = () => {
    setEditingService(null)
    form.resetFields()
    setFormModalVisible(true)
  }

  const columns = [
    {
      title: 'Tên dịch vụ',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Giá dịch vụ',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <strong style={{ color: 'var(--color-gold)' }}>{vnd(price)}</strong>
    },
    {
      title: 'Mô tả dịch vụ',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'Đang hoạt động' : 'Ngưng phục vụ'}
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
              title="Ngưng phục vụ dịch vụ này? Dịch vụ sẽ không hiển thị khi lễ tân chọn thêm dịch vụ cho khách."
              onConfirm={() => handleDeactivate(record._id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button type="text" danger icon={<DeleteOutlined />}>Ngưng phục vụ</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Quản lý dịch vụ khách sạn (Service)</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Cung cấp các dịch vụ gia tăng như giặt là, spa, ẩm thực ăn uống...</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={startCreate}>Thêm dịch vụ</Button>
      </div>

      <Table 
        dataSource={services} 
        columns={columns} 
        rowKey="_id" 
        loading={loading}
      />

      <Modal
        title={editingService ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
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
          initialValues={{ price: 50000 }}
        >
          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[{ required: true, message: 'Nhập tên dịch vụ!' }]}
          >
            <Input placeholder="Ví dụ: Giặt là ủi, Ăn sáng buffet tại phòng..." />
          </Form.Item>

          <Form.Item
            name="price"
            label="Đơn giá (VNĐ)"
            rules={[{ required: true, type: 'number', min: 1000, message: 'Nhập đơn giá dịch vụ lớn hơn 1,000đ!' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập giá tiền dịch vụ..."
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả dịch vụ"
          >
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết nội dung dịch vụ..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
