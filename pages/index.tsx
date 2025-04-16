import React, { useState, useEffect, useRef, PropsWithChildren, useCallback } from 'react';

// Helper function for class names (optional, but common)
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// --- Color Palette (Approximated Tailwind Classes) ---
// --teal-dark: #1e6b6b; -> teal-700 (#134e4a) / teal-800 (#115e59)
// --teal-mid: #3b9a9c; -> teal-600 (#0d9488)
// --teal-light: #5fc2b1; -> teal-400 (#2dd4bf)
// --teal-very-light: #e0f2f1; -> teal-50 (#f0fdfa)

// --- Reusable Components ---

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string; // e.g., 'delay-100'
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  const ref = useRef<HTMLDivElement>(null);
  // Add intersection observer logic if needed per card, or handle in parent

  return (
    <div
      ref={ref}
      className={classNames(
        'flex flex-col items-center text-center p-8 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 hover-lift-strong animate-fadeInUp',
        delay
      )}
    >
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white mb-5 shadow-md">
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
    avatarText: string; // e.g., "Dr" or "NP"
    rating: number; // 1-5
    delay: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, title, avatarText, rating, delay }) => {
    const ref = useRef<HTMLDivElement>(null);
    // Add intersection observer logic if needed per card, or handle in parent

    // Generate star icons based on rating
    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <svg
                    key={i}
                    className={classNames(
                        'w-5 h-5 fill-current',
                        i <= rating ? 'text-yellow-400' : 'text-gray-300'
                    )}
                    viewBox="0 0 20 20"
                >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
            );
        }
        return stars;
    };

    return (
        <div ref={ref} className={classNames("testimonial-card animate-fadeInUp", delay)}>
            <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex space-x-1">
                    {renderStars()}
                </div>
            </div>
            <blockquote className="text-gray-600 italic mb-4">
                "{quote}"
            </blockquote>
            <div className="flex items-center">
                <img
                    className="h-10 w-10 rounded-full mr-3 bg-teal-50 text-teal-600 flex items-center justify-center font-semibold"
                    src={`https://placehold.co/40x40/e0f2f1/3b9a9c?text=${avatarText}`}
                    alt={`${name} avatar placeholder`}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = `https://placehold.co/40x40/cccccc/ffffff?text=Err`;
                    }}
                 />
                <div>
                    <p className="font-semibold text-gray-900">{name}</p>
                    <p className="text-sm text-gray-500">{title}</p>
                </div>
            </div>
        </div>
    );
};


// --- Page Components ---

interface PageProps {
  navigateTo: (page: 'landing' | 'login') => void;
}

// --- Header Component ---
const Header: React.FC<PageProps> = ({ navigateTo }) => {
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-100">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2 animate-fadeInLeft">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 60 60" fill="none">
            <defs>
              <linearGradient id="reactGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#5fc2b1', stopOpacity: 1 }} /> {/* teal-400 */}
                <stop offset="100%" style={{ stopColor: '#3b9a9c', stopOpacity: 1 }} /> {/* teal-600 */}
              </linearGradient>
              <linearGradient id="reactGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b9a9c', stopOpacity: 1 }} /> {/* teal-600 */}
                <stop offset="100%" style={{ stopColor: '#1e6b6b', stopOpacity: 1 }} /> {/* teal-800 */}
              </linearGradient>
            </defs>
            <path d="M20 5 H40 Q45 5 45 10 V50 Q45 55 40 55 H20 Q15 55 15 50 V10 Q15 5 20 5 Z" fill="url(#reactGrad1)"/>
            <path d="M5 20 H25 Q30 20 30 25 V35 Q30 40 25 40 H5 Q0 40 0 35 V25 Q0 20 5 20 Z" fill="url(#reactGrad2)"/>
            <path d="M35 20 H55 Q60 20 60 25 V35 Q60 40 55 40 H35 Q30 40 30 35 V25 Q30 20 35 20 Z" fill="url(#reactGrad1)" transform="translate(-2, 0)" />
          </svg>
          <span className="font-bold text-2xl text-gray-800">Noteless</span>
        </div>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-7 animate-fadeIn delay-100">
          <a href="#" className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out">Features</a>
          <a href="#" className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out">Use Cases</a>
          <a href="#" className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out">Pricing</a>
          <a href="#" className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out">Blog</a>
          {/* Simulate navigation to login page */}
          <button
            onClick={() => navigateTo('login')}
            className="text-gray-600 hover:text-teal-700 font-medium transition duration-200 ease-in-out mr-3"
          >
            Log In
          </button>
          <a href="#" className="bg-gradient-to-r from-teal-600 to-teal-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover-lift-strong text-sm hover:from-teal-400 hover:to-teal-600">
            Sign Up Free
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden animate-fadeIn delay-100">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" strokeWidth="2">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> // Close icon
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /> // Menu icon
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu (Collapsible) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-40" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50">Features</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50">Use Cases</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50">Pricing</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50">Blog</a>
            <button
              onClick={() => { navigateTo('login'); setIsMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-gray-50"
            >
              Log In
            </button>
            <a href="#" className="block w-full text-center mt-2 bg-gradient-to-r from-teal-600 to-teal-800 text-white font-semibold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out shadow-md hover:from-teal-400 hover:to-teal-600">
              Sign Up Free
            </a>
          </div>
        </div>
      )}
    </header>
  );
};


