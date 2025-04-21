import React, { useState, useEffect, useRef, PropsWithChildren, useCallback } from 'react'; // MOVED BACK TO TOP
import Link from 'next/link'; // Import Next.js Link component

// Helper function for class names (optional, but common)
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' '); // CORRECTED BODY
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
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white mb-5 shadow-md flex-shrink-0">
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
    avatarSrc: string; // Path to avatar image in /public (e.g., /ortus-avatar-1.jpg)
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
                    src={avatarSrc} // Use local path e.g., /ortus-avatar-1.jpg
                    alt={`${name} avatar`}
                    width={40} // Add width
                    height={40} // Add height
                    onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = '/avatar-placeholder.png'; }} // Fallback image in /public
                 />
                <div> <p className="font-semibold text-gray-900">{name}</p> <p className="text-sm text-gray-500">{title}</p> </div>
            </div>
        </div>
    );
};

// --- Header Component ---
// Updated to use next/link, Ortus-iHealth name, logo, and orange theme
const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-100">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" legacyBehavior>
            <a className="flex items-center space-x-2 animate-fadeInLeft cursor-pointer">
              <img
                src="/ortus-ihealth-logo.png" // UPDATED: Use Ortus-iHealth logo PNG
                alt="Ortus-iHealth Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-bold text-2xl text-gray-800">Ortus-iHealth</span>
            </a>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-7 animate-fadeIn delay-100">
          <Link href="/features" legacyBehavior>
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Features</a>
          </Link>
          {/* Maybe link to a 'Benefits' or 'How it Works' section instead of 'On-Site' */}
          <Link href="/#benefits" legacyBehavior>
             <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Benefits</a>
          </Link>
          <Link href="/#contact" legacyBehavior>
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Contact</a>
          </Link>
          <Link href="/login" legacyBehavior>
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out mr-3">Log In</a>
          </Link>
          <Link href="/#contact" legacyBehavior>
            <a className="bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover-lift-strong text-sm hover:from-orange-400 hover:to-orange-600"> Request Demo </a>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden animate-fadeIn delay-100">
          <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500" aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen} >
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
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Features</a>
            </Link>
            <Link href="/#benefits" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Benefits</a>
            </Link>
            <Link href="/#contact" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Contact</a>
            </Link>
            <Link href="/login" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Log In</a>
            </Link>
            <Link href="/#contact" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center mt-2 bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover:from-orange-400 hover:to-orange-600"> Request Demo </a>
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
        { name: "NHS Trust A", alt: "NHS Trust A Logo", src: "/images/logos/ortus-logo-placeholder-1.png" }, // UPDATED filename
        { name: "Clinical Group B", alt: "Clinical Group B Logo", src: "/images/logos/ortus-logo-placeholder-2.png" }, // UPDATED filename
        { name: "St Barts Heart Centre", alt: "St Barts Heart Centre Logo", src: "/images/logos/ortus-logo-placeholder-3.png" }, // UPDATED filename and example
        { name: "UK Health Partnership D", alt: "UK Health Partnership D Logo", src: "/images/logos/ortus-logo-placeholder-4.png" }, // UPDATED filename
        { name: "Research Partner E", alt: "Research Partner E Logo", src: "/images/logos/ortus-logo-placeholder-5.png" }, // UPDATED filename
        { name: "Primary Care Network F", alt: "Primary Care Network F Logo", src: "/images/logos/ortus-logo-placeholder-6.png" }, // UPDATED filename
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
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-600 sm:text-3xl"> Trusted by healthcare leaders across the UK </h2>
                </div>
                <div className="relative logo-scroller w-full overflow-hidden">
                    <div ref={scrollerRef} className="scroller-inner">
                        {logos.map((logo, index) => (
                            <img
                                key={index}
                                src={logo.src} // Use local path e.g., /images/logos/ortus-logo-placeholder-1.png
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
// Updated name, description, logo color, copyright
const Footer: React.FC = () => {
    return (
       <footer className="bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 xl:grid-cols-5">
            <div className="col-span-2 md:col-span-4 xl:col-span-1 mb-8 xl:mb-0">
              <div className="flex items-center space-x-2 mb-3">
                {/* Footer Logo SVG - Updated gradient colors to orange */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 60 60" fill="none">
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
                {/* You might want a different SVG shape for Ortus-iHealth, but keeping structure for now */}
                <path d="M20 5 H40 Q45 5 45 10 V50 Q45 55 40 55 H20 Q15 55 15 50 V10 Q15 5 20 5 Z" fill="url(#ortusGrad1F)"/>
                <path d="M5 20 H25 Q30 20 30 25 V35 Q30 40 25 40 H5 Q0 40 0 35 V25 Q0 20 5 20 Z" fill="url(#ortusGrad2F)"/>
                <path d="M35 20 H55 Q60 20 60 25 V35 Q60 40 55 40 H35 Q30 40 30 35 V25 Q30 20 35 20 Z" fill="url(#ortusGrad1F)" transform="translate(-2, 0)" />
              </svg>
                <span className="font-bold text-xl text-white">Ortus-iHealth</span>
              </div>
              <p className="text-sm pr-4">The Remote Monitoring & Virtual Ward Platform. Built by clinicians, for clinicians.</p>
              <p className="text-xs mt-2 pr-4">Improving outcomes through intelligent monitoring.</p>
            </div>
            {/* Footer Links - Use next/link - Review if these paths are still correct for Ortus-iHealth */}
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Platform</h3> <ul className="space-y-3"> <li><Link href="/features" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Features</a></Link></li> <li><Link href="/#benefits" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Benefits</a></Link></li> <li><Link href="/security-compliance" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Security & Compliance</a></Link></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Request Demo</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Company</h3> <ul className="space-y-3"> <li><Link href="/about" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">About Us</a></Link></li> <li><Link href="/blog" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Blog/News</a></Link></li> <li><Link href="/careers" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Careers</a></Link></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Contact</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Resources</h3> <ul className="space-y-3"> <li><Link href="/documentation" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Documentation</a></Link></li> <li><Link href="/case-studies" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Case Studies</a></Link></li> <li><Link href="/privacy" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Privacy Policy</a></Link></li> <li><Link href="/terms" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Terms of Service</a></Link></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Connect</h3> <ul className="space-y-3"> <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-150 ease-in-out text-sm">LinkedIn</a></li> <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-150 ease-in-out text-sm">Twitter</a></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Contact Sales</a></Link></li> </ul> </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} Ortus-iHealth Ltd. All rights reserved.</p> {/* UPDATED Company Name */}
            {/* Optional: Add Certification Info */}
            <p className="text-xs mt-2 text-gray-500">ISO27001 | DCB0129 | Cyber Essentials Plus | MHRA Class I</p>
          </div>
        </div>
      </footer>
    );
};


// --- Landing Page Component (Represents index.tsx) ---
// Updated styles, content, image paths for Ortus-iHealth
const LandingPage: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Set<Element>>(new Set());
  const intersectionCallback = useCallback((entries: IntersectionObserverEntry[]) => { /* Intersection logic */ entries.forEach(entry => { if (entry.isIntersecting) { const target = entry.target as HTMLElement; if (target.style.animationPlayState !== 'running') { target.style.animationPlayState = 'running'; } } }); }, []);
  useEffect(() => { /* Observer setup and cleanup */ if (!('IntersectionObserver' in window)) { console.log("IntersectionObserver not supported..."); document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn').forEach(el => { (el as HTMLElement).style.animationPlayState = 'running'; }); return; } observerRef.current = new IntersectionObserver(intersectionCallback, { threshold: 0.1 }); const observer = observerRef.current; const elements = document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn'); elements.forEach(el => { if (!(el as HTMLElement).style.animationPlayState || (el as HTMLElement).style.animationPlayState === 'paused') { (el as HTMLElement).style.animationPlayState = 'paused'; } observer.observe(el); observedElementsRef.current.add(el); }); return () => { if (observer) { observedElementsRef.current.forEach(el => observer.unobserve(el)); observer.disconnect(); observedElementsRef.current.clear(); } }; }, [intersectionCallback]);

  return (
    <>
        {/* Global Styles necessary for this page - Updated colors */}
        <style jsx global>{`
            body { font-family: 'Inter', sans-serif; background-color: #ffffff; /* White background */ overflow-x: hidden; }
            .hover-lift-strong:hover { transform: translateY(-6px); box-shadow: 0 15px 25px -5px rgba(249, 115, 22, 0.2), 0 8px 10px -6px rgba(249, 115, 22, 0.2); /* Orange Shadow */ transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out; }
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
            .form-input:focus { outline: none; border-color: #c2410c; /* Orange-700 */ box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3); /* Orange-500 with alpha */ }
            html { scroll-behavior: smooth; }
        `}</style>

      <Header /> {/* Render Header */}

      {/* Hero Section - Updated for Ortus-iHealth */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-orange-50 to-white pt-24 pb-28 sm:pt-32 sm:pb-36 lg:pt-40 lg:pb-48">
          <div className="absolute inset-0 opacity-10" aria-hidden="true"> {/* Background Glow - Orange */}
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
              <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-white text-orange-800 shadow-sm mb-5 animate-fadeInUp"> ❤️‍🩹 Designed by a Consultant Cardiologist </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter text-gray-900 mb-6 !leading-tight animate-fadeInUp delay-100"> Intelligent Remote Monitoring <br className="hidden sm:block"/> & <span className="bg-gradient-to-r from-orange-600 to-orange-400 text-transparent bg-clip-text">Virtual Ward Platform</span>. </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-fadeInUp delay-200"> Ortus-iHealth captures qualitative & quantitative data, flags risks on custom dashboards, enables in-platform actions, and integrates seamlessly with EHRs. Improve outcomes, save resources, and enhance patient satisfaction. </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-5 animate-fadeInUp delay-300">
                <Link href="/#contact" legacyBehavior>
                  <a className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-3.5 px-8 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-orange-400 hover:to-orange-600"> Request a Demo </a>
                </Link>
                <Link href="/#features" legacyBehavior>
                  <a className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-8 rounded-lg transition duration-150 ease-in-out shadow-md border border-gray-200 text-lg hover-lift-subtle"> Explore Features </a>
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-500 animate-fadeInUp delay-400">Monitoring over 13,000 patients | Proven clinical & organisational savings.</p>
              <div className="mt-20 animate-fadeInUp delay-500">
                <img
                    src="/ortus-ihealth-overview.png" // UPDATED: Main platform overview image
                    alt="Ortus-iHealth Platform Overview"
                    width={1000} // Specify width
                    height={600} // Specify height
                    className="rounded-xl shadow-2xl mx-auto border border-gray-200 object-cover"
                    style={{boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.25)'}} // Orange Shadow
                    onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-1000x600.png';}} // Fallback image
                />
              </div>
          </div>
      </section>

      {/* Features Section - Updated for Ortus-iHealth */}
      <section id="features" className="py-20 sm:py-28 lg:py-32 bg-white scroll-mt-20"> {/* Added scroll-mt */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
            <h2 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Ortus-iHealth Capabilities</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Comprehensive Virtual Care Solution </p>
            <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> Empowering clinicians and patients with intuitive tools for effective remote monitoring and virtual wards. </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Updated Features */}
            <FeatureCard
              delay="delay-100"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /> </svg>} // Data collection icon
              title="Comprehensive Data Collection"
              description="Collects qualitative (symptoms, questionnaires) & quantitative data (observations via Bluetooth/manual entry) from various devices."
            />
            <FeatureCard
              delay="delay-200"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.473 1.467-.996 2.701-1.64 3.758-.422.73-.894 1.361-1.402 1.89M3.81 15.751c.422-.73.894-1.361 1.402-1.89.644-1.057 1.167-2.291 1.64-3.758C8.476 16.057 12.267 19 16.75 19c.844 0 1.66-.102 2.43-.294M12 18a6 6 0 01-6-6M12 6v2m0 8v2" /> </svg>} // Alert/Dashboard icon
              title="Intelligent Dashboard & Flagging"
              description="Data flags on customizable dashboards (Red, Amber, Gray) based on pre-configured thresholds for immediate attention."
            />
            <FeatureCard
              delay="delay-300"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /> </svg>} // Action/Audit icon
              title="Actionable Insights & Audit Trail"
              description="Clinicians can action flagged data directly within the platform, maintaining a clear audit trail for team visibility."
            />
            <FeatureCard
              delay="delay-400"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> </svg>} // Pathway/Questionnaire icon
              title="Configurable Pathways & Content"
              description="Tailor questionnaires by pathway and tag diagnoses to virtual wards, providing a library of self-management content for patients."
            />
            <FeatureCard
              delay="delay-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5zM15 9a2 2 0 11-4 0 2 2 0 014 0z" /> </svg>} // Telehealth/Communication icon
              title="Integrated Telehealth & Communication"
              description="Book and launch telehealth appointments, log diverse health data, and use 2-way messaging (text, links, photos, questionnaires)."
            />
            <FeatureCard
              delay="delay-600"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> </svg>} // Shield/Integration icon
              title="Seamless Integration & Compliance"
              description="Swift onboarding via NHS Spine PDS, existing EHR integrations (UK), ISO27001, DCB0129, CE+, MHRA Class I certified."
            />
          </div>
        </div>
      </section>

      {/* Section repurposed: "Secure & Integrated Healthcare" */}
      <section id="benefits" className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-orange-50 scroll-mt-20"> {/* Added scroll-mt, updated ID and colors */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                <h3 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Secure & Integrated</h3>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Connecting Care Securely </h2>
                <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto"> Ortus-iHealth prioritises data security and seamless integration within the existing healthcare ecosystem, adhering to the highest standards. </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  <div className="text-center animate-fadeInUp delay-200">
                  {/* SUGGESTED IMAGE: Diagram showing Ortus connecting to EHRs, devices, NHS Spine */}
                  {/* AI Prompt: "Abstract network diagram illustrating a central healthcare platform (Ortus-iHealth) securely connecting to NHS Spine, various hospital EHR systems, patient devices (phones, wearables), and clinician dashboards. Use orange and white theme, emphasize secure connections." */}
                    <img src="/ortus-integration-diagram.png" alt="Ortus-iHealth Integration Diagram" width={400} height={300} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-sm object-contain bg-white p-2" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-400x300.png';}}/>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Seamless System Integration </h3>
                  <p className="text-gray-600 max-w-md mx-auto"> Connects effortlessly with NHS Spine PDS and various UK EHR systems for swift onboarding and unified data flow. </p>
                  </div>
                  <div className="text-center animate-fadeInUp delay-400">
                  {/* SUGGESTED IMAGE: Graphic showing compliance logos (ISO, DCB, CE+, MHRA) */}
                  {/* AI Prompt: "Clean graphic design featuring the official logos for ISO 27001, DCB0129, Cyber Essentials Plus, and MHRA Class I device against a professional orange and white background, signifying trust and compliance for Ortus-iHealth." */}
                    <img src="/ortus-security-compliance.png" alt="Ortus-iHealth Security and Compliance" width={400} height={300} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-sm object-contain bg-white p-2" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-400x300.png';}}/>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Certified Security & Compliance </h3>
                  <p className="text-gray-600 max-w-md mx-auto"> Fully certified (ISO27001, DCB0129, CE+, MHRA Class I) ensuring data protection and regulatory adherence. </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Section repurposed: "Tailored Patient Journeys" */}
      <section className="py-20 sm:py-28 lg:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                <h3 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Customization</h3>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Tailor Ortus-iHealth to Your Needs </h2>
                <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto"> Configure monitoring pathways, dashboard alerts, questionnaires, and patient content to suit specific clinical requirements and workflows. </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  <div className="text-center animate-fadeInUp delay-200">
                  {/* SUGGESTED IMAGE: Screenshot of clinician dashboard showing customization or RAG flags */}
                  {/* AI Prompt: "Screenshot of a modern, clean clinical dashboard UI for Ortus-iHealth remote patient monitoring. Show patient list with clear Red/Amber/Gray status flags. Highlight customizable alert threshold settings. Use orange accents." */}
                    <img src="/ortus-dashboard-customization.png" alt="Ortus-iHealth Dashboard Configuration" width={500} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-lg bg-white p-4 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-500x350.png';}}/>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Configurable Dashboards </h3>
                  <p className="text-gray-600 max-w-md mx-auto"> Set custom thresholds for RAG status flagging and tailor dashboard views to prioritize clinical focus and streamline workflows. </p>
                  </div>
                  <div className="text-center animate-fadeInUp delay-400">
                  {/* SUGGESTED IMAGE: Screenshot of patient app showing questionnaire or data entry */}
                  {/* AI Prompt: "Screenshot of the user-friendly Ortus-iHealth patient mobile app interface. Show screens for submitting symptoms via questionnaire, manually entering blood pressure, or viewing educational content. Orange and white color scheme." */}
                    <img src="/ortus-patient-app-interface.png" alt="Ortus-iHealth Patient App Interface" width={500} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-lg bg-white p-4 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-500x350.png';}}/>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Personalized Patient Experience </h3>
                  <p className="text-gray-600 max-w-md mx-auto"> Design pathway-specific questionnaires and provide curated self-management content directly through the user-friendly patient app. </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Testimonials Section - Updated quotes and avatar filenames */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-orange-50 to-white"> {/* Updated colors */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Proven Results & High Satisfaction </h2>
                <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> Hear from clinicians and patients benefiting from Ortus-iHealth. </p>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* UPDATED Testimonials for Ortus-iHealth */}
                <TestimonialCard delay="delay-200" quote="Ortus-iHealth's dashboard flagging is incredibly helpful. It allows us to prioritise patients needing urgent attention in our virtual ward, significantly improving efficiency." name="Dr. Emily Carter" title="Respiratory Consultant, UK" avatarSrc="/ortus-avatar-1.jpg" rating={5} />
                <TestimonialCard delay="delay-300" quote="Patient engagement is fantastic. The app is easy to use, and collecting both symptom scores and device readings gives us a much richer clinical picture remotely." name="Ms. Sarah Jenkins" title="Cardiac Specialist Nurse, London" avatarSrc="/ortus-avatar-2.jpg" rating={5} />
                <TestimonialCard delay="delay-400" quote="The integration with our EHR and NHS Spine was smooth. Being able to action alerts and communicate securely in-platform saves time and keeps the whole team informed." name="Mr. Ben Adebayo" title="Digital Transformation Lead, NHS Trust" avatarSrc="/ortus-avatar-3.jpg" rating={4} />
              </div>
          </div>
      </section>

      {/* Trusted By Section */}
      <TrustedBy />

      {/* Contact Form Section - Updated titles */}
      <section id="contact" className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-orange-50 scroll-mt-20"> {/* Added scroll-mt, updated colors */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16 animate-fadeInUp">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Connect With Ortus-iHealth </h2>
                <p className="mt-5 max-w-xl text-xl text-gray-500 mx-auto"> Interested in a demonstration, discussing a pilot, or learning more about our platform? Reach out to our team. </p>
              </div>
              <div className="max-w-2xl mx-auto animate-fadeInUp delay-200">
                  <form action="#" method="POST" className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label> <input type="text" name="name" id="name" autoComplete="name" required className="form-input" placeholder="Your Name"/> </div>
                      <div> <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work Email Address</label> <input type="email" name="email" id="email" autoComplete="email" required className="form-input" placeholder="you@organisation.nhs.uk"/> </div>
                      <div> <label htmlFor="organisation" className="block text-sm font-medium text-gray-700 mb-1">Organisation / Trust</label> <input type="text" name="organisation" id="organisation" required className="form-input" placeholder="Your Hospital / Trust / ICB"/> </div>
                      <div> <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label> <input type="text" name="subject" id="subject" required className="form-input" placeholder="Demo Request / Pathway Enquiry / General Question"/> </div>
                      <div> <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label> <textarea id="message" name="message" rows={4} required className="form-input" placeholder="Please let us know how we can help... (e.g., clinical area, number of patients)"></textarea> </div>
                      <div className="text-center">
                        <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-orange-400 hover:to-orange-600"> Send Message </button>
                      </div>
                  </form>
              </div>
          </div>
      </section>

      {/* Call to Action Section - Updated colors and text */}
      <section className="bg-gradient-to-r from-orange-800 to-orange-600"> {/* Updated colors */}
          <div className="max-w-3xl mx-auto text-center py-16 px-4 sm:py-24 sm:px-6 lg:px-8 animate-fadeInUp">
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl tracking-tight"> <span className="block text-white">Ready to Enhance Your Virtual Care Services?</span> </h2>
              <p className="mt-6 text-lg leading-7 text-orange-100 max-w-xl mx-auto"> Discover how Ortus-iHealth's secure, integrated platform can improve patient outcomes and operational efficiency at your organisation. </p>
              <Link href="/#contact" legacyBehavior>
                <a className="mt-10 w-full inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-semibold rounded-lg text-orange-700 bg-white hover:bg-gray-100 sm:w-auto shadow-lg transition duration-200 ease-in-out hover-lift-strong"> Request Demo or Information </a>
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
