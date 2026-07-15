// Nguồn DUY NHẤT cho định dạng ngày của cả dự án: dd/MM/yyyy, giờ HH:mm (24h).
//
// Vì sao không dùng thẳng toLocaleDateString('vi-VN'):
//   - Nó ra "3/7/2026" (KHÔNG đệm số 0) còn toLocaleString('vi-VN') ra "14:00:00 3/7/2026"
//     -> hai kiểu lệch nhau, cột ngày trong bảng so le, lại thừa giây (giờ nhận/trả luôn tròn phút).
//   - Trước đây mỗi trang tự viết một hàm fmt/fmtDT/fmtTime/formatDateTime -> 8 bản sao lệch nhau.
// Ép 2-digit + bỏ giây để mọi ngày trong hệ thống đọc giống hệt nhau.

const pad = (n) => String(n).padStart(2, '0')
const toDate = (d) => {
  if (!d) return null
  const x = d instanceof Date ? d : new Date(d)
  return Number.isNaN(x.getTime()) ? null : x
}

/** "03/07/2026" */
export const fmtDate = (d) => {
  const x = toDate(d)
  return x ? `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}` : ''
}

/** "14:30" */
export const fmtTime = (d) => {
  const x = toDate(d)
  return x ? `${pad(x.getHours())}:${pad(x.getMinutes())}` : ''
}

/** "14:30 03/07/2026" — giờ đứng trước, giống thứ tự tự nhiên của tiếng Việt */
export const fmtDateTime = (d) => {
  const x = toDate(d)
  return x ? `${fmtTime(x)} ${fmtDate(x)}` : ''
}

/** "2026-07-03" — dạng máy dùng cho <input type="date"> / query API. KHÔNG dùng để hiện cho người đọc. */
export const toISODate = (d) => {
  const x = toDate(d)
  return x ? `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}` : ''
}

/** Định dạng hiển thị của antd DatePicker — để mọi picker trong dự án giống nhau. */
export const DATE_FORMAT = 'DD/MM/YYYY'
