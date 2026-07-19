import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, InputNumber, Select, Tag, DatePicker, Popconfirm, message, Radio } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'
import { vnd, fmtDate } from '../../services'
import PageHeader from '../../components/common/PageHeader'
import dayjs from 'dayjs'

export default function RoomPricesPage() {
  const [prices, setPrices] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [formModalVisible, setFormModalVisible] = useState(false)
  const [mode, setMode] = useState('date') // 'date' | 'dayType'

  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const pricesData = await roomService.getRoomPrices()
      setPrices(pricesData)
      const roomTypesData = await roomService.getRoomTypeOptions()
      setRoomTypes(roomTypesData)
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu giá phòng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFormSubmit = async (values) => {
    try {
      const payload = {
        roomType: values.roomType,
        price: values.price,
        discount: values.discount || 0
      }

      if (mode === 'date') {
        if (!values.date) {
          message.error('Vui lòng chọn ngày cụ thể!')
          return
        }
        payload.date = values.date.format('YYYY-MM-DD')
      } else {
        payload.dayType = values.dayType
      }

      await roomService.createOrUpdateRoomPrice(payload)
      message.success('Cấu hình giá thành công')
      setFormModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi thiết lập giá động'
      })
    }
  }

  const handleDelete = async (id) => {
    try {
      await roomService.deleteRoomPrice(id)
      message.success('Đã xóa cấu hình giá động')
      loadData()
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi xóa cấu hình giá')
    }
  }

  const columns = [
    {
      title: 'Loại phòng',
      dataIndex: ['roomType', 'name'],
      key: 'roomTypeName',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: 12, color: '#888' }}>
            Giá gốc: {vnd(record.roomType?.basePrice)}
          </div>
        </div>
      )
    },
    {
      title: 'Áp dụng cho',
      key: 'applyTarget',
      render: (_, record) => {
        if (record.startDate) {
          const isOneDay = !record.endDate || dayjs(record.startDate).isSame(record.endDate, 'day')
          return (
            <Tag color="gold">
              {isOneDay
                ? `Ngày cụ thể: ${fmtDate(record.startDate)}`
                : `Khoảng ngày: ${fmtDate(record.startDate)} - ${fmtDate(record.endDate)}`}
            </Tag>
          )
        }
        const dayTypes = { weekday: 'Ngày thường (T2-T5)', weekend: 'Cuối tuần (T6-CN)', holiday: 'Ngày lễ' }
        return <Tag color="blue">{dayTypes[record.dayType] || record.dayType}</Tag>
      }
    },
    {
      title: 'Giá mới',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <strong style={{ color: 'var(--color-gold)' }}>{vnd(price)}</strong>
    },
    {
      title: 'Giảm giá (%)',
      dataIndex: 'discount',
      key: 'discount',
      render: (d) => d ? <Tag color="volcano">-{d}%</Tag> : '0%'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Xóa cấu hình giá này?"
          onConfirm={() => handleDelete(record._id)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="text" danger icon={<DeleteOutlined />}>Xóa</Button>
        </Popconfirm>
      )
    }
  ]

  return (
    <div className="mgr-page">
      <PageHeader
        title="Cấu hình giá động"
        subtitle="Cấu hình giá phòng tăng/giảm theo cuối tuần, ngày lễ hoặc ngày đặc biệt"
        count={prices.length}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setFormModalVisible(true); }}>Thiết lập giá</Button>}
      />

      <div className="mgr-card">
        <Table
          dataSource={prices}
          columns={columns}
          rowKey="_id"
          loading={loading}
        />
      </div>

      <Modal
        title="Thiết lập giá động mới"
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        onOk={() => form.submit()}
        okText="Lưu cấu hình"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ discount: 0 }}
        >
          <Form.Item
            name="roomType"
            label="Chọn loại phòng"
            rules={[{ required: true, message: 'Vui lòng chọn loại phòng!' }]}
          >
            <Select placeholder="Chọn loại phòng áp dụng...">
              {roomTypes.map(rt => (
                <Select.Option key={rt._id} value={rt._id}>
                  {rt.name} (Giá gốc: {vnd(rt.basePrice)})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Phương thức áp dụng">
            <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
              <Radio.Button value="date">Theo ngày cụ thể</Radio.Button>
              <Radio.Button value="dayType">Theo loại ngày định kỳ</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {mode === 'date' ? (
            <Form.Item
              name="date"
              label="Chọn ngày cụ thể"
              rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(current) => current && current < dayjs().startOf('day')} />
            </Form.Item>
          ) : (
            <Form.Item
              name="dayType"
              label="Chọn loại ngày"
              rules={[{ required: true, message: 'Vui lòng chọn loại ngày!' }]}
            >
              <Select>
                <Select.Option value="weekday">Ngày thường trong tuần (T2 - T5)</Select.Option>
                <Select.Option value="weekend">Cuối tuần (T6 - CN)</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="price"
            label="Giá áp dụng mới (VNĐ)"
            rules={[{ required: true, type: 'number', min: 1000, message: 'Nhập giá lớn hơn 1,000đ!' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập giá mới..."
            />
          </Form.Item>

          <Form.Item
            name="discount"
            label="Giảm giá (%)"
            rules={[{ type: 'number', min: 0, max: 99, message: 'Chiết khấu từ 0% đến 99%' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Nhập phần trăm chiết khấu nếu có..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
