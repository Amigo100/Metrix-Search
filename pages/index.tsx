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

// FeatureCard Component - color updated
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
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white mb-5 shadow-md flex-shrink-0"> {/* COLOR CHANGE */}
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
    avatarSrc: string; // Path to avatar image in /public (e.g., /ortus-avatar-1.jpg) - PNG NAME CHANGE
    rating: number; // 1-5
    delay: string;
}

// TestimonialCard Component updated for local images
const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, title, avatarSrc, rating, delay }) => {
    const ref = useRef<HTMLDivElement>(null);
    const renderStars = () => { /* Star rendering logic - remains yellow */
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
                    className="h-10 w-10 rounded-full mr-3 object-cover bg-gray-200"
                    src={avatarSrc} // Use local path e.g. /ortus-avatar-1.jpg - PNG NAME CHANGE
                    alt={`${name} avatar`}
                    width={40}
                    height={40}
                    onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = '/avatar-placeholder.png'; }} // Fallback image in /public
                 />
                <div> <p className="font-semibold text-gray-900">{name}</p> <p className="text-sm text-gray-500">{title}</p> </div>
            </div>
        </div>
    );
};

// --- Header Component ---
// Updated name, logo, colors, and added Blog/Case Studies links
const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-100">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" legacyBehavior>
            <a className="flex items-center space-x-2 animate-fadeInLeft cursor-pointer">
              <img
                src="/ortus-ihealth-logo.png" // PNG NAME CHANGE
                alt="Ortus-iHealth Logo" // TEXT CHANGE
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-bold text-2xl text-gray-800">Ortus-iHealth</span> {/* TEXT CHANGE */}
            </a>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-7 animate-fadeIn delay-100">
          <Link href="/features" legacyBehavior>
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Features</a> {/* COLOR CHANGE */}
          </Link>
          <Link href="/#benefits" legacyBehavior> {/* UPDATED: Link to benefits section */}
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Benefits</a> {/* TEXT/COLOR CHANGE */}
          </Link>
          {/* ADDED Blog Link */}
          <Link href="/blog" legacyBehavior>
             <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Blog</a> {/* COLOR CHANGE */}
          </Link>
          {/* ADDED Case Studies Link */}
          <Link href="/case-studies" legacyBehavior>
             <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Case Studies</a> {/* COLOR CHANGE */}
          </Link>
          <Link href="/#contact" legacyBehavior>
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Contact</a> {/* COLOR CHANGE */}
          </Link>
          <Link href="/login" legacyBehavior>
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out mr-3">Log In</a> {/* COLOR CHANGE */}
          </Link>
          <Link href="/#contact" legacyBehavior>
            <a className="bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover-lift-strong text-sm hover:from-orange-400 hover:to-orange-600"> Request Demo </a> {/* COLOR CHANGE */}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden animate-fadeIn delay-100">
          <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500" aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen} > {/* COLOR CHANGE */}
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
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Features</a> {/* COLOR CHANGE */}
            </Link>
            <Link href="/#benefits" legacyBehavior> {/* UPDATED: Link to benefits section */}
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Benefits</a> {/* TEXT/COLOR CHANGE */}
            </Link>
            {/* ADDED Blog Link */}
            <Link href="/blog" legacyBehavior>
               <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Blog</a> {/* COLOR CHANGE */}
            </Link>
            {/* ADDED Case Studies Link */}
            <Link href="/case-studies" legacyBehavior>
               <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Case Studies</a> {/* COLOR CHANGE */}
            </Link>
            <Link href="/#contact" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Contact</a> {/* COLOR CHANGE */}
            </Link>
            <Link href="/login" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Log In</a> {/* COLOR CHANGE */}
            </Link>
            <Link href="/#contact" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center mt-2 bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover:from-orange-400 hover:to-orange-600"> Request Demo </a> {/* COLOR CHANGE */}
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
        { name: "NHS Trust A", alt: "NHS Trust A Logo", src: "/images/logos/ortus-logo-placeholder-1.png" }, // PNG NAME CHANGE
        { name: "Clinical Group B", alt: "Clinical Group B Logo", src: "/images/logos/ortus-logo-placeholder-2.png" }, // PNG NAME CHANGE
        { name: "UK University C", alt: "UK University C Logo", src: "/images/logos/ortus-logo-placeholder-3.png" }, // PNG NAME CHANGE
        { name: "Health Partner D", alt: "Health Partner D Logo", src: "/images/logos/ortus-logo-placeholder-4.png" }, // PNG NAME CHANGE
        { name: "Research Inst. E", alt: "Research Institute E Logo", src: "/images/logos/ortus-logo-placeholder-5.png" }, // PNG NAME CHANGE
        { name: "Primary Care F", alt: "Primary Care F Logo", src: "/images/logos/ortus-logo-placeholder-6.png" }, // PNG NAME CHANGE
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
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-600 sm:text-3xl"> Collaborating with innovators in healthcare </h2> {/* TEXT: Kept original generic text */}
                </div>
                <div className="relative logo-scroller w-full overflow-hidden">
                    <div ref={scrollerRef} className="scroller-inner">
                        {logos.map((logo, index) => (
                            <img
                                key={index}
                                src={logo.src} // Use local path - PNG NAME CHANGE
                                alt={logo.alt}
                                width={150}
                                height={40}
                                className="object-contain"
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
// Updated name, logo color, copyright, added Blog/Case Studies
const Footer: React.FC = () => {
    return (
       <footer className="bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 xl:grid-cols-5">
            <div className="col-span-2 md:col-span-4 xl:col-span-1 mb-8 xl:mb-0">
              <div className="flex items-center space-x-2 mb-3">
              {/* Footer Logo SVG - Updated gradient colors to orange */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 60 60" fill="none"> {/* COLOR CHANGE */}
                <defs>
                  <linearGradient id="ortusGrad1F" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} /> {/* orange-400 */}
                    <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 1 }} /> {/* orange-500 */}
                  </linearGradient>
                  <linearGradient id="ortusGrad2F" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} /> {/* orange-500 */}
                    <stop offset="100%" style={{ stopColor: '#ea580c', stopOpacity: 1 }} /> {/* orange-600 */}
                  </linearGradient>
                </defs>
                 {/* Using original SVG shape but with orange gradients */}
                <path d="M20 5 H40 Q45 5 45 10 V50 Q45 55 40 55 H20 Q15 55 15 50 V10 Q15 5 20 5 Z" fill="url(#ortusGrad1F)"/>
                <path d="M5 20 H25 Q30 20 30 25 V35 Q30 40 25 40 H5 Q0 40 0 35 V25 Q0 20 5 20 Z" fill="url(#ortusGrad2F)"/>
                <path d="M35 20 H55 Q60 20 60 25 V35 Q60 40 55 40 H35 Q30 40 30 35 V25 Q30 20 35 20 Z" fill="url(#ortusGrad1F)" transform="translate(-2, 0)" />
              </svg>
                <span className="font-bold text-xl text-white">Ortus-iHealth</span> {/* TEXT CHANGE */}
              </div>
              <p className="text-sm pr-4">The Remote Monitoring & Virtual Ward Platform. Built by clinicians, for clinicians.</p> {/* TEXT CHANGE */}
              {/* Optional: Add Certification Info */}
             <p className="text-xs mt-2 pr-4 text-gray-500">ISO27001 | DCB0129 | Cyber Essentials Plus | MHRA Class I</p>
            </div>
            {/* Footer Links - Use next/link */}
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Platform</h3> <ul className="space-y-3"> <li><Link href="/features" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Features</a></Link></li> <li><Link href="/#benefits" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Benefits</a></Link></li> <li><Link href="/security" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Security</a></Link></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Request Demo</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Company</h3> <ul className="space-y-3"> <li><Link href="/about" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">About Us</a></Link></li> <li><Link href="/blog" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Blog</a></Link></li>{/* ADDED */} <li><Link href="/careers" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Careers</a></Link></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Contact</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Resources</h3> <ul className="space-y-3"> <li><Link href="/docs" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Documentation</a></Link></li> <li><Link href="/case-studies" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Case Studies</a></Link></li>{/* ADDED */} <li><Link href="/privacy" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Privacy Policy</a></Link></li> <li><Link href="/terms" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Terms of Service</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Connect</h3> <ul className="space-y-3"> <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-150 ease-in-out text-sm">LinkedIn</a></li> <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-150 ease-in-out text-sm">Twitter</a></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Contact Sales</a></Link></li> </ul> </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} Ortus-iHealth Ltd. All rights reserved.</p> {/* TEXT CHANGE */}
          </div>
        </div>
      </footer>
    );
};


