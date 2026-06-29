import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../redux/slices/authSlice';
import { authService } from '../../services/authService';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Reveal from '../../components/common/Reveal';

const inputCls = 'w-full rounded-sm border border-black/10 bg-white px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/35 focus:border-gold focus:ring-1 focus:ring-gold/40';
const labelCls = 'mb-1.5 block font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/55';

const ROLE_LABEL = {
  customer: 'Khách hàng', receptionist: 'Lễ tân', housekeeper: 'Buồng phòng',
  branch_manager: 'Quản lý chi nhánh', super_admin: 'Quản trị viên',
};

const CustomerProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const initials = user?.fullName
    ? user.fullName.trim().split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()
    : (user?.email || 'KH').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(logoutAction());
    navigate('/');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword.length < 6) return setError('Mật khẩu mới phải từ 6 ký tự');
    if (newPassword !== confirm) return setError('Mật khẩu xác nhận không khớp');
    setLoading(true);
    try {
      await authService.changePassword({ oldPassword, newPassword });
      setSuccess('Đổi mật khẩu thành công!');
      setOldPassword(''); setNewPassword(''); setConfirm('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-5 py-12 lg:py-16">
        <Reveal className="mb-10 text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Tài khoản</span>
          <h1 className="mt-3 font-display text-4xl font-medium text-charcoal md:text-5xl">Tài khoản của tôi</h1>
          <p className="mt-3 font-body text-sm text-charcoal/60">Xin chào, {user?.fullName || 'Quý khách'} 👋</p>
        </Reveal>

        <div className="grid gap-7 lg:grid-cols-[1fr_1.3fr]">
          {/* Thông tin tài khoản */}
          <Reveal as="div" className="rounded-lg border border-black/5 bg-white p-7 shadow-raised">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold text-2xl font-semibold text-white shadow-raised">{initials}</span>
              <h2 className="mt-4 font-display text-2xl font-semibold text-charcoal">{user?.fullName || 'Người dùng'}</h2>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 font-nav text-[11px] font-semibold uppercase tracking-wide text-gold">
                {ROLE_LABEL[user?.role] || user?.role}
              </span>
            </div>

            <div className="mt-7 space-y-4 border-t border-black/5 pt-6">
              <div>
                <div className="font-nav text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">Email</div>
                <div className="mt-0.5 flex items-center gap-2 font-body text-[15px] text-charcoal">
                  {user?.email}
                  {user?.isVerified
                    ? <span className="rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">Đã xác thực</span>
                    : <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">Chưa xác thực</span>}
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <button onClick={() => navigate('/customer/booking-history')} className="flex w-full items-center justify-between rounded-sm border border-gold px-5 py-3 font-nav text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-white">
                Lịch sử đặt phòng
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-sm border border-black/10 px-5 py-3 font-nav text-sm font-semibold text-charcoal/60 transition-colors hover:bg-red-50 hover:text-red-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Đăng xuất
              </button>
            </div>
          </Reveal>

          {/* Đổi mật khẩu */}
          <Reveal as="div" delay={120} className="rounded-lg border border-black/5 bg-white p-7 shadow-raised">
            <h2 className="font-display text-2xl font-semibold text-charcoal">Đổi mật khẩu</h2>
            <div className="mt-2 h-px w-16 bg-gold" />

            {error && <div className="mt-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">{error}</div>}
            {success && <div className="mt-5 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-sm text-emerald-700">{success}</div>}

            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div>
                <label className={labelCls}>Mật khẩu hiện tại *</label>
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className={inputCls} placeholder="••••••••" />
              </div>
              <div>
                <label className={labelCls}>Mật khẩu mới *</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required className={inputCls} placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div>
                <label className={labelCls}>Xác nhận mật khẩu mới *</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={inputCls} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="mt-2 rounded-sm bg-gold px-8 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover disabled:opacity-60">
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </Reveal>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CustomerProfile;
