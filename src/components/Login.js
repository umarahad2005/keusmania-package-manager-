import React, { useState, useContext } from 'react';
import { ThemeContext } from '../App';
import { AuthContext } from '../App';

// Default static credentials (client-side only; for production replace with real auth)
const DEFAULT_USER = 'Keusmani';
const DEFAULT_PASS = 'Keusm@ni@';

const Login = () => {
  const { theme } = useContext(ThemeContext);
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (username === DEFAULT_USER && password === DEFAULT_PASS) {
      login({ username: DEFAULT_USER, time: Date.now() });
      return;
    }
    setError('Invalid credentials');
    setTimeout(()=> setError(''), 3000);
  };

  return (
    <div style={{display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <form onSubmit={submit} className={`login-card theme-${theme}`} style={{
        width:'100%', maxWidth:'360px', background:'var(--card-bg,#fff)', border:'1px solid var(--border-color,#ddd)',
        borderRadius:'14px', padding:'32px 30px', boxShadow:'0 10px 25px -8px rgba(0,0,0,0.15)',
        display:'flex', flexDirection:'column', gap:'18px'
      }}>
        <h2 style={{margin:0, textAlign:'center'}}>Secure Access</h2>
        <p style={{margin:'0 0 8px', fontSize:'13px', textAlign:'center', color:'var(--text-muted,#555)'}}>
          Enter credentials to continue
        </p>
        <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
          <label style={{fontSize:'13px', fontWeight:600}}>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" required
            style={inputStyle} autoFocus />
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
          <label style={{fontSize:'13px', fontWeight:600}}>Password</label>
          <div style={{position:'relative'}}>
            <input type={showPass? 'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required
              style={{...inputStyle, paddingRight:'70px'}} />
            <button type="button" onClick={()=> setShowPass(s=>!s)} style={toggleBtnStyle}>{showPass? 'Hide':'Show'}</button>
          </div>
        </div>
        {error && <div style={{background:'#ffe5e5', color:'#a40000', padding:'8px 10px', borderRadius:'8px', fontSize:'12px'}}>{error}</div>}
        <button type="submit" style={loginBtnStyle}>Login</button>
        <div style={{marginTop:'4px', fontSize:'11px', textAlign:'center', opacity:.7}}>
          Default: {DEFAULT_USER} / {DEFAULT_PASS}
        </div>
      </form>
    </div>
  );
};

const inputStyle = {
  width:'100%', padding:'12px 14px', border:'1px solid var(--border-color,#ccc)', borderRadius:'10px', fontSize:'14px',
  outline:'none', background:'var(--input-bg,#fff)'
};
const loginBtnStyle = {
  background:'linear-gradient(135deg,#1d4284,#2f6bcc)', border:'none', color:'#fff', padding:'12px 16px',
  fontSize:'15px', fontWeight:600, borderRadius:'10px', cursor:'pointer', letterSpacing:'.5px', boxShadow:'0 4px 14px -4px rgba(0,0,0,0.25)'
};
const toggleBtnStyle = {
  position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'var(--btn-alt-bg,#f1f1f4)',
  border:'1px solid var(--border-color,#ccc)', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', cursor:'pointer'
};

export default Login;
