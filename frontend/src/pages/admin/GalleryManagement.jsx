import { useState, useEffect } from 'react'
import { Upload, Button, Select, Input, Tag, Switch, Image, Row, Col, Card, Popconfirm, message, Empty, Spin } from 'antd'
import { UploadOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons'
import adminService from '../../services/adminService'

const CATEGORY_LABEL = { gallery: 'Thư viện', dining: 'Ẩm thực' }

export default function GalleryManagement() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('') // '' = tất cả

  // Form upload
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [uploadCategory, setUploadCategory] = useState('gallery')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = async (category = filter) => {
    setLoading(true)
    try {
      setImages(await adminService.getGalleryImages(category || undefined))
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi tải danh sách ảnh')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async () => {
    if (!file) return message.warning('Vui lòng chọn tệp ảnh')
    const fd = new FormData()
    fd.append('image', file)
    fd.append('category', uploadCategory)
    fd.append('caption', caption)
    setUploading(true)
    try {
      await adminService.uploadGalleryImage(fd)
      message.success('Tải ảnh lên thành công')
      setFile(null); setPreview(''); setCaption('')
      load()
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi tải ảnh lên')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await adminService.deleteGalleryImage(id)
      message.success('Đã xoá ảnh')
      setImages((prev) => prev.filter((i) => i._id !== id))
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi xoá ảnh')
    }
  }

  const handleToggle = async (img, checked) => {
    try {
      await adminService.updateGalleryImage(img._id, { status: checked ? 'active' : 'inactive' })
      setImages((prev) => prev.map((i) => (i._id === img._id ? { ...i, status: checked ? 'active' : 'inactive' } : i)))
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi cập nhật trạng thái')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Quản lý thư viện ảnh</h2>
        <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>
          Ảnh dùng chung cho trang <strong>Thư viện</strong> và <strong>Ẩm thực</strong> (không theo chi nhánh).
        </p>
      </div>

      {/* Form upload */}
      <Card title="Tải ảnh mới" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Upload
              accept="image/png,image/jpeg,image/jpg"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(f) => {
                const ok = ['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)
                if (!ok) { message.error('Chỉ chấp nhận ảnh PNG/JPG'); return Upload.LIST_IGNORE }
                if (f.size > 5 * 1024 * 1024) { message.error('Ảnh tối đa 5MB'); return Upload.LIST_IGNORE }
                setFile(f); setPreview(URL.createObjectURL(f))
                return false // không tự upload
              }}
            >
              <Button icon={<UploadOutlined />} block>{file ? 'Đổi ảnh' : 'Chọn ảnh'}</Button>
            </Upload>
            {preview && (
              <img src={preview} alt="preview" style={{ marginTop: 10, width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
            )}
          </Col>
          <Col xs={24} md={5}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#888' }}>Danh mục</label>
            <Select value={uploadCategory} onChange={setUploadCategory} style={{ width: '100%' }}>
              <Select.Option value="gallery">Thư viện</Select.Option>
              <Select.Option value="dining">Ẩm thực</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={9}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#888' }}>Chú thích (tuỳ chọn)</label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ví dụ: Sảnh khách sạn" />
          </Col>
          <Col xs={24} md={4}>
            <Button type="primary" onClick={handleUpload} loading={uploading} disabled={!file} block style={{ marginTop: 22 }}>
              Tải lên
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bộ lọc */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#888' }}>Lọc danh mục:</span>
        <Select value={filter} onChange={setFilter} style={{ width: 180 }}>
          <Select.Option value="">Tất cả</Select.Option>
          <Select.Option value="gallery">Thư viện</Select.Option>
          <Select.Option value="dining">Ẩm thực</Select.Option>
        </Select>
        <span style={{ color: '#aaa', fontSize: 13 }}>{images.length} ảnh</span>
      </div>

      {/* Lưới ảnh */}
      <Spin spinning={loading}>
        {images.length === 0 && !loading ? (
          <Empty image={<PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />} description="Chưa có ảnh nào. Hãy tải ảnh lên." />
        ) : (
          <Image.PreviewGroup>
            <Row gutter={[16, 16]}>
              {images.map((img) => (
                <Col xs={12} sm={8} md={6} lg={4} key={img._id}>
                  <Card
                    size="small"
                    cover={
                      <div style={{ height: 140, overflow: 'hidden' }}>
                        <Image src={img.imageUrl} alt={img.caption} width="100%" height={140} style={{ objectFit: 'cover' }} />
                      </div>
                    }
                    bodyStyle={{ padding: 10 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Tag color={img.category === 'dining' ? 'gold' : 'blue'}>{CATEGORY_LABEL[img.category]}</Tag>
                      <Switch size="small" checked={img.status === 'active'} onChange={(c) => handleToggle(img, c)} />
                    </div>
                    {img.caption && <div style={{ fontSize: 12, color: '#666', marginBottom: 6, minHeight: 18 }}>{img.caption}</div>}
                    <Popconfirm title="Xoá ảnh này?" okText="Xoá" cancelText="Huỷ" onConfirm={() => handleDelete(img._id)}>
                      <Button danger size="small" icon={<DeleteOutlined />} block>Xoá</Button>
                    </Popconfirm>
                  </Card>
                </Col>
              ))}
            </Row>
          </Image.PreviewGroup>
        )}
      </Spin>
    </div>
  )
}