// --- Trusted By Component (with Scroller Logic) ---
const TrustedBy: React.FC = () => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const logos = [
        { name: "Ygdra.", alt: "Ygdra Logo Placeholder" },
        { name: "Helse Møre", alt: "Helse Møre og Romsdal Logo Placeholder" },
        { name: "Vågan Kommune", alt: "Vågan Kommune Logo Placeholder" },
        { name: "Apex Klinikken", alt: "Apex Klinikken Logo Placeholder" },
        { name: "Sykehuset Østfold", alt: "Sykehuset Østfold Logo Placeholder" },
        { name: "Unicare", alt: "Unicare Logo Placeholder" },
    ];

    // Use effect to clone logos for seamless scroll, runs only once on mount
    useEffect(() => {
        const scrollerInner = scrollerRef.current;
        if (scrollerInner && scrollerInner.children.length === logos.length) { // Check if not already cloned
            logos.forEach((logo, index) => {
                const imgElement = scrollerInner.children[index] as HTMLImageElement;
                if (imgElement) {
                    const clone = imgElement.cloneNode(true) as HTMLImageElement;
                    clone.setAttribute('aria-hidden', 'true');
                    scrollerInner.appendChild(clone);
                }
            });
        }
    }, [logos.length]); // Dependency array ensures it runs if logo list changes (though it's static here)

    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16 animate-fadeInUp">
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-600 sm:text-3xl">
                        Used by trusted organisations
                    </h2>
                </div>
                <div className="relative logo-scroller w-full overflow-hidden">
                    <div ref={scrollerRef} className="scroller-inner">
                        {logos.map((logo, index) => (
                            <img
                                key={index}
                                src={`https://placehold.co/150x40/f3f4f6/6b7280?text=${encodeURIComponent(logo.name)}`}
                                alt={logo.alt}
                                onError={(e) => { /* Basic error handling */
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = `https://placehold.co/150x40/cccccc/ffffff?text=Err`;
                                }}
                            />
                        ))}
                        {/* Cloned logos will be appended here by useEffect */}
                    </div>
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                </div>
            </div>
        </section>
    );
};


