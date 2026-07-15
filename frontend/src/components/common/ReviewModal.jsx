// Modal đánh giá CHI NHÁNH sau khi ở xong. Chi nhánh do backend suy từ lần ở —
// KHÔNG cho khách chọn, nên ở đây chỉ hiện tên để khách biết mình đang chấm nơi nào.
import { useState } from 'react'
import { customerService } from '../../services'
import { fmtDate } from '../../utils/date'
import StarRating from './StarRating'

const LABEL = { 1: 'Rất tệ', 2: 'Tệ', 3: 'Bình thường', 4: 'Tốt', 5: 'Tuyệt vời' }
const MAX = 2000

/**
 * @param {object}   stay     1 phần tử của getReviewableStays: { groupId, code, branch, checkIn, checkOut, roomCount, expiresAt }
 * @param {function} onDone   gọi sau khi gửi thành công
 */
export default function ReviewModal({ stay, onClose, onDone }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!rating) { setErr('Hãy chọn số sao trước đã'); return }
    setSending(true); setErr('')
    try {
      const res = await customerService.createReview({ groupId: stay.groupId, rating, comment: comment.trim() })
      if (res.success) onDone(res.data)
      else setErr(res.message || 'Không gửi được đánh giá')
    } catch (e) {
      // Backend là nơi quyết định hợp lệ (quá hạn, đã đánh giá, chưa trả phòng…) -> hiện đúng lời nó nói.
      setErr(e.response?.data?.message || 'Không gửi được đánh giá')
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-7 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl font-semibold text-charcoal">Đánh giá kỳ nghỉ của bạn</h3>
        <p className="mt-1 font-body text-sm text-charcoal/55">
          {stay.branch?.name || 'Chi nhánh'} · {fmtDate(stay.checkIn)} → {fmtDate(stay.checkOut)}
          {stay.roomCount > 1 && ` · ${stay.roomCount} phòng`}
        </p>

        <div className="mt-6 flex flex-col items-center gap-2 rounded-sm bg-cream py-6">
          <StarRating value={rating} onChange={setRating} size="h-9 w-9" />
          <span className="font-body text-sm font-medium text-charcoal/70">
            {rating ? LABEL[rating] : 'Chạm để chấm điểm'}
          </span>
        </div>

        <label className="mt-5 block">
          <span className="font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/55">
            Nhận xét <span className="font-normal normal-case tracking-normal">(không bắt buộc)</span>
          </span>
          <textarea rows={4} value={comment} maxLength={MAX}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Điều gì khiến bạn hài lòng, hoặc chúng tôi cần cải thiện gì?"
            className="mt-1.5 w-full resize-none rounded-sm border border-black/10 px-3.5 py-2.5 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/40" />
          <span className="mt-1 block text-right font-body text-xs text-charcoal/40">{comment.length}/{MAX}</span>
        </label>

        {err && <p className="mt-2 rounded-sm bg-red-50 px-3 py-2 font-body text-sm text-red-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} disabled={sending}
            className="rounded-sm px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-charcoal/55 transition-colors hover:text-charcoal disabled:opacity-50">
            Huỷ
          </button>
          <button onClick={submit} disabled={sending || !rating}
            className="rounded-sm bg-gold px-6 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:bg-black/15">
            {sending ? 'Đang gửi…' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  )
}
