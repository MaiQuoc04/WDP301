import { useEffect, useState } from 'react'
import { bookingService } from '../../services'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [err, setErr] = useState('')
  useEffect(() => { bookingService.listRooms().then(setRooms).catch((e) => setErr(e.response?.data?.message || 'Lỗi')) }, [])
  return (
    <div>
      <h2>Phòng</h2>
      {err && <p className="rc-err">{err}</p>}
      <div className="rc-rooms">
        {rooms.map((r) => (
          <div key={r._id} className={'rc-room st-' + r.status}>
            <b>{r.roomNumber}</b>
            <small>{r.roomType?.name}</small>
            <span>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
