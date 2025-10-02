import React, { useState, useMemo, createContext, useContext } from 'react';
import InvoiceForm from './components/InvoiceForm';
import HistoryPage from './components/HistoryPage';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Login from './components/Login';

// --- Authentication Context (simple client-side gating) ---
export const AuthContext = createContext({ user:null, login:()=>{}, logout:()=>{} });

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
  const [user, setUser] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('auth_user')) || null; } catch { return null; }
  });

  const authValue = useMemo(()=>({
    user,
    login: (u)=>{ setUser(u); localStorage.setItem('auth_user', JSON.stringify(u)); },
    logout: ()=>{ setUser(null); localStorage.removeItem('auth_user'); }
  }),[user]);

  const value = useMemo(()=>({ theme, toggle: ()=> setTheme(t => t === 'light' ? 'dark' : 'light')}),[theme]);
  const pdfValue = useMemo(()=>({ detailed: pdfDetailed, toggle: ()=> setPdfDetailed(d => !d)}),[pdfDetailed]);

  if (!user) {
    return (
      <AuthContext.Provider value={authValue}>
        <ThemeContext.Provider value={value}>
          <div className={`app theme-${theme}`}> <Login /> </div>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
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
                  <LogoutButton />
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
    </AuthContext.Provider>
  );
}

const LogoutButton = () => {
  const { logout } = useContext(AuthContext);
  return <button className="theme-toggle" style={{background:'#ffeded', color:'#222'}} onClick={logout}>Logout</button>;
};

export default App;