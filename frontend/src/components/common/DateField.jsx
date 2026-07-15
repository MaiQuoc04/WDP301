// Ô chọn ngày dùng chung cho CẢ dự án.
//
// Vì sao không dùng <input type="date"> nữa: trình duyệt render nó theo locale của TRÌNH DUYỆT,
// không theo lang của trang -> máy cài tiếng Anh hiện "mm/dd/yyyy". Với khách sạn Việt thì
// 07/08 là 7/8 hay 8/7 là mơ hồ thật sự, dễ đặt nhầm ngày. lang="vi" hay CSS đều KHÔNG ép được.
//
// DatePicker của antd cho ép format cứng DD/MM/YYYY. Component này giữ nguyên API chuỗi
// ('YYYY-MM-DD' vào/ra) như native input để các call site không phải đổi state/validate.
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { DATE_FORMAT } from '../../utils/date'

/**
 * @param {string}   value     'YYYY-MM-DD' hoặc '' (giống native input)
 * @param {function} onChange  nhận lại chuỗi 'YYYY-MM-DD' hoặc ''
 * @param {string}   min       'YYYY-MM-DD' — ngày nhỏ nhất chọn được (giống thuộc tính min)
 * @param {string}   max       'YYYY-MM-DD'
 */
export default function DateField({ value, onChange, min, max, status, placeholder, className, ...rest }) {
  const disabledDate = (cur) => {
    if (!cur) return false
    if (min && cur.isBefore(dayjs(min), 'day')) return true
    if (max && cur.isAfter(dayjs(max), 'day')) return true
    return false
  }
  return (
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : '')}
      format={DATE_FORMAT}
      placeholder={placeholder || 'dd/mm/yyyy'}
      disabledDate={min || max ? disabledDate : undefined}
      status={status}
      className={className}
      style={{ width: '100%' }}
      allowClear
      {...rest}
    />
  )
}
