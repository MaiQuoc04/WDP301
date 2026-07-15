// Xem toàn bộ đánh giá của 1 CHI NHÁNH. Bố cục tham khảo bảng tổng đánh giá của Google Maps:
// điểm to bên trái + phân bố 5→1 bên phải (bấm để lọc) + danh sách bên dưới.
import { useCallback, useEffect, useState } from 'react'
import { customerService } from '../../services'
import { fmtDate } from '../../utils/date'
import StarRating from './StarRating'

const initialsOf = (name = '') => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || 'K'

export default function BranchReviewsModal({ branch, onClose }) {
  const [sum, setSum] = useState(null)      // { average, count, breakdown }
  const [star, setStar] = useState(null)    // đang lọc mức sao nào (null = tất cả)
  const [list, setList] = useState({ items: [], total: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)

  useEffect(() => {
    customerService.getBranchRating(branch._id)
      .then((r) => r.success && setSum(r.data))
      .catch(() => setSum(null))
  }, [branch._id])

  const load = useCallback(async (starFilter, skip = 0) => {
    const res = await customerService.getBranchReviews(branch._id, { star: starFilter || undefined, skip })
    if (!res.success) return
    setList((prev) => (skip === 0 ? res.data : { ...res.data, items: [...prev.items, ...res.data.items] }))
  }, [branch._id])

  useEffect(() => { setLoading(true); load(star).finally(() => setLoading(false)) }, [star, load])

  const pickStar = (n) => setStar((cur) => (cur === n ? null : n)) // bấm lại = bỏ lọc

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-7 py-5">
          <div>
            <h3 className="font-display text-2xl font-semibold text-charcoal">Đánh giá chi nhánh</h3>
            <p className="mt-0.5 font-body text-sm text-charcoal/55">{branch.name}</p>
          </div>
          <button onClick={onClose} aria-label="Đóng"
            className="shrink-0 rounded-full p-1.5 text-charcoal/40 transition-colors hover:bg-black/5 hover:text-charcoal">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          {!sum ? <p className="py-10 text-center font-body text-sm text-charcoal/45">Đang tải…</p>
            : sum.count === 0 ? (
              <div className="py-12 text-center">
                <StarRating value={0} size="h-7 w-7" />
                <p className="mt-3 font-body text-sm text-charcoal/55">Chi nhánh này chưa có đánh giá nào.</p>
                <p className="mt-1 font-body text-xs text-charcoal/40">Chỉ khách đã lưu trú mới đánh giá được.</p>
              </div>
            ) : (
              <>
                {/* ── Bảng tổng: điểm to | phân bố ── */}
                <div className="flex flex-col gap-6 rounded-sm bg-cream p-6 sm:flex-row sm:items-center">
                  <div className="shrink-0 text-center sm:w-40">
                    <div className="font-display text-6xl font-semibold leading-none text-charcoal">
                      {sum.average.toFixed(1)}
                    </div>
                    <div className="mt-2 flex justify-center"><StarRating value={Math.round(sum.average)} size="h-4 w-4" /></div>
                    <div className="mt-1.5 font-body text-xs text-charcoal/50">{sum.count} đánh giá</div>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((n) => {
                      const c = sum.breakdown[n] || 0
                      const pct = sum.count ? (c / sum.count) * 100 : 0
                      const on = star === n
                      return (
                        <button key={n} onClick={() => pickStar(n)} disabled={!c}
                          title={c ? `Lọc ${n} sao` : 'Chưa có đánh giá mức này'}
                          className={`flex w-full items-center gap-3 rounded-sm px-2 py-1 text-left transition-colors ${
                            c ? 'cursor-pointer hover:bg-black/5' : 'cursor-default opacity-45'
                          } ${on ? 'bg-gold/10' : ''}`}>
                          <span className={`w-3 shrink-0 font-body text-xs ${on ? 'font-bold text-gold' : 'text-charcoal/60'}`}>{n}</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/8">
                            <span className={`block h-full rounded-full transition-all duration-500 ${on ? 'bg-gold' : 'bg-gold/55'}`}
                              style={{ width: `${pct}%` }} />
                          </span>
                          <span className="w-6 shrink-0 text-right font-body text-xs text-charcoal/45">{c}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {star && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="font-body text-sm text-charcoal/60">Đang lọc: <b className="text-charcoal">{star} sao</b></span>
                    <button onClick={() => setStar(null)}
                      className="rounded-full border border-gold/40 px-3 py-1 font-nav text-[11px] font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-white">
                      Bỏ lọc
                    </button>
                  </div>
                )}

                {/* ── Danh sách ── */}
                <div className="mt-5 space-y-5">
                  {loading ? <p className="py-8 text-center font-body text-sm text-charcoal/45">Đang tải…</p>
                    : !list.items.length ? (
                      <p className="py-8 text-center font-body text-sm text-charcoal/45">
                        Chưa có đánh giá {star} sao nào.
                      </p>
                    ) : list.items.map((r) => (
                      <figure key={r._id} className="border-b border-black/5 pb-5 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 font-nav text-xs font-semibold text-gold">
                            {initialsOf(r.customer?.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-nav text-sm font-semibold text-charcoal">{r.customer?.fullName || 'Khách hàng'}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <StarRating value={r.rating} size="h-3 w-3" />
                              <span className="font-body text-xs text-charcoal/40">{fmtDate(r.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {r.comment && (
                          <blockquote className="mt-2.5 font-body text-[15px] leading-relaxed text-charcoal/75">{r.comment}</blockquote>
                        )}
                      </figure>
                    ))}
                </div>

                {list.hasMore && (
                  <button disabled={more}
                    onClick={async () => { setMore(true); await load(star, list.items.length); setMore(false) }}
                    className="mt-5 w-full rounded-sm border border-gold px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-white disabled:opacity-50">
                    {more ? 'Đang tải…' : `Xem thêm (còn ${list.total - list.items.length})`}
                  </button>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  )
}
