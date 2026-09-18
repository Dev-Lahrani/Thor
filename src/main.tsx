import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { CTIProvider } from './components'

const WeatherPage = lazy(() => import('./pages/WeatherPage'))
const AirQualityPage = lazy(() => import('./pages/AirQualityPage'))

const PageFallback = (
  <div className="h-screen w-screen flex items-center justify-center bg-cyber-darker">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={PageFallback}>
          <CTIProvider>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/air-quality" element={<AirQualityPage />} />
            </Routes>
          </CTIProvider>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
