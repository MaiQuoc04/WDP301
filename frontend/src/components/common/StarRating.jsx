// Chấm sao — dùng cho cả NHẬP (có onChange) lẫn HIỂN THỊ (không onChange).
// Tailwind để khớp các trang khách; không dùng antd Rate vì các trang này không theo tông antd.
import { useState } from 'react'

const Star = ({ filled, className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"
    className={`h-full w-full ${filled ? 'fill-gold' : 'fill-black/10'} ${className}`}>
    <path d="M12 2.5l2.9 5.9 6.6.95-4.75 4.63 1.12 6.52L12 17.4l-5.87 3.1 1.12-6.52L2.5 9.35l6.6-.95L12 2.5z" />
  </svg>
)

/**
 * @param {number}   value    số sao hiện tại (0-5)
 * @param {function} onChange có thì thành ô NHẬP, không có thì chỉ hiển thị
 * @param {string}   size     lớp tailwind cho 1 ngôi sao (vd 'h-8 w-8')
 */
export default function StarRating({ value = 0, onChange, size = 'h-6 w-6', showEmpty = true }) {
  const [hover, setHover] = useState(0)
  const readOnly = typeof onChange !== 'function'
  const shown = hover || value

  if (readOnly && !value && !showEmpty) return null

  return (
    <div className="inline-flex items-center gap-1" role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `${value} trên 5 sao` : 'Chấm điểm'}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= shown
        if (readOnly) return <span key={n} className={size}><Star filled={filled} /></span>
        return (
          <button key={n} type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} sao`}
            aria-pressed={value === n}
            className={`${size} cursor-pointer transition-transform hover:scale-110`}>
            <Star filled={filled} />
          </button>
        )
      })}
    </div>
  )
}
