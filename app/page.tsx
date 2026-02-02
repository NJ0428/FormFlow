'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Initialize WOW.js
    if (typeof window !== 'undefined' && (window as any).WOW) {
      new (window as any).WOW().init();
    }
  }, []);

  return (
    <>
      {/* Preloader */}
      <div className="preloader">
        <div className="loader">
          <div className="spinner">
            <div className="spinner-container">
              <div className="spinner-rotator">
                <div className="spinner-left">
                  <div className="spinner-circle"></div>
                </div>
                <div className="spinner-right">
                  <div className="spinner-circle"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section id="home" className="hero-section-wrapper-5">
        {/* Header */}
        <header className="header header-6">
          <div className="navbar-area">
            <div className="container">
              <div className="row align-items-center">
                <div className="col-lg-12">
                  <nav className="navbar navbar-expand-lg">
                    <a className="navbar-brand" href="/">
                      <h1 className="text-2xl font-bold text-purple-600">FormFlow</h1>
                    </a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent6">
                      <span className="toggler-icon"></span>
                      <span className="toggler-icon"></span>
                      <span className="toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse sub-menu-bar" id="navbarSupportedContent6">
                      <ul id="nav6" className="navbar-nav ms-auto">
                        <li className="nav-item">
                          <a className="page-scroll active" href="#home">Home</a>
                        </li>
                        <li className="nav-item">
                          <a className="page-scroll" href="#feature">Feature</a>
                        </li>
                        <li className="nav-item">
                          <a className="page-scroll" href="#about">About</a>
                        </li>
                      </ul>
                    </div>

                    <div className="header-action d-flex">
                      <button onClick={() => router.push('/login')} className="btn btn-sm">로그인</button>
                      <button onClick={() => router.push('/register')} className="btn btn-sm btn-primary">시작하기</button>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="hero-section hero-style-5 img-bg" style={{backgroundImage: "url('/assets/img/hero/hero-5/hero-bg.svg')"}}>
          <div className="container">
            <div className="row">
              <div className="col-lg-6">
                <div className="hero-content-wrapper">
                  <h2 className="mb-30 wow fadeInUp" data-wow-delay=".2s">설문조사를 쉽게 만들어보세요</h2>
                  <p className="mb-30 wow fadeInUp" data-wow-delay=".4s">
                    FormFlow로 직관적이고 강력한 설문조사를 만들고 관리할 수 있습니다.
                    드래그앤드롭으로 쉽게 설문조사를 생성하고, 실시간으로 응답을 분석하세요.
                  </p>
                  <button
                    onClick={() => router.push('/register')}
                    className="button button-lg radius-50 wow fadeInUp"
                    data-wow-delay=".6s"
                  >
                    시작하기 <i className="lni lni-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div className="col-lg-6 align-self-end">
                <div className="hero-image wow fadeInUp" data-wow-delay=".5s">
                  <img src="/assets/img/hero/hero-5/hero-img.svg" alt=""/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="feature" className="feature-section feature-style-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xxl-5 col-xl-5 col-lg-7 col-md-8">
              <div className="section-title text-center mb-60">
                <h3 className="mb-15 wow fadeInUp" data-wow-delay=".2s">주요 기능</h3>
                <p className="wow fadeInUp" data-wow-delay=".4s">
                  FormFlow는 설문조사 생성부터 응답 분석까지 모든 것을 한 곳에서 제공합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".2s">
                <div className="icon">
                  <i className="lni lni-vector"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg>
                </div>
                <div className="content">
                  <h5>쉬운 설문 생성</h5>
                  <p>드래그앤드롭으로 직관적인 설문조사를 쉽게 만들 수 있습니다.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".4s">
                <div className="icon">
                  <i className="lni lni-stats-up"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg>
                </div>
                <div className="content">
                  <h5>실시간 분석</h5>
                  <p>응답을 실시간으로 확인하고 다양한 형태로 분석하세요.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".6s">
                <div className="icon">
                  <i className="lni lni-code-alt"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg>
                </div>
                <div className="content">
                  <h5>다양한 질문 유형</h5>
                  <p>객관식, 주관식, 척도 등 다양한 질문 형식을 지원합니다.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".2s">
                <div className="icon">
                  <i className="lni lni-lock"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg>
                </div>
                <div className="content">
                  <h5>안전한 보관</h5>
                  <p>데이터는 안전하게 저장되며 언제든지 내보낼 수 있습니다.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".4s">
                <div className="icon">
                  <i className="lni lni-pallet"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg>
                </div>
                <div className="content">
                  <h5>테마 커스터마이징</h5>
                  <p>설문조사의 색상과 스타일을 자유롭게 커스터마이징하세요.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".6s">
                <div className="icon">
                  <i className="lni lni-users"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg>
                </div>
                <div className="content">
                  <h5>공유 및 협업</h5>
                  <p>링크로 쉽게 공유하고 팀원들과 협업할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section about-style-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-5 col-lg-6">
              <div className="about-content-wrapper">
                <div className="section-title mb-30">
                  <h3 className="mb-25 wow fadeInUp" data-wow-delay=".2s">설문조사의 미래를 경험하세요</h3>
                  <p className="wow fadeInUp" data-wow-delay=".3s">
                    복잡한 절차 없이 몇 분 만에 전문적인 설문조사를 만들 수 있습니다.
                  </p>
                </div>
                <ul>
                  <li className="wow fadeInUp" data-wow-delay=".35s">
                    <i className="lni lni-checkmark-circle"></i>
                    직관적인 드래그앤드롭 인터페이스
                  </li>
                  <li className="wow fadeInUp" data-wow-delay=".4s">
                    <i className="lni lni-checkmark-circle"></i>
                    실시간 응답 추적 및 분석
                  </li>
                  <li className="wow fadeInUp" data-wow-delay=".45s">
                    <i className="lni lni-checkmark-circle"></i>
                    다양한 내보내기 형식 지원 (Excel, PDF, CSV)
                  </li>
                </ul>
                <button
                  onClick={() => router.push('/register')}
                  className="button button-lg radius-10 wow fadeInUp"
                  data-wow-delay=".5s"
                >
                  지금 시작하기
                </button>
              </div>
            </div>
            <div className="col-xl-7 col-lg-6">
              <div className="about-image text-lg-right wow fadeInUp" data-wow-delay=".5s">
                <img src="/assets/img/about/about-4/about-img.svg" alt=""/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-style-4">
        <div className="container">
          <div className="widget-wrapper">
            <div className="row">
              <div className="col-xl-3 col-lg-4 col-md-6">
                <div className="footer-widget wow fadeInUp" data-wow-delay=".2s">
                  <div className="logo">
                    <a href="/">
                      <h3 className="text-xl font-bold text-purple-600">FormFlow</h3>
                    </a>
                  </div>
                  <p className="desc">
                    설문조사 생성과 분석을 쉽고 빠르게. FormFlow와 함께하세요.
                  </p>
                  <ul className="socials">
                    <li><a href="#0"><i className="lni lni-facebook-filled"></i></a></li>
                    <li><a href="#0"><i className="lni lni-twitter-filled"></i></a></li>
                    <li><a href="#0"><i className="lni lni-instagram-filled"></i></a></li>
                    <li><a href="#0"><i className="lni lni-linkedin-original"></i></a></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-2 offset-xl-1 col-lg-2 col-md-6 col-sm-6">
                <div className="footer-widget wow fadeInUp" data-wow-delay=".3s">
                  <h6>Quick Link</h6>
                  <ul className="links">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#feature">Feature</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                <div className="footer-widget wow fadeInUp" data-wow-delay=".4s">
                  <h6>서비스</h6>
                  <ul className="links">
                    <li><a onClick={() => router.push('/login')}>로그인</a></li>
                    <li><a onClick={() => router.push('/register')}>회원가입</a></li>
                    <li><a onClick={() => router.push('/dashboard')}>대시보드</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="copyright-wrapper wow fadeInUp" data-wow-delay=".2s">
            <p>© 2025 FormFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll Top */}
      <a href="#" className="scroll-top">
        <i className="lni lni-chevron-up"></i>
      </a>
    </>
  );
}
