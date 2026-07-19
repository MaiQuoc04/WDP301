// Header trang con back-office (Manager/Admin/HK): tiêu đề serif + phụ đề + chip đếm + hành động phải.
// Bọc trang bằng class .mgr-page để nhận token cream/gold. Xem bộ .mgr-* trong manager.css.
export default function PageHeader({ title, subtitle, count, actions }) {
  return (
    <div className="mgr-head">
      <div className="mgr-head-titles">
        <h2>
          {title}
          {count != null && <span className="mgr-count">{count}</span>}
        </h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="mgr-head-actions">{actions}</div>}
    </div>
  )
}
