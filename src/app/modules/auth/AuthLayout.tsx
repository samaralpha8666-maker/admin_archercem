import { useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../_metronic/helpers'

const AuthLayout = () => {
  useEffect(() => {
    const root = document.getElementById('root')
    if (root) root.style.height = '100%'
    return () => {
      if (root) root.style.height = 'auto'
    }
  }, [])

  return (
    <div
      className='d-flex flex-column min-vh-100 position-relative overflow-hidden'
      style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}
    >
      {/* ── CSS Keyframe Animations ── */}
      <style>{`
        @keyframes bgZoomPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes floatGlow {
          0% { opacity: 0.4; transform: translateY(0px); }
          50% { opacity: 0.75; transform: translateY(-12px); }
          100% { opacity: 0.4; transform: translateY(0px); }
        }
      `}</style>

      {/* ── Full-Screen Animated Laboratory Balance Background ── */}
      <div
        className='position-absolute top-0 start-0 w-100 h-100'
        style={{
          backgroundImage: `url(${toAbsoluteUrl('media/illustrations/lab_balance.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          animation: 'bgZoomPulse 22s infinite ease-in-out',
          zIndex: 0
        }}
      />

      {/* Gradient Overlay for Crisp Depth & Contrast */}
      <div
        className='position-absolute top-0 start-0 w-100 h-100'
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(224, 242, 254, 0.65) 50%, rgba(243, 232, 255, 0.7) 100%)',
          backdropFilter: 'blur(3px)',
          zIndex: 1
        }}
      />

      {/* Glowing Ambient Spots */}
      <div
        className='position-absolute rounded-circle'
        style={{
          width: '550px',
          height: '550px',
          top: '5%',
          left: '10%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(255,255,255,0) 70%)',
          animation: 'floatGlow 9s infinite ease-in-out',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* ── Main Two-Column Content (Both Left & Right Centered) ── */}
      <div className='container-fluid flex-grow-1 position-relative px-6 py-6 d-flex align-items-center justify-content-center' style={{ zIndex: 3 }}>
        <div className='row w-100 align-items-center justify-content-center g-8 my-auto mx-0' style={{ maxWidth: '1200px' }}>

          {/* ══ LEFT SIDE: Archer Chem Logo & About Us (Centered) ══ */}
          <div className='col-12 col-lg-6 px-4 px-md-6 text-center d-flex flex-column align-items-center justify-content-center gap-5'>
            {/* Archer Chem Logo */}
            <div className='d-flex justify-content-center'>
              <Link to='/'>
                <img
                  alt='Archerchem Logo'
                  src={toAbsoluteUrl('media/logos/archerchem.png')}
                  style={{
                    maxHeight: '80px',
                    width: 'auto',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))'
                  }}
                />
              </Link>
            </div>

            {/* Tagline & Heading */}
            <div className='d-flex flex-column align-items-center text-center'>
              <span className='badge bg-light-primary text-primary px-3 py-2 rounded-pill fs-7 fw-bold mb-3 shadow-sm'>
                ✨ Where innovation never stops...
              </span>
              <h1
                className='fw-extrabold text-dark tracking-tight mb-3'
                style={{ fontSize: '2.5rem', lineHeight: 1.18 }}
              >
                Archerchem Instruments <br />
                <span className='text-primary'>Precision & Analytics</span>
              </h1>
            </div>

            {/* About Us Paragraph */}
            <p className='text-gray-700 fs-5 fw-semibold mb-2 text-center' style={{ maxWidth: '500px', lineHeight: 1.6 }}>
              India’s leading manufacturer and exporter of magnet-based high-precision electronic balances, micro weighing systems, and enterprise analytical lab management software.
            </p>

            {/* Feature Highlights Pills */}
            <div className='d-flex flex-wrap justify-content-center gap-3 mt-2' style={{ maxWidth: '520px' }}>
              <div className='bg-white bg-opacity-80 border border-primary border-opacity-25 px-4 py-2 rounded-pill d-flex align-items-center gap-2 shadow-sm'>
                <span className='fs-5'>🔬</span>
                <span className='fw-bold text-dark fs-7'>0.0001mg Micro Balance</span>
              </div>

              <div className='bg-white bg-opacity-80 border border-success border-opacity-25 px-4 py-2 rounded-pill d-flex align-items-center gap-2 shadow-sm'>
                <span className='fs-5'>⚖️</span>
                <span className='fw-bold text-dark fs-7'>ISO 17025 Certified</span>
              </div>

              <div className='bg-white bg-opacity-80 border border-info border-opacity-25 px-4 py-2 rounded-pill d-flex align-items-center gap-2 shadow-sm'>
                <span className='fs-5'>🛡️</span>
                <span className='fw-bold text-dark fs-7'>Role-Based Access Portal</span>
              </div>
            </div>
          </div>

          {/* ══ RIGHT SIDE: Sleek, Soft Glassmorphic Form Card ══ */}
          <div className='col-12 col-lg-6 d-flex align-items-center justify-content-center px-4 px-md-6'>
            <div
              className='w-100 mw-500px p-8 p-md-9 rounded-4 border bg-white'
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                borderColor: 'rgba(226, 232, 240, 0.9)',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <Outlet />
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <div className='d-flex justify-content-center gap-6 py-4 position-relative' style={{ zIndex: 3 }}>
        <a href='#' className='text-gray-800 text-hover-primary fs-7 fw-bold'>Terms & Conditions</a>
        <a href='#' className='text-gray-800 text-hover-primary fs-7 fw-semibold'>Privacy Policy</a>
        <a href='#' className='text-gray-800 text-hover-primary fs-7 fw-semibold'>Contact Support</a>
      </div>
    </div>
  )
}

export { AuthLayout }