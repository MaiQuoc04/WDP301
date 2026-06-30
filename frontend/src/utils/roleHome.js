// Map mỗi role nhân viên tới dashboard mặc định của họ.
// Trả về null cho customer/guest -> ở lại trang công khai (/).
export const roleHome = (role) => {
  switch (role) {
    case 'receptionist': return '/reception'
    case 'housekeeper': return '/housekeeping'
    case 'branch_manager': return '/manager'
    case 'super_admin': return '/admin'
    default: return null
  }
}
