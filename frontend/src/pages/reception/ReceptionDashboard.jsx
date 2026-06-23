// Owner: Quốc — Receptionist (UC-26→43). Layout + nested routes.
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import {
  BookOutlined,
  UserAddOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  TransactionOutlined,
  CoffeeOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import BookingsPage from './BookingsPage'
import BookingDetailPage from './BookingDetailPage'
import WalkInPage from './WalkInPage'
import RoomsPage from './RoomsPage'
import SchedulePage from './SchedulePage'
import ServiceBoardPage from './ServiceBoardPage'
import TransactionsPage from './TransactionsPage'
import './reception.css'

export default function ReceptionDashboard() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const user = useSelector((s) => s.auth.user)
  return (
    <div className="rc">
      <header className="rc-top">
        <b>HBMS · Lễ tân</b>
        <nav>
          <NavLink to="/reception" end><BookOutlined /> Bookings</NavLink>
          <NavLink to="/reception/walk-in"><UserAddOutlined /> Walk-in</NavLink>
          <NavLink to="/reception/rooms"><AppstoreOutlined /> Phòng</NavLink>
          <NavLink to="/reception/schedule"><CalendarOutlined /> Lịch</NavLink>
          <NavLink to="/reception/services"><CoffeeOutlined /> Dịch vụ</NavLink>
          <NavLink to="/reception/transactions"><TransactionOutlined /> Giao dịch</NavLink>
        </nav>
        <span className="rc-user">{user?.fullName || user?.email}
          <button onClick={() => { dispatch(logout()); nav('/login') }}><LogoutOutlined /> Đăng xuất</button>
        </span>
      </header>
      <main className="rc-main">
        <Routes>
          <Route index element={<BookingsPage />} />
          <Route path="walk-in" element={<WalkInPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="services" element={<ServiceBoardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
        </Routes>
      </main>
    </div>
  )
}
