import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Tag, Switch, message, Divider, Checkbox, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, SettingOutlined, NumberOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'
import { vnd } from '../../services'

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState([])
  const [allAmenities, setAllAmenities] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Modal states
  const [formModalVisible, setFormModalVisible] = useState(false)
  const [amenityModalVisible, setAmenityModalVisible] = useState(false)
  const [standardModalVisible, setStandardModalVisible] = useState(false)
  const [standardRows, setStandardRows] = useState([]) // [{ amenity:{_id,name,unit}, quantity }]
  const [editingType, setEditingType] = useState(null)
  const [selectedRoomType, setSelectedRoomType] = useState(null)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState([])

  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await roomService.getRoomTypes()
      setRoomTypes(data)
      const amenitiesData = await roomService.getAmenityOptions()
      setAllAmenities(amenitiesData)
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi tải danh sách loại phòng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Create/Edit Submit
  const handleFormSubmit = async (values) => {
    try {
      if (editingType) {
        await roomService.updateRoomType(editingType._id, values)
        message.success('Cập nhật loại phòng thành công')
      } else {
        await roomService.createRoomType(values)
        message.success('Thêm loại phòng thành công')
      }
      setFormModalVisible(false)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Thất bại',
        content: err.response?.data?.message || err.message || 'Lỗi lưu thông tin'
      })
    }
  }

  // Edit Button Trigger
  const startEdit = (record) => {
    setEditingType(record)
    form.setFieldsValue({
      name: record.name,
      bedType: record.bedType,
      capacity: record.capacity,
      area: record.area,
      basePrice: record.basePrice,
      extraBedFee: record.extraBedFee || 0,
      description: record.description
    })
    setFormModalVisible(true)
  }

  // Create Button Trigger
  const startCreate = () => {
    setEditingType(null)
    form.resetFields()
    setFormModalVisible(true)
  }

  // Toggle Status
  const handleStatusChange = async (checked, record) => {
    const status = checked ? 'active' : 'inactive'
    try {
      await roomService.updateRoomTypeStatus(record._id, status)
      message.success(`Đã chuyển loại phòng sang: ${status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}`)
      loadData()
    } catch (err) {
      Modal.error({
        title: 'Không thể thay đổi trạng thái',
        content: err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái'
      })
    }
  }

  // Amenity Modal Trigger
  const startAmenitiesMapping = async (record) => {
    setSelectedRoomType(record)
    setSelectedAmenityIds([])
    try {
      const currentMapping = await roomService.getRoomTypeAmenities(record._id)
      setSelectedAmenityIds(currentMapping.map(a => a._id))
      setAmenityModalVisible(true)
    } catch (err) {
      message.error('Không thể lấy danh sách tiện nghi đã gán')
    }
  }

  // Save Amenities mapping
  const handleSaveAmenities = async () => {
    try {
      await roomService.updateRoomTypeAmenities(selectedRoomType._id, selectedAmenityIds)
      message.success('Cập nhật tiện nghi loại phòng thành công')
      setAmenityModalVisible(false)
      loadData()
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi cập nhật tiện nghi')
    }
  }

  // Standards (số lượng chuẩn) Modal Trigger
  const startStandards = async (record) => {
    setSelectedRoomType(record)
    setStandardRows([])
    try {
      const rows = await roomService.getRoomTypeStandards(record._id)
      setStandardRows(rows)
      setStandardModalVisible(true)
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể lấy số lượng chuẩn')
    }
  }

  const setStandardQty = (amenityId, qty) => {
    setStandardRows((prev) => prev.map((r) => String(r.amenity._id) === String(amenityId) ? { ...r, quantity: qty ?? 0 } : r))
  }

  // Save standards
  const handleSaveStandards = async () => {
    try {
      const payload = standardRows.map((r) => ({ amenity: r.amenity._id, quantity: r.quantity }))
      await roomService.updateRoomTypeStandards(selectedRoomType._id, payload)
      message.success('Cập nhật số lượng chuẩn thành công')
      setStandardModalVisible(false)
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi cập nhật số lượng chuẩn')
    }
  }

  const columns = [
    {
      title: 'Tên loại phòng',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Kiểu giường',
      dataIndex: 'bedType',
      key: 'bedType',
      render: (bed) => {
        const labels = { single: 'Đơn', double: 'Đôi', twin: '2 giường đơn', king: 'King' }
        return labels[bed] || bed
      }
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (cap) => `${cap} người lớn`
    },
    {
      title: 'Diện tích',
      dataIndex: 'area',
      key: 'area',
      render: (area) => area ? `${area} m²` : '-'
    },
    {
      title: 'Giá cơ bản',
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (price) => <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{vnd(price)}</span>
    },
    {
      title: 'Phụ phí giường phụ',
      dataIndex: 'extraBedFee',
      key: 'extraBedFee',
      render: (fee) => fee ? <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{vnd(fee)}/đêm</span> : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Space>
          <Switch 
            checked={status === 'active'} 
            onChange={(checked) => handleStatusChange(checked, record)} 
            size="small"
          />
          <Tag color={status === 'active' ? 'success' : 'default'}>
            {status === 'active' ? 'Hoạt động' : 'Ngưng'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => startEdit(record)}>Sửa</Button>
          <Button type="text" icon={<SettingOutlined />} onClick={() => startAmenitiesMapping(record)}>Tiện nghi</Button>
          <Button type="text" icon={<NumberOutlined />} onClick={() => startStandards(record)}>Số chuẩn</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Quản lý loại phòng</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Cấu hình danh mục loại phòng và tiện nghi đi kèm</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={startCreate}>Thêm loại phòng</Button>
      </div>

      <Table 
        dataSource={roomTypes} 
        columns={columns} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal
        title={editingType ? 'Cập nhật loại phòng' : 'Thêm loại phòng mới'}
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
          initialValues={{ capacity: 2, bedType: 'double', extraBedFee: 0 }}
        >
          <Form.Item
            name="name"
            label="Tên loại phòng"
            rules={[{ required: true, message: 'Vui lòng nhập tên loại phòng!' }]}
          >
            <Input placeholder="Ví dụ: Standard, Deluxe Ocean View..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bedType"
                label="Kiểu giường"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="single">Single (Đơn)</Select.Option>
                  <Select.Option value="double">Double (Đôi)</Select.Option>
                  <Select.Option value="twin">Twin (2 giường đơn)</Select.Option>
                  <Select.Option value="king">King (Giường lớn)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="capacity"
                label="Sức chứa (người)"
                rules={[{ required: true, type: 'number', min: 1 }]}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="area"
                label="Diện tích (m²)"
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="basePrice"
                label="Giá cơ bản (VNĐ)"
                rules={[{ required: true, type: 'number', min: 1000, message: 'Nhập giá cơ bản lớn hơn 1,000đ!' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Ví dụ: 800,000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="extraBedFee"
            label="Phụ phí giường phụ / đêm (VNĐ)"
            rules={[{ type: 'number', min: 0, message: 'Phụ phí không được âm' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Ví dụ: 300,000"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết về loại phòng..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* AMENITIES MAPPING MODAL */}
      <Modal
        title={`Gán tiện nghi cho loại phòng: ${selectedRoomType?.name}`}
        open={amenityModalVisible}
        onCancel={() => setAmenityModalVisible(false)}
        onOk={handleSaveAmenities}
        okText="Lưu gán"
        cancelText="Hủy"
        width={600}
      >
        <p style={{ color: 'var(--color-light-gray)' }}>Chọn các tiện nghi có sẵn trong phòng thuộc loại này:</p>
        <Divider style={{ margin: '12px 0' }} />
        {allAmenities.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Không có tiện nghi hoạt động nào trong chi nhánh. Hãy tạo tiện nghi trước.</p>
        ) : (
          <Checkbox.Group 
            style={{ width: '100%' }} 
            value={selectedAmenityIds}
            onChange={(checkedValues) => setSelectedAmenityIds(checkedValues)}
          >
            <Row gutter={[16, 16]}>
              {allAmenities.map(am => (
                <Col span={12} key={am._id}>
                  <Checkbox value={am._id}>{am.name}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        )}
      </Modal>

      {/* AMENITY STANDARDS (số lượng chuẩn kiểm kê) MODAL */}
      <Modal
        title={`Số lượng chuẩn — ${selectedRoomType?.name}`}
        open={standardModalVisible}
        onCancel={() => setStandardModalVisible(false)}
        onOk={handleSaveStandards}
        okText="Lưu số chuẩn"
        cancelText="Hủy"
        width={520}
      >
        <p style={{ color: 'var(--color-light-gray)' }}>
          Số lượng mỗi thiết bị phòng loại này <strong>phải có</strong>. Dùng làm mốc kiểm kê — housekeeper không sửa được.
        </p>
        <Divider style={{ margin: '12px 0' }} />
        {standardRows.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>
            Loại phòng chưa gán tiện nghi nào. Hãy bấm “Tiện nghi” để gán trước, rồi đặt số lượng chuẩn.
          </p>
        ) : (
          <Table
            rowKey={(r) => r.amenity._id}
            dataSource={standardRows}
            pagination={false}
            size="small"
            columns={[
              { title: 'Thiết bị', render: (_, r) => r.amenity.name },
              {
                title: 'Số lượng chuẩn', width: 160,
                render: (_, r) => (
                  <InputNumber min={0} value={r.quantity} onChange={(v) => setStandardQty(r.amenity._id, v)} style={{ width: 120 }} />
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  )
}
