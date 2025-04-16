import React, { useState, useEffect, useRef, PropsWithChildren, useCallback } from 'react';
import Link from 'next/link'; // Import Next.js Link component

// Helper function for class names (optional, but common)
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// --- Reusable Components ---

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string; // e.g., 'delay-100'
}

// FeatureCard Component remains the same structurally
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={classNames(
        'flex flex-col items-center text-center p-8 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 hover-lift-strong animate-fadeInUp h-full',
        delay
      )}
    >
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white mb-5 shadow-md flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-base text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};


interface TestimonialCardProps {
    quote: string;
    name: string;
    title: string;
    avatarSrc: string; // Path to avatar image in /public
    rating: number; // 1-5
    delay: string;
}

// TestimonialCard Component updated for local images
const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, title, avatarSrc, rating, delay }) => {
    const ref = useRef<HTMLDivElement>(null);
    const renderStars = () => { /* Star rendering logic */
        const stars = [];
        for (let i = 1; i <= 5; i++) { stars.push( <svg key={i} className={classNames( 'w-5 h-5 fill-current', i <= rating ? 'text-yellow-400' : 'text-gray-300' )} viewBox="0 0 20 20" > <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/> </svg> ); }
        return stars;
    };
    return (
        <div ref={ref} className={classNames("testimonial-card animate-fadeInUp h-full flex flex-col", delay)}>
            <div className="flex items-center mb-4"> <div className="text-yellow-400 flex space-x-1"> {renderStars()} </div> </div>
            <blockquote className="text-gray-600 italic mb-4 flex-grow"> "{quote}" </blockquote>
            <div className="flex items-center mt-auto">
                <img
                    className="h-10 w-10 rounded-full mr-3 object-cover bg-gray-200" // Added object-cover and bg-gray-200 fallback
                    src={avatarSrc} // Use local path
                    alt={`${name} avatar`}
                    width={40} // Add width
                    height={40} // Add height
                    onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = '/avatar-placeholder.png'; }} // Fallback image in /public/images
                 />
                <div> <p className="font-semibold text-gray-900">{name}</p> <p className="text-sm text-gray-500">{title}</p> </div>
            </div>
        </div>
    );
};

// --- Header Component ---
// Updated to use next/link for Login and Features pages
const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-100">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" legacyBehavior>
            <a className="flex items-center space-x-2 animate-fadeInLeft cursor-pointer">
              <img
                src="/MetrixAI.png" // Or metrix-logo.svg
                alt="Metrix Logo"
                width={32} // Corresponds to h-8 w-8
                height={32} // Corresponds to h-8 w-8
                className="h-8 w-8" // Keep size consistent
              />
              <span className="font-bold text-2xl text-gray-800">Metrix</span>
            </a>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-7 animate-fadeIn delay-100">
          {/* Use next/link for page navigation */}
          <Link href="/features" legacyBehavior>
            <a className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out">Features</a>
          </Link>
          <Link href="/#on-site" legacyBehavior>
             <a className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out">On-Site Advantage</a>
          </Link>
          <Link href="/#contact" legacyBehavior>
            <a className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out">Contact</a>
          </Link>
          <Link href="/login" legacyBehavior>
            <a className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out mr-3">Log In</a>
          </Link>
          <Link href="/#contact" legacyBehavior>
            <a className="bg-gradient-to-r from-teal-600 to-teal-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover-lift-strong text-sm hover:from-teal-400 hover:to-teal-600"> Request Demo </a>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden animate-fadeIn delay-100">
          <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500" aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen} >
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" strokeWidth="2"> {isMobileMenuOpen ? ( <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> ) : ( <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /> )} </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu (Collapsible) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-40" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/features" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50">Features</a>
            </Link>
            <Link href="/#on-site" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50">On-Site Advantage</a>
            </Link>
            <Link href="/#contact" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50">Contact</a>
            </Link>
            <Link href="/login" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50">Log In</a>
            </Link>
            <Link href="/#contact" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center mt-2 bg-gradient-to-r from-teal-600 to-teal-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover:from-teal-400 hover:to-teal-600"> Request Demo </a>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};


