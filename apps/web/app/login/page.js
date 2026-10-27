'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useWebsiteSettings } from '@/store/settingsStore';
import { useLoginPageSettingsStore } from '@/store/loginSettingsStore';
import { resolveAssetUrl } from '@/lib/assetUrl';

const createSeededRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const PARTICLES_DATA = Array.from({ length: 16 }, (_, i) => {
  const random = createSeededRandom(2026 + i * 97);
  return {
    size: random() * 4 + 1.5,
    left: random() * 100,
    dur: random() * 12 + 8,
    del: random() * 15,
    op: (random() * 0.12 + 0.04).toFixed(2),
    dx: (random() - 0.5) * 120,
  };
});

/* ─── Eye Icons ─────────────────────────────────────────────── */
function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

/* ─── Particles Component ────────────────────────────────────── */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {PARTICLES_DATA.map((particle, i) => {
        return (
          <div
            key={i}
            style={{
              position:        'absolute',
              width:           `${particle.size}px`,
              height:          `${particle.size}px`,
              left:            `${particle.left}%`,
              bottom:          '-20px',
              borderRadius:    '50%',
              background:      'var(--gold)',
              opacity:         0,
              animation:       `particleFly ${particle.dur}s linear ${particle.del}s infinite`,
              '--dx':          `${particle.dx}px`,
              '--op':          particle.op,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Float Badges ───────────────────────────────────────────── */
function FloatingFoodImg({ src, alt, style, className }) {
  return (
    <div style={{
      position:   'absolute',
      borderRadius:'50%',
      overflow:   'hidden',
      border:     '2px solid rgba(201,168,76,0.4)',
      boxShadow:  '0 8px 32px rgba(0,0,0,0.5)',
      zIndex:     3,
      ...style,
    }} className={className}>
      <img src={src} alt={alt} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
    </div>
  );
}

/* ─── Main Login Page ────────────────────────────────────────── */
export default function LoginPage() {
  const [form,       setForm]       = useState({ email: '', password: '' });
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [toast,      setToast]      = useState({ show: false, msg: '', icon: '✅' });
  const [fieldErr,   setFieldErr]   = useState({ email: '', password: '' });
  const [transition, setTransition] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  const emailRef    = useRef(null);
  const toastTimer  = useRef(null);
  const { setAuth } = useAuthStore();
  const { settings, loadSettings } = useWebsiteSettings();
  const {
    settings: loginPageSettings,
    loadSettings: loadLoginPageSettings,
    isLoading: loginSettingsLoading,
    hasLoaded: loginSettingsHasLoaded,
  } = useLoginPageSettingsStore();
  const router      = useRouter();
  const logoSrc     = resolveAssetUrl(settings?.logo_url, '/images/assets/logo.png');
  const storeName   = settings?.store_name || 'Sultan Kebab';
  const loginMedia  = loginPageSettings.media || {};
  const loginHero   = loginPageSettings.hero || {};
  const loginBrand  = loginPageSettings.brand || {};
  const loginForm   = loginPageSettings.form || {};
  const loginValidation = loginPageSettings.validation || {};
  const loginFooter = loginPageSettings.footer || {};
  const floatingImages = loginMedia.floatingImages || [];
  const mediaEnabled = loginMedia.enabled !== false;
  const heroEnabled = loginHero.enabled !== false;
  const brandEnabled = loginBrand.enabled !== false;
  const formEnabled = loginForm.enabled !== false;
  const footerEnabled = loginFooter.enabled !== false;
  const showLeftPanel = mediaEnabled || heroEnabled;

  /* mount animation */
  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    loadSettings().catch(() => {});
    loadLoginPageSettings().catch(() => {});
  }, [loadSettings, loadLoginPageSettings]);

  /* cursor glow */
  useEffect(() => {
    const el = document.getElementById('cursor-glow');
    if (!el) return;
    const fn = (e) => {
      el.style.left = e.clientX + 'px';
      el.style.top  = e.clientY + 'px';
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  function showToast(msg, icon = 'OK') {
    clearTimeout(toastTimer.current);
    setToast({ show: true, msg, icon });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }

  /* ── Validation ── */
  function validate() {
    const errs = { email: '', password: '' };
    const re   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim())         errs.email    = loginValidation.emailRequired || 'Email tidak boleh kosong';
    else if (!re.test(form.email))  errs.email    = loginValidation.emailInvalid || 'Format email tidak valid';
    if (!form.password)             errs.password = loginValidation.passwordRequired || 'Password tidak boleh kosong';
    else if (form.password.length < 6) errs.password = loginValidation.passwordMinLength || 'Password minimal 6 karakter';
    setFieldErr(errs);
    return !errs.email && !errs.password;
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await login({ email: form.email, password: form.password });
      setAuth(res.data.user, res.data.token);
      const successMessage = (loginForm.successToast || 'Selamat datang, {name}!')
        .replace('{name}', res.data.user.name);
      showToast(successMessage, 'OK');
      setTimeout(() => {
        setTransition(true);
        setTimeout(() => {
          router.replace(res.data.user.role === 'admin' ? '/dashboard' : '/pos');
        }, 600);
      }, 700);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || loginForm.errorMessage || 'Email atau password salah. Silakan coba lagi.';
      setError(msg);
    }
  }

  const inputBase = (hasErr) => ({
    width:           '100%',
    padding:         '0.85rem 1rem 0.85rem 2.8rem',
    background:      hasErr ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.04)',
    border:          `1px solid ${hasErr ? 'rgba(239,68,68,0.6)' : 'rgba(201,168,76,0.18)'}`,
    color:           'var(--text)',
    fontFamily:      "'DM Sans', sans-serif",
    fontSize:        '0.9rem',
    outline:         'none',
    transition:      'all 0.3s ease',
    borderRadius:    '2px',
  });

  if (!loginSettingsHasLoaded && loginSettingsLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at 20% 0%, rgba(201,168,76,0.14), transparent 35%), #0D0A06',
        color: 'var(--cream)',
      }}>
        <div style={{
          width: 'min(360px, calc(100vw - 48px))',
          border: '1px solid rgba(201,168,76,0.22)',
          background: 'rgba(26,20,9,0.72)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
        }}>
          <p style={{
            color: 'var(--gold)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2rem',
            letterSpacing: '0.22em',
          }}>{storeName}</p>
          <div style={{
            height: '3px',
            margin: '1.25rem auto 0',
            width: '72%',
            overflow: 'hidden',
            background: 'rgba(201,168,76,0.14)',
          }}>
            <span style={{
              display: 'block',
              width: '45%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
              animation: 'loginShellSweep 1.2s ease-in-out infinite',
            }} />
          </div>
        </div>
        <style>{`
          @keyframes loginShellSweep {
            from { transform: translateX(-120%); }
            to { transform: translateX(260%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* ── Global style inject ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap');

        * { margin:0; padding:0; box-sizing:border-box; }
        html,body { min-height:100vh; background:var(--dark); color:var(--text); font-family:'DM Sans',sans-serif; overflow-x:hidden; }

        @keyframes particleFly {
          0%   { transform:translateY(0) translateX(0) scale(0); opacity:0; }
          10%  { opacity:var(--op); }
          90%  { opacity:var(--op); }
          100% { transform:translateY(-100vh) translateX(var(--dx)) scale(1); opacity:0; }
        }
        @keyframes bgZoom {
          from { transform:scale(1.0); }
          to   { transform:scale(1.12); }
        }
        @keyframes floatFood {
          0%,100% { transform:translateY(0) rotate(-2deg); }
          50%     { transform:translateY(-14px) rotate(2deg); }
        }
        @keyframes lineReveal {
          0%   { opacity:0; transform:scaleY(0); transform-origin:top; }
          100% { opacity:0.3; transform:scaleY(1); }
        }
        @keyframes goldPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.4; transform:scale(0.7); }
        }
        @keyframes shimmer {
          from { left:-100%; }
          to   { left:100%; }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          20%,60% { transform:translateX(-6px); }
          40%,80% { transform:translateX(6px); }
        }
        @keyframes toastIn {
          from { transform:translateX(120%); }
          to   { transform:translateX(0); }
        }
        @keyframes toastOut {
          from { transform:translateX(0); }
          to   { transform:translateX(120%); }
        }

        .login-field-input:focus {
          border-color: var(--gold) !important;
          background: rgba(201,168,76,0.06) !important;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.1), inset 0 0 12px rgba(201,168,76,0.03) !important;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(26,20,9,0.95) inset !important;
          -webkit-text-fill-color: var(--text) !important;
          caret-color: var(--text) !important;
        }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:var(--dark); }
        ::-webkit-scrollbar-thumb { background:var(--gold); border-radius:2px; }

        .btn-shimmer::before {
          content:'';
          position:absolute;
          top:0; left:-100%;
          width:100%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
          transition:left 0.5s ease;
        }
        .btn-shimmer:hover:not(:disabled)::before { left:100%; }
        .btn-shimmer:hover:not(:disabled) {
          box-shadow: 0 8px 32px rgba(201,168,76,0.38);
          transform: translateY(-1px);
        }
        .btn-shimmer:active:not(:disabled) { transform: translateY(0); }

        @media (max-width: 1024px) {
          .login-layout { grid-template-columns: 1fr !important; }
          .login-left-panel {
            min-height: 42vh !important;
            justify-content: flex-end !important;
            padding: 1.25rem !important;
          }
          .login-right-panel {
            min-height: auto !important;
            padding: 1.5rem 1.25rem 2rem !important;
          }
          .login-form-wrapper { max-width: 540px !important; }
          .login-brand { margin-bottom: 1.5rem !important; }
          .login-hero-content p { max-width: 100% !important; }
          .login-stats { gap: 1.25rem !important; flex-wrap: wrap; }
          .food-float-3, .food-float-4 { display:none !important; }
          #cursor-glow { display:none !important; }
        }

        @media (max-width: 640px) {
          .login-left-panel { display: none !important; }
          .login-right-panel {
            min-height: 100vh !important;
            justify-content: flex-start !important;
            padding: 1.25rem 1rem 2rem !important;
          }
          .login-form-wrapper { max-width: 100% !important; }
          .login-toast {
            left: 1rem !important;
            right: 1rem !important;
            top: 1rem !important;
            max-width: none !important;
          }
        }
      `}</style>

      {/* ── Cursor Glow ── */}
      <div
        id="cursor-glow"
        style={{
          position:      'fixed',
          width:         '320px',
          height:        '320px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          transform:     'translate(-50%, -50%)',
          zIndex:        9998,
          transition:    'opacity 0.3s',
          display:       'block',
        }}
      />

      {/* ── Page Transition ── */}
      <div style={{
        position:        'fixed',
        inset:           0,
        background:      'var(--gold)',
        zIndex:          9999,
        transform:       transition ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition:      'transform 0.55s cubic-bezier(0.77,0,0.18,1)',
      }} />

      {/* ── Toast ── */}
      <div className="login-toast" style={{
        position:   'fixed',
        top:        '1.5rem',
        right:      '1.5rem',
        zIndex:     9997,
        background: 'var(--dark3)',
        border:     '1px solid rgba(201,168,76,0.35)',
        padding:    '0.9rem 1.3rem',
        display:    'flex',
        alignItems: 'center',
        gap:        '0.7rem',
        fontSize:   '0.85rem',
        color:      'var(--text)',
        boxShadow:  '0 8px 32px rgba(0,0,0,0.55)',
        maxWidth:   '320px',
        borderRadius:'2px',
        animation:  toast.show
          ? 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'
          : 'toastOut 0.3s ease forwards',
        opacity:    toast.show ? 1 : 0,
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize:'1.2rem', flexShrink:0 }}>{toast.icon}</span>
        <span>{toast.msg}</span>
      </div>

      {/* ── Main Layout ── */}
      <div className="login-layout" style={{
        minHeight:           '100vh',
        display:             'grid',
        gridTemplateColumns: showLeftPanel ? 'clamp(320px, 50%, 700px) 1fr' : '1fr',
      }}>

        {/* ═══ LEFT PANEL ═══ */}
        {showLeftPanel && (
        <div className="login-left-panel" style={{
          position:   'relative',
          overflow:   'hidden',
          display:    'flex',
          flexDirection:'column',
          justifyContent:'flex-end',
          padding:    'clamp(1.5rem, 3vw, 3rem)',
          minHeight:  '100vh',
        }}>
          {/* BG image */}
          {mediaEnabled && (
            <img
              src={loginMedia.backgroundImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=85'}
              alt="Sultan Kebab"
              style={{
                position:   'absolute',
                inset:      0,
                width:      '100%',
                height:     '100%',
                objectFit:  'cover',
                animation:  'bgZoom 25s ease-in-out infinite alternate',
                zIndex:     0,
              }}
            />
          )}
          {/* Gradient overlay */}
          <div style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(160deg, rgba(13,10,6,0.3) 0%, rgba(13,10,6,0.55) 40%, rgba(13,10,6,0.95) 100%)',
            zIndex:     1,
          }} />
          {/* Grain */}
          <div style={{
            position:           'absolute',
            inset:              0,
            zIndex:             2,
            opacity:            0.04,
            backgroundImage:    `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize:     '180px',
            pointerEvents:      'none',
          }} />

          {/* Gold vertical lines */}
          {[{l:'20%',h:'35%',t:'10%',d:'0.5s'},{l:'45%',h:'20%',t:'5%',d:'1s'},{l:'70%',h:'28%',t:'15%',d:'1.5s'}].map((ln,i)=>(
            <div key={i} style={{
              position:        'absolute',
              left:            ln.l,
              top:             ln.t,
              height:          ln.h,
              width:           '1px',
              background:      'linear-gradient(to bottom, transparent, var(--gold), transparent)',
              opacity:         0,
              zIndex:          2,
              animation:       `lineReveal 3s ${ln.d} ease forwards`,
              pointerEvents:   'none',
            }} />
          ))}

          {mediaEnabled && (
            <>
              {/* Floating food */}
              <FloatingFoodImg src={floatingImages[0]?.src || 'https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=200&q=80'} alt={floatingImages[0]?.alt || 'Kebab'}
                style={{ width:'90px', height:'90px', top:'12%', right:'15%', animation:'floatFood 7s ease-in-out infinite' }} />
              <FloatingFoodImg src={floatingImages[1]?.src || 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&q=80'} alt={floatingImages[1]?.alt || 'Baklava'}
                style={{ width:'65px', height:'65px', top:'28%', right:'8%', animation:'floatFood 5s -2s ease-in-out infinite' }} />
              <FloatingFoodImg src={floatingImages[2]?.src || 'https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=200&q=80'} alt={floatingImages[2]?.alt || 'Falafel'}
                style={{ width:'80px', height:'80px', top:'45%', right:'20%', animation:'floatFood 8s -4s ease-in-out infinite' }}
                className="food-float-3" />
              <FloatingFoodImg src={floatingImages[3]?.src || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&q=80'} alt={floatingImages[3]?.alt || 'Hummus'}
                style={{ width:'55px', height:'55px', top:'62%', right:'6%', animation:'floatFood 6s -1s ease-in-out infinite' }}
                className="food-float-4" />

              {/* Particles */}
              <Particles />
            </>
          )}

          {/* Left content */}
          {heroEnabled && (
          <div className="login-hero-content" style={{
            position:  'relative',
            zIndex:    10,
            animation: mounted ? 'fadeSlideUp 1s ease forwards' : 'none',
            opacity:   mounted ? undefined : 0,
          }}>
            {/* Badge */}
            <div style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '0.5rem',
              border:         '1px solid rgba(201,168,76,0.5)',
              color:          'var(--gold)',
              fontSize:       '0.65rem',
              letterSpacing:  '3px',
              textTransform:  'uppercase',
              padding:        '0.4rem 0.9rem',
              marginBottom:   '1.5rem',
            }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--gold)', display:'inline-block', animation:'goldPulse 2s infinite' }} />
              {loginHero.badge || 'Sultan Kebab Admin Panel'}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily:  "'Playfair Display', serif",
              fontSize:    'clamp(2rem, 4vw, 3.2rem)',
              fontWeight:  900,
              lineHeight:  1.05,
              marginBottom:'1.2rem',
              color:       'var(--text)',
            }}>
              {loginHero.titleTop || 'Kelola Restoran'}<br />
              <span style={{ fontStyle:'italic', fontWeight:400, color:'var(--gold)' }}>{loginHero.titleAccent || 'Dengan Mudah'}</span>
            </h1>

            {/* Desc */}
            <p style={{
              fontSize:     '0.9rem',
              color:        'var(--text-muted)',
              lineHeight:   1.75,
              maxWidth:     '380px',
              marginBottom: '2rem',
            }}>
              {loginHero.description || 'Panel admin eksklusif untuk mengelola menu, pesanan, stok, dan laporan Sultan Kebab secara real-time.'}
            </p>

            {/* Stats */}
            <div className="login-stats" style={{ display:'flex', gap:'2rem' }}>
              {(loginHero.stats || []).map((stat, index)=>(
                <div key={`${stat.label}-${index}`}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', color:'var(--gold)', fontWeight:700, display:'block', lineHeight:1 }}>{stat.value}</span>
                  <span style={{ fontSize:'0.65rem', letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-muted)' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        )}

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="login-right-panel" style={{
          display:         'flex',
          flexDirection:   'column',
          justifyContent:  'center',
          alignItems:      'center',
          padding:         'clamp(1.5rem, 4vw, 3.5rem) clamp(1.5rem, 4vw, 4rem)',
          background:      'var(--dark2)',
          position:        'relative',
          overflow:        'hidden',
          minHeight:       '100vh',
        }}>
          {/* Decorative radial blobs */}
          <div style={{ position:'absolute', width:'400px', height:'400px', top:'-150px', right:'-150px', borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:'300px', height:'300px', bottom:'-100px', left:'-100px', borderRadius:'50%', background:'radial-gradient(circle, rgba(139,26,26,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

          <div className="login-form-wrapper" style={{ width:'100%', maxWidth:'420px', position:'relative', zIndex:2 }}>

            {/* ── Logo ── */}
            {brandEnabled && (
            <div className="login-brand" style={{
              display:       'flex',
              alignItems:    'center',
              gap:           '0.8rem',
              marginBottom:  '2.5rem',
              animation:     mounted ? 'fadeSlideUp 0.8s ease forwards' : 'none',
              opacity:       mounted ? undefined : 0,
            }}>
              <div style={{
                width:        '48px',
                height:       '48px',
                borderRadius: '12px',
                overflow:     'hidden',
                border:       '2px solid rgba(201,168,76,0.4)',
                boxShadow:    '0 4px 20px rgba(201,168,76,0.25)',
                flexShrink:   0,
              }}>
                <img
                  src={logoSrc}
                  alt={`${storeName} Logo`}
                  onError={(e) => {
                    if (e.currentTarget.dataset.fallbackApplied === '1') return;
                    e.currentTarget.dataset.fallbackApplied = '1';
                    e.currentTarget.src = '/images/assets/logo.png';
                  }}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                />
              </div>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.4rem', letterSpacing:'3px', color:'var(--gold)', lineHeight:1 }}>{storeName}</div>
                <div style={{ fontSize:'0.65rem', letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-muted)' }}>{loginBrand.subtitle || 'Admin Dashboard'}</div>
              </div>
            </div>
            )}

            {/* ── Form Header ── */}
            {formEnabled ? (
            <>
            <div style={{
              marginBottom: '1.8rem',
              animation:    mounted ? 'fadeSlideUp 0.8s 0.15s ease forwards' : 'none',
              opacity:      mounted ? undefined : 0,
            }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:700, marginBottom:'0.4rem', lineHeight:1.2, color:'var(--text)' }}>
                {loginForm.title || 'Selamat'} <span style={{ color:'var(--gold)', fontStyle:'italic' }}>{loginForm.titleAccent || 'Datang'}</span>
              </h2>
              <p style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>
                {loginForm.subtitle || 'Masuk ke panel admin untuk mengelola operasional restoran'}
              </p>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{
                display:   'flex',
                flexDirection:'column',
                gap:       '1.2rem',
                animation: mounted ? 'fadeSlideUp 0.8s 0.3s ease forwards' : 'none',
                opacity:   mounted ? undefined : 0,
              }}>

                {/* Error Alert */}
                {error && (
                  <div style={{
                    display:       'flex',
                    alignItems:    'flex-start',
                    gap:           '0.7rem',
                    padding:       '0.85rem 1rem',
                    borderLeft:    '3px solid #ef4444',
                    background:    'rgba(239,68,68,0.08)',
                    fontSize:      '0.82rem',
                    lineHeight:    1.5,
                    color:         '#fca5a5',
                    borderRadius:  '0 2px 2px 0',
                    animation:     'fadeSlideUp 0.3s ease forwards',
                  }}>
                    <span style={{ flexShrink:0 }}>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label style={{ display:'block', fontSize:'0.72rem', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'0.5rem', fontWeight:600 }}>
                    {loginForm.emailLabel || 'Email'}
                  </label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', fontSize:'1rem', opacity: form.email ? 1 : 0.5, pointerEvents:'none', zIndex:2 }}>✉️</span>
                    <input
                      ref={emailRef}
                      type="email"
                      value={form.email}
                      onChange={e => { setForm(f=>({...f,email:e.target.value})); if(fieldErr.email) setFieldErr(fe=>({...fe,email:''})); if(error) setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && document.getElementById('passField')?.focus()}
                      placeholder={loginForm.emailPlaceholder || 'admin@sultankebab.com'}
                      autoComplete="username email"
                      inputMode="email"
                      className="login-field-input"
                      style={{ ...inputBase(!!fieldErr.email), paddingLeft:'2.8rem' }}
                    />
                    {/* Animated underbar */}
                    <div style={{
                      position:        'absolute',
                      bottom:0, left:0,
                      width:           '100%',
                      height:          '2px',
                      background:      'linear-gradient(to right, var(--gold), var(--gold-light))',
                      transform:       form.email ? 'scaleX(1)' : 'scaleX(0)',
                      transition:      'transform 0.3s ease',
                      transformOrigin: 'left',
                    }} />
                  </div>
                  {fieldErr.email && (
                    <div style={{ fontSize:'0.73rem', color:'#ef4444', marginTop:'0.35rem', display:'flex', alignItems:'center', gap:'0.25rem', animation:'fadeSlideUp 0.2s ease' }}>
                      ⚠ {fieldErr.email}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label style={{ display:'block', fontSize:'0.72rem', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'0.5rem', fontWeight:600 }}>
                    {loginForm.passwordLabel || 'Password'}
                  </label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', fontSize:'1rem', opacity: form.password ? 1 : 0.5, pointerEvents:'none', zIndex:2 }}>🔒</span>
                    <input
                      id="passField"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => { setForm(f=>({...f,password:e.target.value})); if(fieldErr.password) setFieldErr(fe=>({...fe,password:''})); if(error) setError(''); }}
                      placeholder={loginForm.passwordPlaceholder || 'Masukkan password Anda'}
                      autoComplete="current-password"
                      className="login-field-input"
                      style={{ ...inputBase(!!fieldErr.password), paddingLeft:'2.8rem', paddingRight:'2.8rem' }}
                    />
                    {/* Eye toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPass(s=>!s)}
                      style={{ position:'absolute', right:'0.9rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'0.3rem', display:'flex', alignItems:'center', transition:'color 0.3s', zIndex:3 }}
                      onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'}
                      onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}
                    >
                      {showPass ? <EyeOff /> : <EyeOpen />}
                    </button>
                    <div style={{
                      position:        'absolute',
                      bottom:0, left:0,
                      width:           '100%',
                      height:          '2px',
                      background:      'linear-gradient(to right, var(--gold), var(--gold-light))',
                      transform:       form.password ? 'scaleX(1)' : 'scaleX(0)',
                      transition:      'transform 0.3s ease',
                      transformOrigin: 'left',
                    }} />
                  </div>
                  {fieldErr.password && (
                    <div style={{ fontSize:'0.73rem', color:'#ef4444', marginTop:'0.35rem', display:'flex', alignItems:'center', gap:'0.25rem', animation:'fadeSlideUp 0.2s ease' }}>
                      ⚠ {fieldErr.password}
                    </div>
                  )}
                </div>

                {/* Remember + Forgot */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', userSelect:'none' }}>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={e=>setRemember(e.target.checked)}
                      style={{ accentColor:'var(--gold)', width:'15px', height:'15px', cursor:'pointer' }}
                    />
                    <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{loginForm.rememberLabel || 'Ingat saya'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => showToast(loginForm.forgotPasswordToast || 'Hubungi admin untuk reset password: admin@sultankebab.com', 'Info')}
                    style={{ fontSize:'0.8rem', color:'var(--gold)', background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", padding:0 }}
                    onMouseEnter={e=>e.currentTarget.style.color='var(--gold-light)'}
                    onMouseLeave={e=>e.currentTarget.style.color='var(--gold)'}
                  >
                    {loginForm.forgotPasswordLabel || 'Lupa password?'}
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-shimmer"
                  style={{
                    width:          '100%',
                    padding:        '0.95rem',
                    background:     loading ? 'rgba(201,168,76,0.7)' : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
                    color:          'var(--dark)',
                    fontFamily:     "'DM Sans',sans-serif",
                    fontSize:       '0.82rem',
                    letterSpacing:  '2.5px',
                    textTransform:  'uppercase',
                    fontWeight:     700,
                    border:         'none',
                    cursor:         loading ? 'not-allowed' : 'pointer',
                    position:       'relative',
                    overflow:       'hidden',
                    transition:     'all 0.3s ease',
                    borderRadius:   '2px',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '0.6rem',
                    opacity:        loading ? 0.8 : 1,
                  }}
                >
                  {loading && (
                    <div style={{
                      width:'16px', height:'16px',
                      border:'2px solid rgba(13,10,6,0.3)',
                      borderTop:'2px solid var(--dark)',
                      borderRadius:'50%',
                      animation:'spin 0.7s linear infinite',
                    }} />
                  )}
                  {loading ? (loginForm.loadingLabel || 'Memverifikasi...') : (loginForm.submitLabel || 'Masuk ke Dashboard')}
                </button>

                {/* Divider */}
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', color:'var(--text-muted)', fontSize:'0.75rem', letterSpacing:'1px' }}>
                  <div style={{ flex:1, height:'1px', background:'rgba(201,168,76,0.15)' }} />
                  {loginForm.dividerText || 'atau kembali ke'}
                  <div style={{ flex:1, height:'1px', background:'rgba(201,168,76,0.15)' }} />
                </div>

                {/* Back to landing */}
                <Link
                  href="/"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '0.5rem',
                    fontSize:       '0.8rem',
                    color:          'var(--text-muted)',
                    textDecoration: 'none',
                    transition:     'color 0.3s',
                    padding:        '0.5rem',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.color='var(--gold)';}}
                  onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';}}
                >
                  <ArrowLeft />
                  {loginForm.backLinkLabel || 'Halaman Utama Sultan Kebab'}
                </Link>

              </div>
            </form>
            </>
            ) : (
              <div style={{
                border: '1px solid rgba(201,168,76,0.18)',
                background: 'rgba(13,10,6,0.45)',
                color: 'var(--text-muted)',
                padding: '1.25rem',
                lineHeight: 1.7,
                fontSize: '0.88rem',
              }}>
                Form login sedang dinonaktifkan dari pengaturan.
              </div>
            )}

            {/* ── Footer ── */}
            {footerEnabled && (
            <div style={{
              marginTop:  '2rem',
              textAlign:  'center',
              animation:  mounted ? 'fadeSlideUp 0.8s 0.7s ease forwards' : 'none',
              opacity:    mounted ? undefined : 0,
            }}>
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', lineHeight:1.7 }}>
                {loginFooter.text || '2024 Sultan Kebab. Hak cipta dilindungi.'}<br />
                {loginFooter.version || 'Sistem POS & Admin Panel v2.0'}
              </p>
            </div>
            )}

          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}