// --- Landing Page Component (Represents index.tsx) ---
// Updated styles, content, image paths for Ortus-iHealth following original structure
const LandingPage: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Set<Element>>(new Set());
  const intersectionCallback = useCallback((entries: IntersectionObserverEntry[]) => { /* Intersection logic */ entries.forEach(entry => { if (entry.isIntersecting) { const target = entry.target as HTMLElement; if (target.style.animationPlayState !== 'running') { target.style.animationPlayState = 'running'; } } }); }, []);
  useEffect(() => { /* Observer setup and cleanup */ if (!('IntersectionObserver' in window)) { console.log("IntersectionObserver not supported..."); document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn').forEach(el => { (el as HTMLElement).style.animationPlayState = 'running'; }); return; } observerRef.current = new IntersectionObserver(intersectionCallback, { threshold: 0.1 }); const observer = observerRef.current; const elements = document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn'); elements.forEach(el => { if (!(el as HTMLElement).style.animationPlayState || (el as HTMLElement).style.animationPlayState === 'paused') { (el as HTMLElement).style.animationPlayState = 'paused'; } observer.observe(el); observedElementsRef.current.add(el); }); return () => { if (observer) { observedElementsRef.current.forEach(el => observer.unobserve(el)); observer.disconnect(); observedElementsRef.current.clear(); } }; }, [intersectionCallback]);

  return (
    <>
        {/* Global Styles necessary for this page - Updated colors */}
        <style jsx global>{`
            body { font-family: 'Inter', sans-serif; background-color: #fffaf0; /* Light Orange/Cream background */ overflow-x: hidden; } /* COLOR CHANGE */
            .hover-lift-strong:hover { transform: translateY(-6px); box-shadow: 0 15px 25px -5px rgba(249, 115, 22, 0.2), 0 8px 10px -6px rgba(249, 115, 22, 0.2); /* Orange Shadow */ transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out; } /* COLOR CHANGE */
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
            .form-input:focus { outline: none; border-color: #c2410c; /* Orange-700 */ box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3); /* Orange-500 with alpha */ } /* COLOR CHANGE */
            html { scroll-behavior: smooth; }
        `}</style>

      <Header /> {/* Render Header */}

      {/* Hero Section - Updated for Ortus-iHealth */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-orange-50 to-white pt-24 pb-28 sm:pt-32 sm:pb-36 lg:pt-40 lg:pb-48"> {/* COLOR CHANGE */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true"> {/* Background Glow - Orange */} {/* COLOR CHANGE */}
            <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4" width="1200" height="1200" fill="none" viewBox="0 0 1200 1200">
              <circle cx="600" cy="600" r="600" fill="url(#ortusGlow1)" />
              <defs>
                <radialGradient id="ortusGlow1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 600) rotate(90) scale(600)">
                  <stop stopColor="#fb923c"/>{/* orange-400 */}
                  <stop offset="1" stopColor="#f97316" stopOpacity="0"/> {/* orange-500 */}
                </radialGradient>
              </defs>
            </svg>
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-white text-orange-800 shadow-sm mb-5 animate-fadeInUp"> ❤️‍🩹 Built by Clinicians, for Clinicians </span> {/* TEXT/COLOR CHANGE */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter text-gray-900 mb-6 !leading-tight animate-fadeInUp delay-100"> The Remote Monitoring <br className="hidden sm:block"/> & <span className="bg-gradient-to-r from-orange-600 to-orange-400 text-transparent bg-clip-text">Virtual Ward Platform</span>. </h1> {/* TEXT/COLOR CHANGE */}
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-fadeInUp delay-200"> Ortus-iHealth provides intelligent monitoring, dashboards, and integrations to improve outcomes and efficiency. Secure, certified, and designed by healthcare professionals. </p> {/* TEXT CHANGE */}
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-5 animate-fadeInUp delay-300">
                <Link href="/#contact" legacyBehavior>
                  <a className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-3.5 px-8 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-orange-400 hover:to-orange-600"> Request a Demo </a> {/* COLOR CHANGE */}
                </Link>
                <Link href="/#features" legacyBehavior>
                  <a className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-8 rounded-lg transition duration-150 ease-in-out shadow-md border border-gray-200 text-lg hover-lift-subtle"> Explore Features </a>
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-500 animate-fadeInUp delay-400">Improving care for over 13,000 patients.</p> {/* TEXT CHANGE */}
              <div className="mt-20 animate-fadeInUp delay-500">
                <img
                    src="/ortus-ihealth-overview.png" // PNG NAME CHANGE
                    alt="Ortus-iHealth Platform Overview" // TEXT CHANGE
                    width={1000}
                    height={600}
                    className="rounded-xl shadow-2xl mx-auto border border-gray-200 object-cover"
                    style={{boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.25)'}} // Orange Shadow - COLOR CHANGE
                    onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-1000x600.png';}} // Fallback image
                />
              </div>
          </div>
      </section>

      {/* Features Section - Updated for Ortus-iHealth, kept original structure */}
      <section id="features" className="py-20 sm:py-28 lg:py-32 bg-white scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
            <h2 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Ortus-iHealth Capabilities</h2> {/* TEXT/COLOR CHANGE */}
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Your Integrated Virtual Care Hub </p> {/* TEXT CHANGE */}
            <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> A suite of powerful tools designed for effective remote patient monitoring and virtual ward management. </p> {/* TEXT CHANGE */}
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Features minimally adapted from original, rebranded */}
            <FeatureCard delay="delay-100" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> </svg>} title="Flexible Data Collection" description="Capture patient symptoms, questionnaires, and observations via connected devices or manual entry." /> {/* TEXT CHANGE */}
            <FeatureCard delay="delay-200" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /> </svg>} title="Intelligent Dashboard" description="Customisable views with clear RAG status flagging based on configurable clinical thresholds." /> {/* TEXT CHANGE, Different Icon */}
            <FeatureCard delay="delay-300" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01M12 16v-4" /> </svg>} title="In-Platform Actions" description="Review alerts, manage patients, and communicate securely, with a full audit trail for colleagues." /> {/* TEXT CHANGE, Different Icon */}
            <FeatureCard delay="delay-400" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> </svg>} title="Configurable Pathways" description="Set up monitoring protocols, questionnaires, and patient education content specific to conditions." /> {/* TEXT CHANGE, Different Icon */}
            <FeatureCard delay="delay-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /> </svg>} title="Integrated Telehealth" description="Book, launch, and manage virtual appointments directly within the Ortus-iHealth platform." /> {/* TEXT CHANGE, Different Icon */}
            <FeatureCard delay="delay-600" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> </svg>} title="Secure & Integrated" description="Connects with NHS Spine PDS & EHRs. ISO27001, DCB0129, CE+, MHRA Class I certified." /> {/* TEXT CHANGE, Different Icon */}
          </div>
        </div>
      </section>

      {/* Section originally 'On-Site Advantage', now 'Benefits' */}
      <section id="benefits" className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-orange-50 scroll-mt-20"> {/* COLOR CHANGE, ID CHANGE */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                <h3 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Platform Benefits</h3> {/* TEXT/COLOR CHANGE */}
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Enhance Care & Efficiency </h2> {/* TEXT CHANGE */}
                <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto"> Ortus-iHealth delivers tangible improvements for clinical teams, organisations, and patients through secure, intelligent virtual care. </p> {/* TEXT CHANGE */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  <div className="text-center animate-fadeInUp delay-200">
                    <img src="/ortus-diagram-1.png" alt="Improved Clinical Outcomes" width={400} height={300} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-sm object-contain bg-white p-2" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-400x300.png';}}/> {/* PNG NAME CHANGE */}
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Improved Clinical Outcomes </h3> {/* TEXT CHANGE */}
                  <p className="text-gray-600 max-w-md mx-auto"> Proactive monitoring and timely interventions based on real-time data lead to better patient results, as shown in studies.</p> {/* TEXT CHANGE */}
                  </div>
                  <div className="text-center animate-fadeInUp delay-400">
                    <img src="/ortus-diagram-2.png" alt="Organisational Savings" width={400} height={300} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-sm object-contain bg-white p-2" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-400x300.png';}}/> {/* PNG NAME CHANGE */}
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Organisational Savings </h3> {/* TEXT CHANGE */}
                  <p className="text-gray-600 max-w-md mx-auto"> Optimise resource allocation, reduce unnecessary appointments, and manage virtual wards efficiently.</p> {/* TEXT CHANGE */}
                  </div>
              </div>
          </div>
      </section>

      {/* Section originally 'Personalize Notes', now 'Customization' */}
      <section className="py-20 sm:py-28 lg:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                <h3 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Customization</h3> {/* TEXT/COLOR CHANGE */}
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Tailor Ortus-iHealth to Your Workflow </h2> {/* TEXT CHANGE */}
                <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto"> Configure pathways, dashboard alerts, and patient interactions to match your specific clinical context and preferences. </p> {/* TEXT CHANGE */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  <div className="text-center animate-fadeInUp delay-200">
                    <img src="/ortus-ui-1.png" alt="Configurable Dashboard UI" width={500} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-lg bg-white p-4 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-500x350.png';}}/> {/* PNG NAME CHANGE */}
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Customizable Dashboards </h3> {/* TEXT CHANGE */}
                  <p className="text-gray-600 max-w-md mx-auto"> Adjust alert thresholds and dashboard layouts for clear visibility of patient status and priorities.</p> {/* TEXT CHANGE */}
                  </div>
                  <div className="text-center animate-fadeInUp delay-400">
                    <img src="/ortus-ui-2.png" alt="Patient App Questionnaire Example" width={500} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-lg bg-white p-4 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-500x350.png';}}/> {/* PNG NAME CHANGE */}
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Pathway-Specific Content </h3> {/* TEXT CHANGE */}
                  <p className="text-gray-600 max-w-md mx-auto"> Deliver targeted questionnaires and self-management resources through the intuitive patient-facing app.</p> {/* TEXT CHANGE */}
                  </div>
              </div>
          </div>
      </section>

      {/* Testimonials Section - Updated quotes and avatar filenames */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-orange-50 to-white"> {/* COLOR CHANGE */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Clinician & Patient Approved </h2> {/* TEXT CHANGE */}
                <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> High satisfaction and engagement reported by users. </p> {/* TEXT CHANGE */}
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* UPDATED Testimonials for Ortus-iHealth */}
                <TestimonialCard delay="delay-200" quote="The dashboard is clear and the RAG flagging helps us focus. Integration with our existing systems was straightforward." name="Dr. Chen Liu" title="Cardiology Registrar, UK" avatarSrc="/ortus-avatar-1.jpg" rating={5} /> {/* TEXT/PNG NAME CHANGE */}
                <TestimonialCard delay="delay-300" quote="Patients find the app very easy to use for submitting their readings and symptoms. Two-way messaging is a great feature." name="Mrs. Fatima Ahmed" title="Virtual Ward Lead Nurse, UK" avatarSrc="/ortus-avatar-2.jpg" rating={5} /> {/* TEXT/PNG NAME CHANGE */}
                <TestimonialCard delay="delay-400" quote="Ortus-iHealth has streamlined how we manage our remote monitoring pathways, saving valuable clinical time." name="Dr. David Miller" title="Consultant Respiratory Physician, UK" avatarSrc="/ortus-avatar-3.jpg" rating={4} /> {/* TEXT/PNG NAME CHANGE */}
              </div>
          </div>
      </section>

      {/* Trusted By Section */}
      <TrustedBy />

      {/* Contact Form Section - Updated titles */}
      <section id="contact" className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-orange-50 scroll-mt-20"> {/* COLOR CHANGE */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16 animate-fadeInUp">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Connect With Ortus-iHealth </h2> {/* TEXT CHANGE */}
                <p className="mt-5 max-w-xl text-xl text-gray-500 mx-auto"> Interested in a demo or learning how Ortus-iHealth can support your virtual care services? Reach out to our team. </p> {/* TEXT CHANGE */}
              </div>
              <div className="max-w-2xl mx-auto animate-fadeInUp delay-200">
                  <form action="#" method="POST" className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label> <input type="text" name="name" id="name" autoComplete="name" required className="form-input" placeholder="Your Name"/> </div>
                      <div> <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work Email Address</label> <input type="email" name="email" id="email" autoComplete="email" required className="form-input" placeholder="you@organisation.nhs.uk"/> </div>
                      <div> <label htmlFor="organisation" className="block text-sm font-medium text-gray-700 mb-1">Organisation / Trust</label> <input type="text" name="organisation" id="organisation" required className="form-input" placeholder="Your Hospital / Trust / ICB"/> </div>
                      <div> <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label> <input type="text" name="subject" id="subject" required className="form-input" placeholder="Demo Request / Pathway Enquiry / General Question"/> </div>
                      <div> <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label> <textarea id="message" name="message" rows={4} required className="form-input" placeholder="Please let us know how we can help... (e.g., clinical area, number of patients)"></textarea> </div>
                      <div className="text-center">
                        <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-orange-400 hover:to-orange-600"> Send Message </button> {/* COLOR CHANGE */}
                      </div>
                  </form>
              </div>
          </div>
      </section>

      {/* Call to Action Section - Updated colors and text */}
      <section className="bg-gradient-to-r from-orange-800 to-orange-600"> {/* COLOR CHANGE */}
          <div className="max-w-3xl mx-auto text-center py-16 px-4 sm:py-24 sm:px-6 lg:px-8 animate-fadeInUp">
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl tracking-tight"> <span className="block text-white">Ready to Transform Your Virtual Care?</span> </h2> {/* TEXT CHANGE */}
              <p className="mt-6 text-lg leading-7 text-orange-100 max-w-xl mx-auto"> Discover how Ortus-iHealth's secure, clinician-designed platform can enhance efficiency and patient monitoring at your organisation. </p> {/* TEXT/COLOR CHANGE */}
              <Link href="/#contact" legacyBehavior>
                <a className="mt-10 w-full inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-semibold rounded-lg text-orange-700 bg-white hover:bg-gray-100 sm:w-auto shadow-lg transition duration-200 ease-in-out hover-lift-strong"> Request Demo or Information </a> {/* COLOR CHANGE */}
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
