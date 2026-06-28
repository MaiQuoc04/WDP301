/*
 * LotusMascot — linh vật hoa sen tương tác cho trang đăng nhập.
 *  mode: 'idle'  -> sen nở, nhụy (mắt) nhìn xuống ô nhập
 *        'cover' -> 2 cánh trước khép che nhụy (gõ mật khẩu)
 *        'peek'  -> cánh hé nửa, mắt ti hí (bấm xem mật khẩu)
 *  lookX: -1..1 — con ngươi liếc ngang theo vị trí gõ
 */
const PETAL = 'M0 0 C -17 -22 -13 -54 0 -72 C 13 -54 17 -22 0 0 Z'
const EASE = 'transform 0.45s cubic-bezier(0.34, 1.4, 0.5, 1), opacity 0.35s ease'

const LotusMascot = ({ mode = 'idle', lookX = 0, lookActive = false }) => {
  const covering = mode === 'cover' || mode === 'peek'
  // Con ngươi chỉ liếc theo caret khi đang focus ô email (lookActive); còn lại nhìn thẳng
  const px = lookActive ? Math.max(-1, Math.min(1, lookX)) * 2.4 : 0
  const py = lookActive ? 3 : 0
  // Góc xoay 2 cánh che (gốc xoay tại đáy ~ 110,150)
  const leftRot = mode === 'cover' ? -2 : mode === 'peek' ? -26 : -52
  const rightRot = mode === 'cover' ? 2 : mode === 'peek' ? 26 : 52

  return (
    <svg viewBox="0 0 220 196" className="h-32 w-32 select-none md:h-36 md:w-36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="lm-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9A45C" />
          <stop offset="1" stopColor="#A18348" />
        </linearGradient>
        <linearGradient id="lm-gold-soft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8D9B5" />
          <stop offset="1" stopColor="#C9A45C" />
        </linearGradient>
      </defs>

      {/* Cánh sen nền (nở, tĩnh) */}
      <g transform="translate(110 150)" fill="url(#lm-gold)" opacity="0.9">
        <path d={PETAL} transform="rotate(0) scale(1.05)" />
        <path d={PETAL} transform="rotate(-38) scale(0.98)" />
        <path d={PETAL} transform="rotate(38) scale(0.98)" />
        <path d={PETAL} transform="rotate(-72) scale(0.84)" opacity="0.85" />
        <path d={PETAL} transform="rotate(72) scale(0.84)" opacity="0.85" />
      </g>

      {/* Nhụy / khuôn mặt */}
      <g>
        <ellipse cx="110" cy="118" rx="34" ry="30" fill="#FBF8F2" stroke="#E8D9B5" strokeWidth="1.5" />
        {/* Má */}
        <circle cx="88" cy="126" r="6" fill="#E8C9A0" opacity="0.7" />
        <circle cx="132" cy="126" r="6" fill="#E8C9A0" opacity="0.7" />

        {/* Mắt trái — luôn mở (kể cả peek: mở 1 mắt) */}
        <g>
          <ellipse cx="99" cy="116" rx="5.4" ry="6.2" fill="#fff" stroke="#C9A45C" strokeWidth="1" />
          <circle cx={99 + px} cy={116 + py} r="3" fill="#5A4423" style={{ transition: 'cx 0.18s ease, cy 0.25s ease' }} />
        </g>
        {/* Mắt phải — peek thì nhắm (nháy mắt: mở trái nhắm phải) */}
        <g>
          {mode === 'peek' ? (
            <path d="M115 117 q6 4 12 0" stroke="#7D6338" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="121" cy="116" rx="5.4" ry="6.2" fill="#fff" stroke="#C9A45C" strokeWidth="1" />
              <circle cx={121 + px} cy={116 + py} r="3" fill="#5A4423" style={{ transition: 'cx 0.18s ease, cy 0.25s ease' }} />
            </>
          )}
        </g>

        {/* Miệng */}
        <path d={mode === 'idle' ? 'M104 130 q6 5 12 0' : 'M105 131 q5 3 10 0'} stroke="#A18348" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      {/* 2 cánh trước (khép che mắt) — translate qua attribute, rotate qua CSS (origin tại gốc cánh) */}
      <g transform="translate(99 150)">
        <path d={PETAL} fill="url(#lm-gold-soft)" stroke="#C9A45C" strokeWidth="1"
          style={{ transition: EASE, transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `rotate(${leftRot}deg) scale(0.98)` }} />
      </g>
      <g transform="translate(121 150)">
        <path d={PETAL} fill="url(#lm-gold-soft)" stroke="#C9A45C" strokeWidth="1"
          style={{ transition: EASE, transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `rotate(${rightRot}deg) scale(0.98)` }} />
      </g>

      {/* Đốm sáng nhụy khi nở */}
      {!covering && <circle cx="110" cy="150" r="4" fill="#FFD074" opacity="0.9" />}
    </svg>
  )
}

export default LotusMascot
