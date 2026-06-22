import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { customerService } from '../services';
import './BookingPage.css'; // Reuse CSS or create new one

const BookingCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [processingPay, setProcessingPay] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await customerService.getBookingDetail(id);
        if (res.success) {
          setBooking(res.data);
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Lỗi tải chi tiết đơn');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handlePayment = async (type) => {
    try {
      setProcessingPay(true);
      const res = await customerService.createPaymentLink(id, type);
      if (res.success) {
        setPaymentData(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo liên kết thanh toán');
    } finally {
      setProcessingPay(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải thông tin...</div>;
  if (!booking) return <div style={{ padding: '50px', textAlign: 'center' }}>Không tìm thấy đơn đặt phòng.</div>;

  return (
    <div className="bk-page" style={{ backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Xác nhận & Thanh toán</h2>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Thông tin đơn */}
          <div style={{ flex: '1 1 500px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Thông tin khách hàng</h3>
            <p><strong>Mã Booking:</strong> {booking.code}</p>
            <p><strong>Họ Tên:</strong> {booking.guestName}</p>
            <p><strong>Số Điện Thoại:</strong> {booking.guestPhone}</p>
            
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '25px', marginBottom: '15px' }}>Chi tiết lưu trú</h3>
            <p><strong>Chi nhánh:</strong> {booking.branch?.name}</p>
            <p><strong>Hạng phòng:</strong> {booking.roomType?.name}</p>
            <p><strong>Ngày nhận phòng:</strong> {new Date(booking.checkIn).toLocaleDateString('vi-VN')}</p>
            <p><strong>Ngày trả phòng:</strong> {new Date(booking.checkOut).toLocaleDateString('vi-VN')}</p>
            <p><strong>Số lượng phòng:</strong> 1 phòng</p>
            <p><strong>Số lượng khách:</strong> {booking.adults} Người lớn, {booking.children} Trẻ em</p>
            
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff9e6', borderRadius: '5px' }}>
              <p style={{ margin: 0, color: '#b8860b' }}><strong>Trạng thái:</strong> {booking.status === 'pending' ? 'Chờ thanh toán cọc' : 'Đã thanh toán'}</p>
            </div>
          </div>

          {/* Cột Thanh toán */}
          <div style={{ flex: '1 1 350px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Tổng quan chi phí</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Tiền phòng:</span>
              <span>{formatPrice(booking.roomCharge)}</span>
            </div>
            {/* Các phụ phí có thể thêm ở đây */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc', fontWeight: 'bold', fontSize: '18px' }}>
              <span>TỔNG TIỀN:</span>
              <span style={{ color: '#d2b356' }}>{formatPrice(booking.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#666' }}>
              <span>Yêu cầu thanh toán cọc:</span>
              <span>{formatPrice(booking.depositAmount)}</span>
            </div>

            {booking.status === 'pending' ? (
              <div style={{ marginTop: '30px' }}>
                {!paymentData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button 
                      onClick={() => handlePayment('deposit')} 
                      disabled={processingPay}
                      style={{ padding: '12px', border: '1px solid #d2b356', backgroundColor: '#fff', color: '#d2b356', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {processingPay ? 'Đang xử lý...' : `Thanh toán cọc (${formatPrice(booking.depositAmount)})`}
                    </button>
                    <button 
                      onClick={() => handlePayment('full')} 
                      disabled={processingPay}
                      style={{ padding: '12px', border: 'none', backgroundColor: '#d2b356', color: '#fff', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {processingPay ? 'Đang xử lý...' : `Thanh toán toàn bộ (${formatPrice(booking.totalAmount)})`}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '20px', border: '2px dashed #d2b356', padding: '20px', borderRadius: '10px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#333' }}>Quét mã QR bằng ứng dụng ngân hàng</h4>
                    {/* Placeholder for QR Code */}
                    <div style={{ width: '200px', height: '200px', backgroundColor: '#eee', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      [ MÃ QR PAYOS TẠI ĐÂY ]
                    </div>
                    <p style={{ marginTop: '15px', fontWeight: 'bold', color: '#d2b356' }}>{formatPrice(paymentData.amount)}</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{paymentData.message}</p>
                    <button 
                      onClick={() => setPaymentData(null)}
                      style={{ marginTop: '15px', padding: '8px 15px', border: 'none', backgroundColor: '#ccc', borderRadius: '5px', cursor: 'pointer' }}>
                      Huỷ thanh toán
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', backgroundColor: '#e6ffe6', color: '#008000', borderRadius: '8px', fontWeight: 'bold' }}>
                Đơn đặt phòng này đã được thanh toán/xác nhận.
              </div>
            )}
            
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BookingCheckout;