// --- Trusted By Component (with Scroller Logic) ---
const TrustedBy: React.FC = () => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    // Placeholder logos referencing /public/images/logos/
    const logos = [
        { name: "NHS Trust A", alt: "NHS Trust A Logo", src: "/images/logos/logo-placeholder-1.png" },
        { name: "Clinical Group B", alt: "Clinical Group B Logo", src: "/images/logos/logo-placeholder-2.png" },
        { name: "UK University C", alt: "UK University C Logo", src: "/images/logos/logo-placeholder-3.png" },
        { name: "NZ DHB D", alt: "NZ DHB D Logo", src: "/images/logos/logo-placeholder-4.png" },
        { name: "Research Inst. E", alt: "Research Institute E Logo", src: "/images/logos/logo-placeholder-5.png" },
        { name: "Primary Care F", alt: "Primary Care F Logo", src: "/images/logos/logo-placeholder-6.png" },
    ];

    useEffect(() => { /* Logo cloning effect */
        const scrollerInner = scrollerRef.current;
        if (scrollerInner && scrollerInner.children.length === logos.length) {
            logos.forEach((logo, index) => {
                const imgElement = scrollerInner.children[index] as HTMLImageElement;
                if (imgElement) { const clone = imgElement.cloneNode(true) as HTMLImageElement; clone.setAttribute('aria-hidden', 'true'); scrollerInner.appendChild(clone); }
            });
        }
    }, [logos]); // Use logos array as dependency

    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16 animate-fadeInUp">
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-600 sm:text-3xl"> Collaborating with innovators in healthcare </h2>
                </div>
                <div className="relative logo-scroller w-full overflow-hidden">
                    <div ref={scrollerRef} className="scroller-inner">
                        {logos.map((logo, index) => (
                            <img
                                key={index}
                                src={logo.src} // Use local path
                                alt={logo.alt}
                                width={150} // Specify width
                                height={40} // Specify height
                                className="object-contain" // Ensure logo scales nicely
                                onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = '/images/logos/logo-placeholder-error.png'; }} // Fallback image
                            />
                        ))}
                        {/* Cloned logos are appended here by useEffect */}
                    </div>
                    {/* Edge fades */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                </div>
            </div>
        </section>
    );
};

// --- Footer Component ---
const Footer: React.FC = () => {
    return (
       <footer className="bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 xl:grid-cols-5">
            <div className="col-span-2 md:col-span-4 xl:col-span-1 mb-8 xl:mb-0">
              <div className="flex items-center space-x-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 60 60" fill="none"> {/* Footer Logo */} <defs> <linearGradient id="reactGrad1F" x1="0%" y1="0%" x2="100%" y2="100%"> <stop offset="0%" style={{ stopColor: '#5fc2b1', stopOpacity: 1 }} /> <stop offset="100%" style={{ stopColor: '#3b9a9c', stopOpacity: 1 }} /> </linearGradient> <linearGradient id="reactGrad2F" x1="100%" y1="0%" x2="0%" y2="100%"> <stop offset="0%" style={{ stopColor: '#3b9a9c', stopOpacity: 1 }} /> <stop offset="100%" style={{ stopColor: '#1e6b6b', stopOpacity: 1 }} /> </linearGradient> </defs> <path d="M20 5 H40 Q45 5 45 10 V50 Q45 55 40 55 H20 Q15 55 15 50 V10 Q15 5 20 5 Z" fill="url(#reactGrad1F)"/> <path d="M5 20 H25 Q30 20 30 25 V35 Q30 40 25 40 H5 Q0 40 0 35 V25 Q0 20 5 20 Z" fill="url(#reactGrad2F)"/> <path d="M35 20 H55 Q60 20 60 25 V35 Q60 40 55 40 H35 Q30 40 30 35 V25 Q30 20 35 20 Z" fill="url(#reactGrad1F)" transform="translate(-2, 0)" /> </svg>
                <span className="font-bold text-xl text-white">Metrix</span>
              </div>
              <p className="text-sm pr-4">The On-Site Clinical Assistant Platform. Built by clinicians, for clinicians.</p>
            </div>
            {/* Footer Links - Use next/link */}
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Platform</h3> <ul className="space-y-3"> <li><Link href="/features" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Features</a></Link></li> <li><Link href="/#on-site" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">On-Site Advantage</a></Link></li> <li><Link href="/security" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Security</a></Link></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Request Demo</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Company</h3> <ul className="space-y-3"> <li><Link href="/about" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">About Us</a></Link></li> <li><Link href="/blog" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Blog</a></Link></li> <li><Link href="/careers" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Careers</a></Link></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Contact</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Resources</h3> <ul className="space-y-3"> <li><Link href="/docs" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Documentation</a></Link></li> <li><Link href="/case-studies" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Case Studies</a></Link></li> <li><Link href="/privacy" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Privacy Policy</a></Link></li> <li><Link href="/terms" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Terms of Service</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Connect</h3> <ul className="space-y-3"> <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-150 ease-in-out text-sm">LinkedIn</a></li> <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-150 ease-in-out text-sm">Twitter</a></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Contact Sales</a></Link></li> </ul> </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} Metrix Health Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
};


