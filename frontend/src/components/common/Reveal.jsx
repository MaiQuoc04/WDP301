import { useEffect, useRef, useState } from 'react'

/*
 * Reveal — bọc bất kỳ nội dung nào để có hiệu ứng fade/slide-up khi cuộn tới.
 * Dùng IntersectionObserver, chạy 1 lần. Tôn trọng prefers-reduced-motion (xử lý ở CSS .reveal).
 *
 * Props:
 *  - as: thẻ bao ngoài (mặc định 'div')
 *  - delay: trễ (ms) trước khi hiện, để stagger nhiều phần tử
 *  - className: class thêm vào
 */
const Reveal = ({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(node)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...(rest.style || {}) }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default Reveal
