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

// FeatureCard Component - Updated icon background color
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
      {/* --- COLOR CHANGE: Teal to Orange Gradient --- */}
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 text-white mb-5 shadow-md flex-shrink-0">
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

// TestimonialCard Component - Updated avatar src naming convention
const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, title, avatarSrc, rating, delay }) => {
    const ref = useRef<HTMLDivElement>(null);
    const renderStars = () => { /* Star rendering logic - remains the same */
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
                    src={avatarSrc} // Use local path (e.g., /ortus-avatar-1.jpg)
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
// Updated logo, text, colors, and section link
const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-100">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" legacyBehavior>
            <a className="flex items-center space-x-2 animate-fadeInLeft cursor-pointer">
              {/* --- IMAGE & TEXT CHANGE: Metrix to Ortus-iHealth --- */}
              <img
                src="/ortus-logo.png" // NEW IMAGE NAME
                alt="Ortus-iHealth Logo" // UPDATED ALT TEXT
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-bold text-2xl text-gray-800">Ortus-iHealth</span> {/* UPDATED TEXT */}
            </a>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-7 animate-fadeIn delay-100">
          {/* Use next/link for page navigation */}
          <Link href="/features" legacyBehavior>
            {/* --- COLOR CHANGE: Teal to Orange Hover --- */}
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Features</a>
          </Link>
           {/* --- LINK & TEXT CHANGE: On-Site Advantage to Platform Benefits --- */}
          <Link href="/#platform-benefits" legacyBehavior>
             <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Platform Benefits</a>
          </Link>
          <Link href="/#contact" legacyBehavior>
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out">Contact</a>
          </Link>
          <Link href="/login" legacyBehavior>
            <a className="text-gray-600 hover:text-orange-700 font-medium transition duration-200 ease-in-out mr-3">Log In</a>
          </Link>
          <Link href="/#contact" legacyBehavior>
            {/* --- COLOR CHANGE: Teal to Orange Gradient --- */}
            <a className="bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover-lift-strong text-sm hover:from-orange-500 hover:to-orange-700"> Request Demo </a>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden animate-fadeIn delay-100">
          {/* --- COLOR CHANGE: Teal to Orange Hover/Focus --- */}
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
                {/* --- COLOR CHANGE: Teal to Orange Hover --- */}
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Features</a>
            </Link>
            {/* --- LINK & TEXT CHANGE: On-Site Advantage to Platform Benefits --- */}
            <Link href="/#platform-benefits" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Platform Benefits</a>
            </Link>
            <Link href="/#contact" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Contact</a>
            </Link>
            <Link href="/login" legacyBehavior>
                <a onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-700 hover:bg-gray-50">Log In</a>
            </Link>
            <Link href="/#contact" legacyBehavior>
                {/* --- COLOR CHANGE: Teal to Orange Gradient --- */}
                <a onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center mt-2 bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover:from-orange-500 hover:to-orange-700"> Request Demo </a>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};


// --- Trusted By Component (with Scroller Logic) ---
// Updated heading text
const TrustedBy: React.FC = () => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    // Placeholder logos referencing /public/images/logos/ - Names updated slightly
    const logos = [
        { name: "NHS Trust A", alt: "NHS Trust A Logo", src: "/images/logos/logo-placeholder-1.png" },
        { name: "Clinical Group B", alt: "Clinical Group B Logo", src: "/images/logos/logo-placeholder-2.png" },
        { name: "Healthcare Partner C", alt: "Healthcare Partner C Logo", src: "/images/logos/logo-placeholder-3.png" },
        { name: "NHS Foundation Trust D", alt: "NHS Foundation Trust D Logo", src: "/images/logos/logo-placeholder-4.png" },
        { name: "Research Institute E", alt: "Research Institute E Logo", src: "/images/logos/logo-placeholder-5.png" },
        { name: "Primary Care Network F", alt: "Primary Care Network F Logo", src: "/images/logos/logo-placeholder-6.png" },
    ];

    useEffect(() => { /* Logo cloning effect - remains the same */
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
                    {/* --- TEXT CHANGE: Updated Heading --- */}
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-600 sm:text-3xl"> Trusted by leading healthcare organisations </h2>
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
// Updated logo, text, company name, and copyright year
const Footer: React.FC = () => {
    return (
       <footer className="bg-gray-900 text-gray-400">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-10 xl:grid-cols-5">
             <div className="col-span-2 md:col-span-4 xl:col-span-1 mb-8 xl:mb-0">
               <div className="flex items-center space-x-2 mb-3">
                 {/* --- LOGO & TEXT CHANGE: Replaced SVG with IMG, updated text --- */}
                 <img
                     src="/ortus-logo-footer-white.png" // SUGGESTED: Use a white/monochrome version for dark background
                     alt="Ortus-iHealth Logo"
                     width={28} // Corresponds to h-7 w-7 approx
                     height={28}
                     className="h-7 w-7"
                 />
                 <span className="font-bold text-xl text-white">Ortus-iHealth</span> {/* UPDATED TEXT */}
               </div>
               {/* --- TEXT CHANGE: Updated tagline --- */}
               <p className="text-sm pr-4">Remote Monitoring & Virtual Ward Platform. Built by clinicians, for clinicians.</p>
             </div>
             {/* Footer Links - Use next/link */}
             <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Platform</h3> <ul className="space-y-3"> <li><Link href="/features" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Features</a></Link></li> {/* --- LINK & TEXT CHANGE: Renamed section link --- */} <li><Link href="/#platform-benefits" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Platform Benefits</a></Link></li> <li><Link href="/security" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Security & Compliance</a></Link></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Request Demo</a></Link></li> </ul> </div>
             <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Company</h3> <ul className="space-y-3"> <li><Link href="/about" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">About Us</a></Link></li> <li><Link href="/blog" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Blog</a></Link></li> <li><Link href="/careers" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Careers</a></Link></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Contact</a></Link></li> </ul> </div>
             <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Resources</h3> <ul className="space-y-3"> <li><Link href="/docs" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Documentation</a></Link></li> <li><Link href="/case-studies" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Case Studies</a></Link></li> <li><Link href="/privacy" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Privacy Policy</a></Link></li> <li><Link href="/terms" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Terms of Service</a></Link></li> </ul> </div>
             <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Connect</h3> <ul className="space-y-3"> <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-150 ease-in-out text-sm">LinkedIn</a></li> <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-150 ease-in-out text-sm">Twitter</a></li> <li><Link href="/#contact" legacyBehavior><a className="hover:text-white transition duration-150 ease-in-out text-sm">Contact Sales</a></Link></li> </ul> </div>
           </div>
           <div className="mt-12 border-t border-gray-700 pt-8 text-center">
             {/* --- TEXT CHANGE: Updated Company Name & Year --- */}
             <p className="text-sm">&copy; {new Date().getFullYear()} Ortus-iHealth Ltd. All rights reserved.</p>
           </div>
         </div>
       </footer>
    );
};


// --- Landing Page Component (Represents index.tsx) ---
// Updated text, colors, image names, feature descriptions, section content
const LandingPage: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Set<Element>>(new Set());
  const intersectionCallback = useCallback((entries: IntersectionObserverEntry[]) => { /* Intersection logic - remains the same */ entries.forEach(entry => { if (entry.isIntersecting) { const target = entry.target as HTMLElement; if (target.style.animationPlayState !== 'running') { target.style.animationPlayState = 'running'; } } }); }, []);
  useEffect(() => { /* Observer setup and cleanup - remains the same */ if (!('IntersectionObserver' in window)) { console.log("IntersectionObserver not supported..."); document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn').forEach(el => { (el as HTMLElement).style.animationPlayState = 'running'; }); return; } observerRef.current = new IntersectionObserver(intersectionCallback, { threshold: 0.1 }); const observer = observerRef.current; const elements = document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn'); elements.forEach(el => { if (!(el as HTMLElement).style.animationPlayState || (el as HTMLElement).style.animationPlayState === 'paused') { (el as HTMLElement).style.animationPlayState = 'paused'; } observer.observe(el); observedElementsRef.current.add(el); }); return () => { if (observer) { observedElementsRef.current.forEach(el => observer.unobserve(el)); observer.disconnect(); observedElementsRef.current.clear(); } }; }, [intersectionCallback]);

  return (
    <>
        {/* Global Styles necessary for this page - Updated colors */}
        <style jsx global>{`
            body { font-family: 'Inter', sans-serif; background-color: #fffaf0; /* Light orange background hint */ overflow-x: hidden; }
            /* --- COLOR CHANGE: Teal shadow to Orange shadow --- */
            .hover-lift-strong:hover { transform: translateY(-6px); box-shadow: 0 15px 25px -5px rgba(249, 115, 22, 0.2), 0 8px 10px -6px rgba(249, 115, 22, 0.2); transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out; }
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
            /* --- COLOR CHANGE: Teal focus ring to Orange focus ring --- */
            .form-input:focus { outline: none; border-color: #f97316; box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3); }
            html { scroll-behavior: smooth; }
        `}</style>

      <Header /> {/* Render Header */}

      {/* Hero Section */}
      {/* --- COLOR CHANGE: Teal background gradient to Orange --- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-orange-50 to-white pt-24 pb-28 sm:pt-32 sm:pb-36 lg:pt-40 lg:pb-48">
          {/* --- COLOR CHANGE: Teal background glow to Orange --- */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true"> {/* Background Glow */} <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4" width="1200" height="1200" fill="none" viewBox="0 0 1200 1200"> <circle cx="600" cy="600" r="600" fill="url(#ortusGlow1)" /> <defs><radialGradient id="ortusGlow1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 600) rotate(90) scale(600)"><stop stopColor="#fb923c"/><stop offset="1" stopColor="#f97316" stopOpacity="0"/></radialGradient></defs> </svg> </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              {/* --- TEXT & COLOR CHANGE: Updated Badge --- */}
              <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-white text-orange-800 shadow-sm mb-5 animate-fadeInUp"> ⚕️ Remote Monitoring & Virtual Wards </span>
              {/* --- TEXT & COLOR CHANGE: Updated Heading --- */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter text-gray-900 mb-6 !leading-tight animate-fadeInUp delay-100"> The Clinician-Built Platform for <br className="hidden sm:block"/> <span className="bg-gradient-to-r from-orange-600 to-orange-400 text-transparent bg-clip-text">Remote Care</span>. </h1>
              {/* --- TEXT CHANGE: Updated Subheading --- */}
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-fadeInUp delay-200"> Ortus-iHealth enables seamless remote patient monitoring and virtual wards. Collect qualitative & quantitative data, manage patients via configurable dashboards, and improve outcomes. Built by a consultant cardiologist for clinical teams. </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-5 animate-fadeInUp delay-300">
                <Link href="/#contact" legacyBehavior>
                    {/* --- COLOR CHANGE: Teal to Orange Gradient Button --- */}
                    <a className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-3.5 px-8 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-orange-500 hover:to-orange-700"> Request a Demo </a>
                </Link>
                <Link href="#features" legacyBehavior>
                    <a className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-8 rounded-lg transition duration-150 ease-in-out shadow-md border border-gray-200 text-lg hover-lift-subtle"> Explore Features </a>
                </Link>
              </div>
               {/* --- TEXT CHANGE: Updated Certifications --- */}
              <p className="mt-6 text-sm text-gray-500 animate-fadeInUp delay-400">ISO27001 | DCB0129 | Cyber Essentials Plus | MHRA Class I</p>
              <div className="mt-20 animate-fadeInUp delay-500">
                  {/* --- IMAGE & STYLE CHANGE: Metrix to Ortus Overview, updated shadow --- */}
                  <img
                      src="/ortus-overview.png" // NEW IMAGE NAME
                      alt="Ortus-iHealth Platform Overview" // UPDATED ALT TEXT
                      width={1000}
                      height={600}
                      className="rounded-xl shadow-2xl mx-auto border border-gray-200 object-cover"
                      // --- COLOR CHANGE: Teal shadow to Orange shadow ---
                      style={{boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.25)'}}
                      onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-1000x600-orange.png';}} // Fallback image suggestion
                  />
              </div>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 lg:py-32 bg-white scroll-mt-20"> {/* Added scroll-mt */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* --- TEXT & COLOR CHANGE: Updated Headings --- */}
          <div className="text-center mb-16 sm:mb-20 animate-fadeInUp"> <h2 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Ortus-iHealth Capabilities</h2> <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Comprehensive Remote Patient Monitoring </p> <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> A flexible platform designed to manage virtual wards and monitor patients remotely across various pathways. </p> </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
             {/* --- FEATURE CARD CONTENT UPDATED for Ortus-iHealth --- */}
            <FeatureCard delay="delay-100" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /> </svg>} title="Holistic Data Collection" description="Gather qualitative (symptoms, questionnaires) and quantitative data (vitals) via Bluetooth, manual entry, or integrated devices." />
            <FeatureCard delay="delay-200" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17.25v-.035L12 15l2.25 2.215V17.25h4.5A2.25 2.25 0 0021 15V6.75A2.25 2.25 0 0018.75 4.5h-13.5A2.25 2.25 0 003 6.75V15A2.25 2.25 0 005.25 17.25h4.5zm0 0H5.25" /> </svg>} title="Configurable Dashboard" description="Monitor patient data on a customizable dashboard with alerts flagging Red, Amber, or Gray based on set thresholds." />
            <FeatureCard delay="delay-300" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>} title="In-Platform Actions & Audit" description="Action alerts directly within the platform, maintaining a clear audit trail for seamless team collaboration." />
            <FeatureCard delay="delay-400" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /> </svg>} title="Custom Questionnaires" description="Configure bespoke questionnaires tailored to specific pathways (Cardiac, Respiratory, Obstetric, etc.)." />
            <FeatureCard delay="delay-500" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /> </svg>} title="Integrated Telehealth" description="Book and launch telehealth appointments directly within the platform for a unified patient experience." />
            <FeatureCard delay="delay-600" icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /> </svg>} title="EHR Integration & Onboarding" description="Swift NHS Spine PDS integration for easy onboarding, plus existing integrations with multiple UK EHRs." />
          </div>
        </div>
      </section>

      {/* --- SECTION REFRAMED: On-Site Advantage -> Key Platform Benefits --- */}
      <section id="platform-benefits" className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-orange-50 scroll-mt-20"> {/* Added scroll-mt, ID change, color change */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {/* --- TEXT & COLOR CHANGE: Updated Headings & Description --- */}
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp"> <h3 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Key Platform Benefits</h3> <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Flexible & Secure Monitoring </h2> <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto"> Ortus-iHealth is designed by clinicians to be intuitive, secure, and integrate smoothly into existing workflows, backed by robust compliance and proven results. </p> </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  {/* --- CONTENT BLOCK 1: Updated for Ortus-iHealth --- */}
                  <div className="text-center animate-fadeInUp delay-200">
                      {/* --- IMAGE CHANGE: Suggestion for Dashboard Mockup --- */}
                      <img src="/ortus-dashboard-mockup.png" alt="Ortus-iHealth Dashboard" width={450} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-md object-contain bg-white p-2" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-450x350-orange.png';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Clinician-Designed Workflow </h3> <p className="text-gray-600 max-w-md mx-auto"> Developed by a consultant cardiologist, featuring an intuitive dashboard with RAG flagging and in-platform actions to streamline care. </p>
                  </div>
                   {/* --- CONTENT BLOCK 2: Updated for Ortus-iHealth --- */}
                  <div className="text-center animate-fadeInUp delay-400">
                       {/* --- IMAGE CHANGE: Suggestion for Integration/App Data Flow --- */}
                      <img src="/ortus-integration-flow.png" alt="Data Integration Flow" width={450} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-md object-contain bg-white p-2" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-450x350-orange.png';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Seamless Data Integration </h3> <p className="text-gray-600 max-w-md mx-auto"> Easily onboard patients via NHS Spine PDS and connect with various devices (Bluetooth/Manual). Integrates with existing UK EHRs. </p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- SECTION REFRAMED: Personalize Notes -> Flexible Configuration --- */}
      <section className="py-20 sm:py-28 lg:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {/* --- TEXT & COLOR CHANGE: Updated Headings & Description --- */}
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp"> <h3 className="text-sm font-semibold text-orange-600 tracking-wide uppercase">Flexible Configuration</h3> <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Adaptable to Your Pathways </h2> <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto"> Tailor dashboards, alert thresholds, questionnaires, and patient content libraries to meet the specific needs of your clinical pathways and patient cohorts. </p> </div>
               {/* Grid layout updated to potentially accommodate 3 items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
                   {/* --- CONTENT BLOCK 1: Updated for Ortus-iHealth --- */}
                  <div className="text-center animate-fadeInUp delay-200">
                      {/* --- IMAGE CHANGE: Suggestion for Dashboard Config UI --- */}
                      <img src="/ortus-dashboard-config.png" alt="UI showing dashboard configuration" width={500} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full bg-white p-4 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-500x350-orange.png';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Configurable Dashboards & Alerts </h3> <p className="text-gray-600 max-w-md mx-auto"> Customize data views and set specific Red/Amber/Gray thresholds for alerts tailored to individual patient needs or pathway protocols. </p>
                  </div>
                  {/* --- CONTENT BLOCK 2: Updated for Ortus-iHealth --- */}
                  <div className="text-center animate-fadeInUp delay-400">
                      {/* --- IMAGE CHANGE: Suggestion for Questionnaire Builder UI --- */}
                      <img src="/ortus-questionnaire-builder.png" alt="UI showing questionnaire builder" width={500} height={350} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full bg-white p-4 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-500x350-orange.png';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Pathway-Specific Content </h3> <p className="text-gray-600 max-w-md mx-auto"> Build custom questionnaires and tag diagnoses to provide patients with relevant self-management resources from your library. </p>
                  </div>
                   {/* --- CONTENT BLOCK 3: Added for Patient App --- */}
                  <div className="text-center animate-fadeInUp delay-600 lg:col-span-1 md:col-span-2"> {/* Adjust span if needed */}
                      {/* --- IMAGE CHANGE: Suggestion for Patient App Screen --- */}
                      <img src="/ortus-patient-app-screen.png" alt="Ortus-iHealth Patient App Screen" width={300} height={600} className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 max-w-xs w-full bg-white p-2 object-contain" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/placeholder-300x600-orange.png';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Engaging Patient Experience </h3> <p className="text-gray-600 max-w-md mx-auto"> User-friendly patient app drives high engagement and satisfaction. Features 2-way messaging, data entry, and access to self-help content. </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Testimonials Section */}
       {/* --- COLOR CHANGE: Teal background gradient to Orange --- */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-orange-50 to-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
               {/* --- TEXT CHANGE: Updated Headings --- */}
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp"> <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Proven Results & Satisfaction </h2> <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> Supporting over 13,000 patients with improved outcomes, organisational savings, and high user satisfaction. </p> </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                   {/* --- TESTIMONIAL CONTENT & AVATAR SRC UPDATED --- */}
                  <TestimonialCard delay="delay-200" quote="Ortus-iHealth's dashboard gives us a clear overview of our virtual ward patients. The configurable alerts are key for prioritising clinical attention effectively." name="Dr. Ben Carter" title="Consultant Cardiologist, St Barts Heart Centre" avatarSrc="/ortus-avatar-1.jpg" rating={5} />
                  <TestimonialCard delay="delay-300" quote="The patient app is incredibly easy to use, which has led to fantastic engagement from our respiratory patients. Data flows seamlessly, saving our team valuable time." name="Sarah Jenkins" title="Respiratory Nurse Specialist, UK" avatarSrc="/ortus-avatar-2.jpg" rating={5} />
                  <TestimonialCard delay="delay-400" quote="Implementing Ortus-iHealth for our post-natal monitoring has improved patient experience and allowed us to identify potential issues earlier. The integration was straightforward." name="Maria Garcia" title="Digital Midwife Lead, NHS Trust" avatarSrc="/ortus-avatar-3.jpg" rating={4} />
              </div>
          </div>
      </section>

      {/* Trusted By Section */}
      <TrustedBy />

      {/* Contact Form Section */}
       {/* --- COLOR CHANGE: Teal background gradient to Orange --- */}
      <section id="contact" className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-orange-50 scroll-mt-20"> {/* Added scroll-mt, color change */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {/* --- TEXT CHANGE: Updated Heading --- */}
              <div className="text-center mb-12 sm:mb-16 animate-fadeInUp"> <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Connect With Ortus-iHealth </h2> <p className="mt-5 max-w-xl text-xl text-gray-500 mx-auto"> Interested in a demo or learning how Ortus-iHealth can support your remote monitoring or virtual ward initiatives? Reach out to our team. </p> </div>
              <div className="max-w-2xl mx-auto animate-fadeInUp delay-200">
                  <form action="#" method="POST" className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label> <input type="text" name="name" id="name" autoComplete="name" required className="form-input" placeholder="Your Name"/> </div>
                      <div> <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work Email Address</label> <input type="email" name="email" id="email" autoComplete="email" required className="form-input" placeholder="you@organisation.nhs.uk"/> </div>
                      <div> <label htmlFor="organisation" className="block text-sm font-medium text-gray-700 mb-1">Organisation</label> <input type="text" name="organisation" id="organisation" required className="form-input" placeholder="Your NHS Trust / Organisation"/> </div>
                      <div> <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label> <input type="text" name="subject" id="subject" required className="form-input" placeholder="Demo Request / General Inquiry"/> </div>
                      <div> <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label> <textarea id="message" name="message" rows={4} required className="form-input" placeholder="Please provide some details about your interest (e.g., pathway, patient numbers)..."></textarea> </div>
                      <div className="text-center">
                          {/* --- COLOR CHANGE: Teal to Orange Gradient Button --- */}
                          <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-800 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-orange-500 hover:to-orange-700"> Send Message </button> </div>
                  </form>
              </div>
          </div>
      </section>

      {/* Call to Action Section */}
      {/* --- COLOR CHANGE: Teal background gradient to Orange --- */}
      <section className="bg-gradient-to-r from-orange-800 to-orange-600">
          <div className="max-w-3xl mx-auto text-center py-16 px-4 sm:py-24 sm:px-6 lg:px-8 animate-fadeInUp">
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl tracking-tight"> <span className="block text-white">Ready to Enhance Your Remote Care?</span> </h2>
              {/* --- TEXT & COLOR CHANGE: Updated Text --- */}
              <p className="mt-6 text-lg leading-7 text-orange-100 max-w-xl mx-auto"> Discover how Ortus-iHealth's clinician-built, secure platform can streamline virtual wards and improve patient monitoring at your organisation. </p>
              <Link href="/#contact" legacyBehavior>
                  {/* --- COLOR CHANGE: Teal text to Orange text on button --- */}
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
