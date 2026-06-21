import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import TasksPage from './TasksPage'
import TaskDetailPage from './TaskDetailPage'
import HistoryPage from './HistoryPage'
import './housekeeping.css'

export default function HousekeepingDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="hk-layout">
      <aside className="hk-sidebar">
        <div className="hk-brand">
          <b>HANOI HOTEL</b>
          <span>Housekeeping</span>
        </div>
        <nav className="hk-nav">
          <NavLink to="/housekeeping" end>Task đang mở</NavLink>
          <NavLink to="/housekeeping/history">Lịch sử</NavLink>
        </nav>
        <div className="hk-user">
          <span>{user?.fullName || user?.email || 'Housekeeper'}</span>
          <button onClick={handleLogout}>Đăng xuất</button>
        </div>
      </aside>

      <main className="hk-main">
        <Routes>
          <Route index element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  )
}
