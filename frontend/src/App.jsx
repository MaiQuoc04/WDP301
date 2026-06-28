import { ConfigProvider } from 'antd'
import AppRoutes from './routes/AppRoutes'

// Theme antd toàn cục — đồng bộ tông gold "Oriental Elegance" cho mọi dashboard nội bộ + component antd
const antdTheme = {
  token: {
    colorPrimary: '#A18348',
    colorLink: '#A18348',
    colorLinkHover: '#8B6F3F',
    colorInfo: '#A18348',
    borderRadius: 6,
    fontFamily:
      "'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Button: { primaryShadow: 'none', fontWeight: 600 },
    Menu: { itemSelectedColor: '#A18348', itemSelectedBg: '#FBF8F2' },
    Table: { headerBg: '#FBF8F2', headerColor: '#7D6338', rowHoverBg: '#FBF8F2' },
    Tabs: { inkBarColor: '#A18348', itemSelectedColor: '#A18348' },
    Switch: { colorPrimary: '#A18348' },
    Tag: { defaultBg: '#FBF8F2' },
  },
}

function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <AppRoutes />
    </ConfigProvider>
  )
}

export default App