// --- Landing Page Component ---
const LandingPage: React.FC<PageProps> = ({ navigateTo }) => {
  // Ref for Intersection Observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Set<Element>>(new Set()); // Keep track of observed elements

  // Callback function for Intersection Observer
  const intersectionCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;
        if (target.style.animationPlayState !== 'running') {
          target.style.animationPlayState = 'running';
        }
        // Optional: Unobserve after animation starts to prevent re-triggering
        // observerRef.current?.unobserve(target);
        // observedElementsRef.current.delete(target); // Remove from tracking if unobserving
      } else {
        // Optional: Reset animation if it goes out of view
        // const target = entry.target as HTMLElement;
        // target.style.animationPlayState = 'paused';
      }
    });
  }, []);

  // Set up Intersection Observer on mount
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      console.log("IntersectionObserver not supported, running animations immediately.");
      // Fallback: Find all elements and start animations
      document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn').forEach(el => {
        (el as HTMLElement).style.animationPlayState = 'running';
      });
      return; // Exit effect early
    }

    observerRef.current = new IntersectionObserver(intersectionCallback, { threshold: 0.1 });
    const observer = observerRef.current;

    // Observe all elements with animation classes
    const elements = document.querySelectorAll('.animate-fadeInUp, .animate-fadeInLeft, .animate-fadeIn');
    elements.forEach(el => {
      // Ensure animation is paused initially
      if (!(el as HTMLElement).style.animationPlayState || (el as HTMLElement).style.animationPlayState === 'paused') {
        (el as HTMLElement).style.animationPlayState = 'paused';
      }
      observer.observe(el);
      observedElementsRef.current.add(el); // Add to tracking
    });

    // Cleanup function: disconnect observer and clear tracking
    return () => {
      if (observer) {
        observedElementsRef.current.forEach(el => observer.unobserve(el));
        observer.disconnect();
        observedElementsRef.current.clear();
      }
    };
  }, [intersectionCallback]); // Re-run if callback changes (it shouldn't due to useCallback)


  return (
    <>
      <Header navigateTo={navigateTo} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-teal-50 to-white pt-24 pb-28 sm:pt-32 sm:pb-36 lg:pt-40 lg:pb-48">
          {/* Background shapes */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
              <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4" width="1200" height="1200" fill="none" viewBox="0 0 1200 1200">
                  <circle cx="600" cy="600" r="600" fill="url(#reactGlow1)" />
                  <defs><radialGradient id="reactGlow1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 600) rotate(90) scale(600)"><stop stopColor="#2dd4bf"/><stop offset="1" stopColor="#0d9488" stopOpacity="0"/></radialGradient></defs>
              </svg>
          </div>
          {/* Hero Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-white text-teal-800 shadow-sm mb-5 animate-fadeInUp">
                  ✨ Now with AI Summaries!
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter text-gray-900 mb-6 !leading-tight animate-fadeInUp delay-100">
                  Capture Ideas, <br className="sm:hidden" /> <span className="bg-gradient-to-r from-teal-600 to-teal-400 text-transparent bg-clip-text">Effortlessly</span>.
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 animate-fadeInUp delay-200">
                  The most intuitive way to keep notes. Seamlessly synced across all your devices. Stay organized and focused, wherever inspiration strikes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-5 animate-fadeInUp delay-300">
                  <a href="#" className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-teal-800 text-white font-semibold py-3.5 px-8 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-teal-400 hover:to-teal-600">
                      Get Started - It&apos;s Free
                  </a>
                  <a href="#" className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-8 rounded-lg transition duration-150 ease-in-out shadow-md border border-gray-200 text-lg hover-lift-subtle">
                      Learn More
                  </a>
              </div>
              <p className="mt-6 text-sm text-gray-500 animate-fadeInUp delay-400">No credit card required. Forever free plan available.</p>

              {/* Hero Image Placeholder */}
              <div className="mt-20 animate-fadeInUp delay-500">
                  <img src="https://placehold.co/1000x600/e0f2f1/3b9a9c?text=App+Interface+Showcase"
                      alt="App Screenshot Placeholder"
                      className="rounded-xl shadow-2xl mx-auto border border-gray-200"
                      style={{boxShadow: '0 25px 50px -12px rgba(59, 154, 156, 0.25)'}}
                      onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/1000x600/e0e7ff/ffffff?text=Image+Load+Error';}}/>
              </div>
          </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
            <h2 className="text-sm font-semibold text-teal-600 tracking-wide uppercase">Core Features</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Designed for Clarity & Speed
            </p>
            <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto">
              Focus on your thoughts with a clean interface backed by powerful, reliable features.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
            <FeatureCard
              delay="delay-100"
              icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /> </svg>}
              title="Real-time Sync"
              description="Your notes are instantly and reliably synced across all your logged-in devices. Never miss a beat."
            />
             <FeatureCard
              delay="delay-200"
              icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> </svg>}
              title="Blazing-Fast Search"
              description="Instantly find any note, tag, or keyword across your entire library with our optimized search."
            />
             <FeatureCard
              delay="delay-300"
              icon={<svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> </svg>}
              title="Secure & Private"
              description="End-to-end encryption options and robust security measures ensure your thoughts remain yours."
            />
          </div>
        </div>
      </section>

      {/* Workflow Streamlining Section */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-teal-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                  <h3 className="text-sm font-semibold text-teal-600 tracking-wide uppercase">The future is here</h3>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                      Streamline your workflow
                  </h2>
                  <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto">
                      Using state-of-the-art technology specifically tailored to the healthcare sector, we provide a solution that transforms the daily workflow of healthcare professionals.
                  </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  <div className="text-center animate-fadeInUp delay-200">
                      <img src="https://placehold.co/400x300/e0f2f1/3b9a9c?text=Clinical+Interaction" alt="Doctor interacting with patient" className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-sm" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/400x300/e0e7ff/ffffff?text=Image+Error';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Instant clinical notes. <br/> Anywhere. </h3> <p className="text-gray-600 max-w-md mx-auto"> Noteless listens to your conversation with the patient and automatically generates concise, accurate clinical notes in real-time. </p>
                  </div>
                  <div className="text-center animate-fadeInUp delay-400">
                      <img src="https://placehold.co/400x300/e0f2f1/3b9a9c?text=Easy+Setup" alt="Person using laptop" className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-sm" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/400x300/e0e7ff/ffffff?text=Image+Error';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Get started in less than a minute. </h3> <p className="text-gray-600 max-w-md mx-auto"> Log in with your email, complete a quick tutorial, and start your first AI-assisted consultation immediately. No complex setup required. </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Personalize Notes Section */}
      <section className="py-20 sm:py-28 lg:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                  <h3 className="text-sm font-semibold text-teal-600 tracking-wide uppercase">Customization</h3>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                      Personalize your notes
                  </h2>
                  <p className="mt-5 max-w-3xl text-xl text-gray-500 mx-auto">
                      Create your own phrases and customize Noteless to your personal writing style, generating more authentic notes.
                  </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                  <div className="text-center animate-fadeInUp delay-200">
                      <img src="https://placehold.co/500x350/e0f2f1/3b9a9c?text=UI+Phrases+List" alt="UI showing list of phrases" className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-lg bg-white p-4" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/500x350/e0e7ff/ffffff?text=Image+Error';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Traditional phrases </h3>
                      <p className="text-gray-600 max-w-md mx-auto"> Manage your library of custom text snippets and insert them easily into your notes. </p>
                  </div>
                  <div className="text-center animate-fadeInUp delay-400">
                      <img src="https://placehold.co/500x350/e0f2f1/3b9a9c?text=UI+Phrase+Editor" alt="UI showing phrase editor" className="rounded-2xl shadow-xl mx-auto mb-8 border border-gray-200 w-full max-w-lg bg-white p-4" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/500x350/e0e7ff/ffffff?text=Image+Error';}}/>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight"> Automatic phrases </h3>
                      <p className="text-gray-600 max-w-md mx-auto"> Define verbal triggers that automatically insert predefined content based on your speech patterns. </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-teal-50 to-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-20 animate-fadeInUp">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> What Our Users Say </h2>
                  <p className="mt-5 max-w-2xl text-xl text-gray-500 mx-auto"> Hear from professionals who transformed their workflow with Noteless. </p>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <TestimonialCard
                      delay="delay-200"
                      quote="Noteless has been a game-changer for my practice. I'm saving hours each week on documentation, allowing me to focus more on patient care. Highly recommended!"
                      name="Dr. Emily Carter"
                      title="General Practitioner"
                      avatarText="Dr"
                      rating={5}
                  />
                   <TestimonialCard
                      delay="delay-300"
                      quote="The accuracy of the AI transcription and note generation is impressive. It captures the nuances of patient conversations surprisingly well. Setup was incredibly easy."
                      name="Dr. Ben Hanson"
                      title="Cardiologist"
                      avatarText="Dr"
                      rating={5}
                  />
                   <TestimonialCard
                      delay="delay-400"
                      quote="I was skeptical about AI in clinical notes, but Noteless integrates smoothly and the customization options make it feel truly personal. A valuable tool."
                      name="Sarah Chen, NP"
                      title="Nurse Practitioner"
                      avatarText="NP"
                      rating={4}
                  />
              </div>
          </div>
      </section>

      {/* Trusted By Section */}
      <TrustedBy />

      {/* Contact Form Section */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-teal-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16 animate-fadeInUp">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"> Get In Touch </h2>
                  <p className="mt-5 max-w-xl text-xl text-gray-500 mx-auto"> Have questions or want to learn more? Send us a message! </p>
              </div>
              <div className="max-w-2xl mx-auto animate-fadeInUp delay-200">
                  <form action="#" method="POST" className="space-y-6" onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
                      <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input type="text" name="name" id="name" autoComplete="name" required className="form-input" placeholder="Your Name"/>
                      </div>
                      <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <input type="email" name="email" id="email" autoComplete="email" required className="form-input" placeholder="you@example.com"/>
                      </div>
                      <div>
                          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                          <input type="text" name="subject" id="subject" required className="form-input" placeholder="Question about..."/>
                      </div>
                      <div>
                          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                          <textarea id="message" name="message" rows={4} required className="form-input" placeholder="Your message..."></textarea>
                      </div>
                      <div className="text-center">
                          <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-teal-800 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out shadow-lg text-lg hover-lift-strong hover:from-teal-400 hover:to-teal-600">
                              Send Message
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-teal-800 to-teal-600">
          <div className="max-w-3xl mx-auto text-center py-16 px-4 sm:py-24 sm:px-6 lg:px-8 animate-fadeInUp">
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl tracking-tight">
                  <span className="block text-white">Ready to elevate your note-taking?</span>
              </h2>
              <p className="mt-6 text-lg leading-7 text-teal-100 max-w-xl mx-auto">
                  Experience the seamless flow of capturing and organizing your ideas. Get started with Noteless for free today.
              </p>
              <a href="#" className="mt-10 w-full inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-semibold rounded-lg text-teal-700 bg-white hover:bg-gray-100 sm:w-auto shadow-lg transition duration-200 ease-in-out hover-lift-strong">
                  Sign Up - It&apos;s Free
              </a>
          </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 xl:grid-cols-5">
            <div className="col-span-2 md:col-span-4 xl:col-span-1 mb-8 xl:mb-0">
              <div className="flex items-center space-x-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 60 60" fill="none">
                  <path d="M20 5 H40 Q45 5 45 10 V50 Q45 55 40 55 H20 Q15 55 15 50 V10 Q15 5 20 5 Z" fill="url(#reactGrad1)"/>
                  <path d="M5 20 H25 Q30 20 30 25 V35 Q30 40 25 40 H5 Q0 40 0 35 V25 Q0 20 5 20 Z" fill="url(#reactGrad2)"/>
                  <path d="M35 20 H55 Q60 20 60 25 V35 Q60 40 55 40 H35 Q30 40 30 35 V25 Q30 20 35 20 Z" fill="url(#reactGrad1)" transform="translate(-2, 0)" />
                </svg>
                <span className="font-bold text-xl text-white">Noteless</span>
              </div>
              <p className="text-sm pr-4">The simplest, fastest way to capture and organize your thoughts.</p>
            </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Product</h3> <ul className="space-y-3"> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Features</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Pricing</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Download Apps</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Integrations</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Updates</a></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Company</h3> <ul className="space-y-3"> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">About Us</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Blog</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Careers</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Contact Us</a></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Resources</h3> <ul className="space-y-3"> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Help Center</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Security</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Privacy Policy</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Terms of Service</a></li> </ul> </div>
            <div> <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Connect</h3> <ul className="space-y-3"> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Twitter</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">LinkedIn</a></li> <li><a href="#" className="hover:text-white transition duration-150 ease-in-out text-sm">Community</a></li> </ul> </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8 text-center">
            <p className="text-sm">&copy; 2025 Noteless Technologies Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

// --- Login Page Component (Placeholder) ---
const LoginPage: React.FC<PageProps> = ({ navigateTo }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
         {/* Logo */}
         <div className="flex justify-center items-center space-x-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 60 60" fill="none">
                {/* Re-use gradient defs or define inline */}
                <defs>
                  <linearGradient id="reactGrad1Login" x1="0%" y1="0%" x2="100%" y2="100%"> <stop offset="0%" style={{ stopColor: '#5fc2b1', stopOpacity: 1 }} /> <stop offset="100%" style={{ stopColor: '#3b9a9c', stopOpacity: 1 }} /> </linearGradient>
                  <linearGradient id="reactGrad2Login" x1="100%" y1="0%" x2="0%" y2="100%"> <stop offset="0%" style={{ stopColor: '#3b9a9c', stopOpacity: 1 }} /> <stop offset="100%" style={{ stopColor: '#1e6b6b', stopOpacity: 1 }} /> </linearGradient>
                </defs>
                <path d="M20 5 H40 Q45 5 45 10 V50 Q45 55 40 55 H20 Q15 55 15 50 V10 Q15 5 20 5 Z" fill="url(#reactGrad1Login)"/>
                <path d="M5 20 H25 Q30 20 30 25 V35 Q30 40 25 40 H5 Q0 40 0 35 V25 Q0 20 5 20 Z" fill="url(#reactGrad2Login)"/>
                <path d="M35 20 H55 Q60 20 60 25 V35 Q60 40 55 40 H35 Q30 40 30 35 V25 Q30 20 35 20 Z" fill="url(#reactGrad1Login)" transform="translate(-2, 0)" />
            </svg>
            <span className="font-bold text-3xl text-gray-800">Noteless</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" action="#" method="POST" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="form-input"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-150 ease-in-out"
              >
                Sign in
              </button>
            </div>
          </form>

           <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500"> Or continue with </span>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                    {/* Add Social Login Buttons if needed */}
                     <div>
                        <a href="#" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                            <span className="sr-only">Sign in with Google</span>
                            {/* Placeholder for Google Icon */}
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.14 6.737 9.488.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.379.203 2.398.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.309.678.92.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg>
                            <span className="ml-2">Google</span>
                        </a>
                    </div>
                </div>
            </div>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => navigateTo('landing')}
              className="font-medium text-teal-600 hover:text-teal-500"
            >
              &larr; Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component (Handles Routing) ---
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login'>('landing');

  const navigateTo = (page: 'landing' | 'login') => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  return (
    <>
      {/* Global Styles and Animations */}
      <style jsx global>{`
        /* Apply Inter font globally */
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f7fdfd; /* Very light teal background */
            overflow-x: hidden; /* Prevent horizontal scroll caused by animations */
        }

        /* Enhanced Hover/Animation Effects */
        .hover-lift-strong:hover {
            transform: translateY(-6px);
            box-shadow: 0 15px 25px -5px rgba(59, 154, 156, 0.2), 0 8px 10px -6px rgba(59, 154, 156, 0.2); /* Teal shadow */
            transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }
         .hover-lift-subtle:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.07);
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        /* Subtle Entry Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
         @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* Apply animations */
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; /* Start hidden */ }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out forwards; opacity: 0; /* Start hidden */ }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; opacity: 0; /* Start hidden */ }

        /* Add animation delays for staggered effect */
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }

        /* Logo Scroller Animation */
        @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); } /* Move left by the width of one set of logos */
        }

        .logo-scroller .scroller-inner {
            display: flex;
            flex-wrap: nowrap;
            width: fit-content;
            animation: scroll-left 40s linear infinite;
        }
        .logo-scroller:hover .scroller-inner { animation-play-state: paused; }
        .logo-scroller img { height: 40px; margin: 0 2rem; filter: grayscale(100%); opacity: 0.7; transition: filter 0.3s ease, opacity 0.3s ease; }
        .logo-scroller img:hover { filter: grayscale(0%); opacity: 1; }

        /* Testimonial Card Styling */
        .testimonial-card { background-color: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }

        /* Form Input Styling */
        .form-input { width: 100%; border-radius: 0.5rem; border: 1px solid #d1d5db; padding: 0.75rem 1rem; transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
        .form-input:focus { outline: none; border-color: #0d9488; /* teal-600 */ box-shadow: 0 0 0 2px rgba(59, 154, 156, 0.3); }
      `}</style>

      {/* Render current page based on state */}
      {currentPage === 'landing' && <LandingPage navigateTo={navigateTo} />}
      {currentPage === 'login' && <LoginPage navigateTo={navigateTo} />}
    </>
  );
};

export default App; // Export the main App component
