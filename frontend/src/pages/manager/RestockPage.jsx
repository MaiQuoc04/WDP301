import { useState, useEffect } from 'react'
import { Table, Button, Modal, InputNumber, Tag, message } from 'antd'
import { ReloadOutlined, InboxOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'

// Bổ sung thiết bị cho phòng đã dọn xong nhưng còn thiếu (awaitingRestock). Đủ chuẩn -> phòng mở bán.
export default function RestockPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [inv, setInv] = useState(null) // { room, items:[{amenity,name,unit,standard,current}] }
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setRooms(await roomService.getRestockRooms()) }
    catch (e) { message.error(e.response?.data?.message || 'Lỗi tải danh sách') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openRoom = async (room) => {
    try { setInv(await roomService.getRoomInventory(room._id)); setOpen(true) }
    catch (e) { message.error(e.response?.data?.message || 'Lỗi tải tồn kho phòng') }
  }

  const setQty = (amenityId, v) =>
    setInv((s) => ({ ...s, items: s.items.map((it) => it.amenity === amenityId ? { ...it, current: v ?? 0 } : it) }))
  const fillAll = () =>
    setInv((s) => ({ ...s, items: s.items.map((it) => ({ ...it, current: it.standard })) }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await roomService.updateRoomInventory(inv.room._id, inv.items.map((it) => ({ amenity: it.amenity, quantity: it.current })))
      message.success(res.room.status === 'available' ? 'Đã bổ sung đủ — phòng sẵn sàng bán' : 'Đã cập nhật số lượng')
      setOpen(false)
      load()
    } catch (e) { message.error(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSaving(false) }
  }

  const columns = [
    { title: 'Phòng', render: (_, r) => <strong>{r.roomNumber}</strong> },
    { title: 'Tầng', render: (_, r) => r.floor ?? '-' },
    { title: 'Loại phòng', render: (_, r) => r.roomType?.name || '-' },
    { title: 'Trạng thái', render: () => <Tag color="orange">Chờ bổ sung</Tag> },
    { title: 'Thao tác', render: (_, r) => <Button type="primary" icon={<InboxOutlined />} onClick={() => openRoom(r)}>Bổ sung</Button> },
  ]

  const invColumns = [
    { title: 'Thiết bị', dataIndex: 'name' },
    { title: 'Chuẩn', dataIndex: 'standard', width: 80 },
    { title: 'Hiện có', width: 140, render: (_, it) => <InputNumber min={0} value={it.current} onChange={(v) => setQty(it.amenity, v)} style={{ width: 110 }} /> },
    { title: 'Thiếu', width: 80, render: (_, it) => { const m = Math.max(0, it.standard - it.current); return <Tag color={m > 0 ? 'red' : 'green'}>{m}</Tag> } },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Bổ sung thiết bị</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Phòng đã dọn xong nhưng còn thiếu đồ — bổ sung đủ chuẩn để mở bán lại</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>Làm mới</Button>
      </div>

      <Table
        rowKey="_id"
        loading={loading}
        dataSource={rooms}
        columns={columns}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Không có phòng nào chờ bổ sung 🎉' }}
      />

      <Modal
        title={`Bổ sung thiết bị — Phòng ${inv?.room?.roomNumber || ''}`}
        open={open}
        onCancel={() => setOpen(false)}
        width={560}
        footer={[
          <Button key="fill" onClick={fillAll}>Đặt tất cả = chuẩn</Button>,
          <Button key="cancel" onClick={() => setOpen(false)}>Hủy</Button>,
          <Button key="save" type="primary" loading={saving} onClick={save}>Lưu</Button>,
        ]}
      >
        <Table rowKey="amenity" dataSource={inv?.items || []} columns={invColumns} pagination={false} size="small" />
      </Modal>
    </div>
  )
}
