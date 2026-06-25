import { useState, useEffect } from 'react'
import { Table, Select, Alert, Tag, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { roomService } from '../../services/roomService'

// Branch manager phân tầng phụ trách cho từng housekeeper — lễ tân giao việc theo tầng.
export default function HousekeeperFloorsPage() {
  const [rows, setRows] = useState([])
  const [floorOptions, setFloorOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [hk, rooms] = await Promise.all([roomService.getHousekeeperFloors(), roomService.getRooms()])
      setRows(hk)
      const floors = [...new Set((rooms || []).map((r) => r.floor).filter((f) => f != null))].sort((a, b) => a - b)
      setFloorOptions(floors)
    } catch (e) { message.error(e.response?.data?.message || 'Lỗi tải danh sách') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async (accountId, floors) => {
    setSavingId(String(accountId))
    try {
      await roomService.setHousekeeperFloors(accountId, floors)
      message.success('Đã cập nhật tầng phụ trách')
      load()
    } catch (e) { message.error(e.response?.data?.message || 'Lỗi lưu') }
    finally { setSavingId('') }
  }

  const unset = rows.filter((r) => !r.floors || r.floors.length === 0)

  const columns = [
    {
      title: 'Nhân viên',
      render: (_, r) => (
        <div>
          <strong>{r.account.fullName || r.account.email}</strong>
          <div style={{ color: '#999', fontSize: 12 }}>{r.account.email}</div>
        </div>
      ),
    },
    {
      title: 'Tầng phụ trách',
      render: (_, r) => (
        <Select
          mode="multiple" allowClear style={{ minWidth: 300 }} placeholder="Chọn tầng phụ trách..."
          value={r.floors} loading={savingId === String(r.account._id)}
          onChange={(v) => save(r.account._id, v)}
          options={floorOptions.map((f) => ({ value: f, label: `Tầng ${f}` }))}
        />
      ),
    },
    {
      title: 'Trạng thái', width: 130,
      render: (_, r) => (r.floors && r.floors.length) ? <Tag color="success">Đã phân</Tag> : <Tag color="warning">Chưa phân</Tag>,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Phân tầng buồng phòng</h2>
          <p style={{ color: 'var(--color-light-gray)', margin: 0 }}>Gán tầng phụ trách cho từng housekeeper — lễ tân giao việc ưu tiên theo tầng</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>Làm mới</Button>
      </div>

      {unset.length > 0 && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 16 }}
          message={`Có ${unset.length} nhân viên chưa được phân tầng`}
          description="Nhân viên chưa phân tầng sẽ bị xếp cuối khi lễ tân giao việc. Hãy gán tầng cho họ."
        />
      )}

      <Table rowKey={(r) => r.account._id} loading={loading} dataSource={rows} columns={columns} pagination={false}
        locale={{ emptyText: 'Chi nhánh chưa có nhân viên buồng phòng' }} />
    </div>
  )
}
