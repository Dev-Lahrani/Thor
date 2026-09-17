import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { ThreatProvider } from './context/ThreatContext'
import { Layout, MapView, VulnerabilitiesPage, ThreatIntelPage, DataBreachPage } from './pages'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThreatProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MapView />} />
            <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
            <Route path="/threat-intel" element={<ThreatIntelPage />} />
            <Route path="/breaches" element={<DataBreachPage />} />
          </Route>
        </Routes>
      </ThreatProvider>
    </BrowserRouter>
  </StrictMode>,
)
