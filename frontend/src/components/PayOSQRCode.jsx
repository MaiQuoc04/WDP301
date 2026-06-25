import { QRCode } from 'antd'

const IMAGE_SOURCE_RE = /^(https?:\/\/|blob:|data:image\/)/i

const getImageSource = (value) => {
  const qrValue = String(value || '').trim()
  if (!qrValue) return ''
  if (IMAGE_SOURCE_RE.test(qrValue)) return qrValue

  if (qrValue.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${qrValue}`
  if (qrValue.startsWith('/9j/')) return `data:image/jpeg;base64,${qrValue}`
  if (qrValue.startsWith('R0lGOD')) return `data:image/gif;base64,${qrValue}`
  if (qrValue.startsWith('UklGR')) return `data:image/webp;base64,${qrValue}`
  if (qrValue.startsWith('PHN2Zy')) return `data:image/svg+xml;base64,${qrValue}`

  return ''
}

export default function PayOSQRCode({
  value,
  size = 210,
  imageClassName,
  qrClassName,
  placeholderClassName,
  placeholder = 'Không tải được QR',
  alt = 'PayOS QR',
}) {
  const qrValue = String(value || '').trim()
  if (!qrValue) {
    return <div className={placeholderClassName}>{placeholder}</div>
  }

  const imageSource = getImageSource(qrValue)
  if (imageSource) {
    return <img src={imageSource} alt={alt} className={imageClassName} />
  }

  return (
    <div className={qrClassName} style={{ width: size, height: size }}>
      <QRCode value={qrValue} size={size} bordered={false} errorLevel="M" />
    </div>
  )
}
