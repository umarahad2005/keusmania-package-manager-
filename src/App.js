import React, { useState, useMemo, createContext, useContext } from 'react';
import InvoiceForm from './components/InvoiceForm';
import HistoryPage from './components/HistoryPage';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

export const ThemeContext = createContext({ theme: 'light', toggle: () => {} });
export const PdfModeContext = createContext({ detailed:true, toggle: () => {} });

const ThemeToggle = () => {
  const { theme, toggle } = useContext(ThemeContext);
  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
};

function App() {
  const [theme, setTheme] = useState('light');
  const [pdfDetailed, setPdfDetailed] = useState(true);
  const value = useMemo(()=>({ theme, toggle: ()=> setTheme(t => t === 'light' ? 'dark' : 'light')}),[theme]);
  const pdfValue = useMemo(()=>({ detailed: pdfDetailed, toggle: ()=> setPdfDetailed(d => !d)}),[pdfDetailed]);
  return (
    <ThemeContext.Provider value={value}>
      <PdfModeContext.Provider value={pdfValue}>
        <Router>
          <div className={`app theme-${theme}`}>
            <header className="app-header branded-header">
              <div className="brand-left">
                <img src="/assets/logo.jpg" alt="Company Logo" className="brand-logo" />
                <div>
                  <h1>Karwan-e-Usmania Package Manager</h1>
                  <p className="tagline">Professional Umrah Package & Invoice Generation</p>
                </div>
              </div>
              <div className="header-actions" style={{gap:'10px'}}>
                <Link to="/" className="nav-link">Create</Link>
                <Link to="/history" className="nav-link">History</Link>
                <button onClick={pdfValue.toggle} className="theme-toggle" style={{background:'#fff'}}>{pdfDetailed? 'Detailed PDF' : 'Minimal PDF'}</button>
                <ThemeToggle />
              </div>
            </header>
            <main className="invoice-container fade-in">
              <Routes>
                <Route path="/" element={<InvoiceForm />} />
                <Route path="/history" element={<HistoryPage />} />
              </Routes>
            </main>
            <footer className="app-footer">
              <small>&copy; {new Date().getFullYear()} Karwan-e-Usmania. All rights reserved.</small>
            </footer>
          </div>
        </Router>
      </PdfModeContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;