// --- Landing Page Component (Represents index.tsx) ---
const LandingPage: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Set<Element>>(new Set());
  const intersectionCallback = useCallback((entries: IntersectionObserverEntry[]) => { /* Intersection logic */ entries.forEach(entry => { if (entry.isIntersecting) { const target = entry.target as HTMLElement; if (target.style.animationPlayState !== 'running') { target.style.animationPlayState = 'running'; } } }); }, []);
  useEffect(() => { /* Observer setup and cleanup */ if (!('IntersectionObserver' in window)) { console.log("IntersectionObserver not supported..."); document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn').forEach(el => { (el as HTMLElement).style.animationPlayState = 'running'; }); return; } observerRef.current = new IntersectionObserver(intersectionCallback, { threshold: 0.1 }); const observer = observerRef.current; const elements = document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn'); elements.forEach(el => { if (!(el as HTMLElement).style.animationPlayState || (el as HTMLElement).style.animationPlayState === 'paused') { (el as HTMLElement).style.animationPlayState = 'paused'; } observer.observe(el); observedElementsRef.current.add(el); }); return () => { if (observer) { observedElementsRef.current.forEach(el => observer.unobserve(el)); observer.disconnect(); observedElementsRef.current.clear(); } }; }, [intersectionCallback]);

  return (
    <>
        {/* Global Styles necessary for this page */}
        <style jsx global>{`
            body { font-family: 'Inter', sans-serif; background-color: #f7fdfd; overflow-x: hidden; }
            .hover-lift-strong:hover { transform: translateY(-6px); box-shadow: 0 15px 25px -5px rgba(59, 154, 156, 0.2), 0 8px 10px -6px rgba(59, 154, 156, 0.2); transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out; }
            .hover-lift-subtle:hover { transform: translateY(-3px); box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.07); transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
            .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out forwards; opacity: 0; }
            .animate-fadeIn { animation: fadeIn 1s ease-out forwards; opacity: 0; }
            .delay-100 { animation-delay: 0.1s; } .delay-200 { animation-delay: 0.2s; } .delay-300 { animation-delay: 0.3s; } .delay-400 { animation-delay: 0.4s; } .delay-500 { animation-delay: 0.5s; } .delay-600 { animation-delay: 0.6s; } .delay-700 { animation-delay: 0.7s; }
            @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .logo-scroller .scroller-inner { display: flex; flex-wrap: nowrap; width: fit-content; animation: scroll-left 40s linear infinite; }
            .logo-scroller:hover .scroller-inner { animation-play-state: paused; }
            .logo-scroller img { height: 40px; margin: 0 2rem; filter: grayscale(100%); opacity: 0.7; transition: filter 0.3s ease, opacity 0.3s ease; }
            .logo-scroller img:hover { filter: grayscale(0%); opacity: 1; }
            .testimonial-card { background-color: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); display: flex; flex-direction: column; }
            .form-input { width: 100%; border-radius: 0.5rem; border: 1px solid #d1d5db; padding: 0.75rem 1rem; transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
            .form-input:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 2px rgba(59, 154, 156, 0.3); }
            html { scroll-behavior: smooth; }
        `}</style>

      <Header /> {/* Render Header */}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-teal-50 to-white pt-24 pb-28 sm:pt-32 sm:pb-36 lg:pt-40 lg:pb-48">
          <div className="absolute inset-0 opacity-10" aria-hidden="true"> {/* Background Glow */} <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4" width="1200" height="1200" fill="none" viewBox="0 0 1200 1200"> <circle cx="600" cy="600" r="600" fill="url(#reactGlow1)" /> <defs><radialGradient id="reactGlow1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 600) rotate(90) scale(600)"><stop stopColor="#2dd4bf"/><stop offset="1" stopColor="#0d9488" stopOpacity="0"/></radialGradient></defs> </svg> </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-white text-teal-800 shadow-sm mb-5 animate-fadeInUp"> 🚀 Built by Clinicians, for Clinicians </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter text-gray-900 mb-6 !leading-tight animate-fadeInUp delay-100"> The On-Site Clinical <br className="hidden sm:block"/> <span className="bg-gradient-to-r from-teal-600 to-teal-400 text-transparent bg-clip-text">Assistant Platform</span>. </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-fadeInUp delay-200"> Metrix integrates AI Scribe, Clinical Chat, Calculators, Semantic Search & Predictive Insights into a secure, locally-run platform. Enhance efficiency and decision-making without compromising data security. Developed by UK/NZ doctors. </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-5 animate-fadeInUp delay-300">
                <Link href="/#contact" legacyBehavior>
                  <a className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-teal-800 text-white font-semibold py-3.5 px-8 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-teal-400 hover:to-teal-600"> Request a Demo </a>
                </Link>
                <Link href="/#features" legacyBehavior>
                  <a className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-8 rounded-lg transition duration-150 ease-in-out shadow-md border border-gray-200 text-lg hover-lift-subtle"> Explore Features </a>
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-500 animate-fadeInUp delay-400">Seeking Seed Funding & Pilot Partners.</p>
              <div className="mt-20 animate-fadeInUp delay-500">
                <img
                    src="/metrix-overview.png" // Local image path
                    alt="Metrix Platform Overview"
                    width={1000} // Specify width
                    height={600} // Specify height
                    className="rounded-xl shadow-2xl mx-auto border border-gray-200 object-cover" // Added object-cover
                    style={{boxShadow: '0 25px 50px -12px rgba(59, 154, 156, 0.25)'}}
                    onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-1000x600.png';}} // Fallback image
                />
              </div>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 lg:py-32 bg-white scroll-mt-20"> {/* Added scroll-mt */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20 animate-fadeInUp"> <h2 className="text-sm font-semibold text-teal-600 tracking-wide uppercase">Metrix Capabilities</h2> <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Your Integrated Clinical Co-Pilot </p> <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> A suite of powerful tools designed to augment clinical workflow and decision support, running securely on-site. </p> </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard delay="delay-100" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> </svg>} title="AI Clinical Scribe" description="Real-time, accurate documentation generated from patient conversations, customizable to your style." />
            <FeatureCard delay="delay-200" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> </svg>} title="Clinical Chatbot" description="Access clinical knowledge, differential diagnoses, and summaries instantly (similar to Glass Health)." />
            <FeatureCard delay="delay-300" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M9 11h.01M12 11h.01M15 11h.01M12 4v1m0 18v-1m4-14h1m-19 0h1m17 4v1m0 4v1m0 4v1m-1 4h-1m-4-1h-1m-4-1h-1m-4-1h-1m19-4h-1m-4-1h-1m-4-1h-1m-4-1h-1M4 12v-1m0-4V7m0-4V3m4 18v-1m4-1v-1m4-1v-1m4-1v-1" /> </svg>} title="Clinical Calculator" description="Integrated scoring systems and calculators at your fingertips (like MDCalc)." />
            <FeatureCard delay="delay-400" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18" /> </svg>} title="Semantic Guideline Search" description="Instantly search local trust guidelines and policy documents using natural language queries." />
            <FeatureCard delay="delay-500" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> </svg>} title="Predictive Insights (ED)" description="ML models trained on 160k ED visits predict wait times and admission likelihood." />
            <FeatureCard delay="delay-600" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> </svg>} title="Secure On-Site Operation" description="Runs entirely within your local network, ensuring patient data never leaves your control." />
          </div>
        </div>
      </section>

      {/* Workflow Streamlining Section */}
      <section id="on-site" className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-teal-50 scroll-mt-20"> {/* Added scroll-mt */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp"> <h3 className="text-sm font-semibold text-teal-600 tracking-wide uppercase">The On-Site Advantage</h3> <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Intelligence Where You Need It </h2> <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto"> Metrix operates entirely on your local infrastructure. No cloud dependency means enhanced speed, reliability, and unparalleled data security for sensitive patient information. </p> </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  <div className="text-center animate-fadeInUp delay-200">
                    <img src="/local-network.png" alt="Local Network Security" width={400} height={300} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-sm object-cover" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-400x300.png';}}/>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Maximum Data Security </h3> <p className="text-gray-600 max-w-md mx-auto"> Patient data is processed and stored locally, meeting stringent privacy regulations and eliminating cloud-related risks. </p>
                  </div>
                  <div className="text-center animate-fadeInUp delay-400">
                    <img src="/offline-capability.png" alt="Offline capability graphic" width={400} height={300} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-sm object-cover" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-400x300.png';}}/>
                     <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Uninterrupted Performance </h3> <p className="text-gray-600 max-w-md mx-auto"> Network outages won't disrupt your workflow. Metrix continues to operate reliably within your local environment. </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Personalize Notes Section */}
      <section className="py-20 sm:py-28 lg:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp"> <h3 className="text-sm font-semibold text-teal-600 tracking-wide uppercase">Customization</h3> <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Tailor Metrix to Your Needs </h2> <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto"> Configure scribe outputs, chatbot knowledge sources, and predictive models to match your specific clinical context and preferences. </p> </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  <div className="text-center animate-fadeInUp delay-200">
                    <img src="/scribe-settings-ui.png" alt="UI showing scribe settings" width={500} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-lg bg-white p-4 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-500x350.png';}}/>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Customizable Scribe </h3> <p className="text-gray-600 max-w-md mx-auto"> Adjust templates, acronym expansions, and formatting rules for notes that fit your documentation style. </p>
                  </div>
                  <div className="text-center animate-fadeInUp delay-400">
                    <img src="/chatbot-knowledge-ui.png" alt="UI showing chatbot knowledge source selection" width={500} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-lg bg-white p-4 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-500x350.png';}}/>
                     <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Configurable Knowledge </h3> <p className="text-gray-600 max-w-md mx-auto"> Point the chatbot and semantic search towards your specific local guidelines, formularies, and protocols. </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-teal-50 to-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp"> <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Clinician Approved </h2> <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> Hear from early adopters and collaborators. </p> </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <TestimonialCard delay="delay-200" quote="Metrix's on-site model was crucial for us. The AI scribe is excellent, and having integrated calculators and guideline search saves significant time during busy shifts." name="Dr. Aisha Khan" title="Emergency Medicine Consultant, UK" avatarSrc="/avatar-1.jpg" rating={5} />
                  <TestimonialCard delay="delay-300" quote="The predictive insights for ED wait times have been surprisingly accurate, helping us manage patient flow more effectively. The chatbot is great for quick lookups." name="Mr. David Chen" title="Hospital Operations Manager, NZ" avatarSrc="/avatar-2.jpg" rating={4} />
                  <TestimonialCard delay="delay-400" quote="As clinicians ourselves, the Metrix team understands the nuances of our workflow. The ability to search local guidelines securely is a feature we've needed for years." name="Dr. Olivia Wells" title="General Practitioner, UK" avatarSrc="/avatar-3.jpg" rating={5} />
              </div>
          </div>
      </section>

      {/* Trusted By Section */}
      <TrustedBy />

      {/* Contact Form Section */}
      <section id="contact" className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-teal-50 scroll-mt-20"> {/* Added scroll-mt */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16 animate-fadeInUp"> <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Connect With Metrix </h2> <p className="mt-5 max-w-xl text-xl text-gray-500 mx-auto"> Interested in a demo, pilot program, or investment opportunities? Reach out to our team. </p> </div>
              <div className="max-w-2xl mx-auto animate-fadeInUp delay-200">
                  <form action="#" method="POST" className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label> <input type="text" name="name" id="name" autoComplete="name" required className="form-input" placeholder="Your Name"/> </div>
                      <div> <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work Email Address</label> <input type="email" name="email" id="email" autoComplete="email" required className="form-input" placeholder="you@hospital.org"/> </div>
                      <div> <label htmlFor="organisation" className="block text-sm font-medium text-gray-700 mb-1">Organisation</label> <input type="text" name="organisation" id="organisation" required className="form-input" placeholder="Your Hospital / Clinic"/> </div>
                      <div> <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label> <input type="text" name="subject" id="subject" required className="form-input" placeholder="Demo Request / Investment Inquiry / Pilot Program"/> </div>
                      <div> <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label> <textarea id="message" name="message" rows={4} required className="form-input" placeholder="Please provide some details about your interest..."></textarea> </div>
                      <div className="text-center"> <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-teal-800 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-teal-400 hover:to-teal-600"> Send Message </button> </div>
                  </form>
              </div>
          </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-teal-800 to-teal-600">
          <div className="max-w-3xl mx-auto text-center py-16 px-4 sm:py-24 sm:px-6 lg:px-8 animate-fadeInUp">
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl tracking-tight"> <span className="block text-white">Ready to Transform Your Clinical Workflow?</span> </h2>
              <p className="mt-6 text-lg leading-7 text-teal-100 max-w-xl mx-auto"> Discover how Metrix's secure, on-site platform can enhance efficiency and clinical decision support at your organisation. </p>
              <Link href="/#contact" legacyBehavior>
                <a className="mt-10 w-full inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-semibold rounded-lg text-teal-700 bg-white hover:bg-gray-100 sm:w-auto shadow-lg transition duration-200 ease-in-out hover-lift-strong"> Request Demo or Information </a>
              </Link>
          </div>
      </section>

      {/* Footer Section */}
      <Footer /> {/* Render Footer */}
    </>
  );
};

// Default export for index.tsx
export default LandingPage;

