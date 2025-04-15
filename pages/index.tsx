import React, { useState, useEffect, useRef } from 'react';
// Note: 'next/link' and 'next/router' are specific to Next.js projects.
// Replaced Link with <a> and removed useRouter for preview compatibility.
// import Link from 'next/link'; // Removed for preview
// import { useRouter } from 'next/router'; // Removed for preview

// Note: Assumes Button component is available, likely from shadcn/ui or similar.
import { Button } from '@/components/ui/button';

// Framer Motion for animations
import { motion, AnimatePresence } from 'framer-motion';
// Lucide icons for React - Added new icons
import {
  Zap,          // CTA
  ShieldCheck,  // Security / On-Site
  BrainCircuit, // AI / Models
  Code2,        // Open Source / Templates
  FileText,     // Scribe / Documentation
  BadgeCheck,   // EHR / Compliance
  Rocket,       // Improvement / Customization
  TrendingUp,   // ED Predictions
  Bot,          // AI Chatbot / Decision Support
  PlayCircle,   // Video Placeholder
  MapPin,       // Location / NZ/UK Collab (Example)
  Users,        // Collaboration / Team (Example)
  Building,     // Partner Icon Placeholder
  Briefcase,    // Partner Icon Placeholder
  Landmark,     // Partner Icon Placeholder
  University,   // Partner Icon Placeholder
  HeartHandshake, // Partner Icon Placeholder
} from 'lucide-react';
// Note: Assumes 'cn' utility function is available, likely from shadcn/ui or similar.
import { cn } from '@/lib/utils';

// ================================
// Placeholder Image References (Update with actual paths)
// ================================
const HeroImage = '/hero-concept.png'; // e.g., Image showing multi-feature concept
const MetrixAILogo = '/MetrixAI.png';
const ScribeImage = '/scribe-feature.png'; // Image focused on scribe feature
const PredictionImage = '/prediction-dashboard.png'; // Image concept for ED predictions
const ChatbotImage = '/chatbot-interface.png'; // Image concept for chatbot
const TechImage = '/deployment-options.png'; // Image showing cloud/on-site concept
const VideoPlaceholderImage = '/video-thumbnail.png'; // Thumbnail for demo video

// Example testimonial images: (Consider getting testimonials covering different features/roles)
const DrSmithPNG = '/dr-smith.png';    // Needs to be in /public
const DrWilliamsPNG = '/dr-williams.png';// Needs to be in /public
const DrLeePNG = '/dr-lee.png';        // Needs to be in /public
const AdminJonesPNG = '/admin-jones.png'; // Example organizational role

// ================================
// Updated Testimonial Data (Example - Tailor to real testimonials)
// ================================
const testimonials = [
  {
    name: 'Dr. John Williams',
    title: 'Emergency Physician',
    quote:
      "The AI scribe is a game-changer in the fast-paced ER, cutting my documentation time significantly. The ED prediction tool also gives valuable insights into patient flow.",
    image: DrWilliamsPNG,
  },
  {
    name: 'Ms. Admin Jones',
    title: 'Hospital Administrator',
    quote:
      "Metrix AI's on-site deployment option met our stringent data security requirements. The platform has improved efficiency across our clinical teams.",
    image: AdminJonesPNG, // Use placeholder or actual image
  },
  {
    name: 'Dr. Sarah Lee',
    title: 'Oncologist',
    quote:
      "The AI chatbot helps me quickly access relevant treatment guidelines and scoring systems during complex consultations. It's like having an expert assistant.",
    image: DrLeePNG,
  },
];

// ================================
// Animation Variants for Framer Motion
// ================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

// ================================
// Testimonial Card Component
// ================================
const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
  <motion.div
    className="bg-white rounded-xl p-6 shadow-md border border-stone-200 transition-all duration-300 flex flex-col justify-between h-full"
    variants={itemVariants}
    whileHover={{ scale: 1.03, y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  >
    <div className="space-y-4 flex-grow">
      <p className="text-stone-700 italic">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="flex items-center gap-4 pt-4">
        <motion.img
          src={testimonial.image}
          alt={testimonial.name}
          className="h-12 w-12 rounded-full object-cover border border-stone-200"
          whileHover={{ scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            const initials = testimonial.name.split(' ').map(n => n[0]).join('');
            target.src = `https://placehold.co/48x48/ffffff/a8a29e?text=${initials}`;
          }}
        />
        <div>
          <h4 className="text-stone-900 font-semibold">{testimonial.name}</h4>
          <p className="text-stone-500 text-sm">{testimonial.title}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

// ================================
// Feature Card Component
// ================================
const FeatureCard = ({
  title,
  description,
  icon,
  iconColor = 'text-[#3D7F80]', // Default to medium teal
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor?: string;
}) => {
  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-md border border-stone-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex flex-col items-start h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <motion.div
        className={cn("mb-4", iconColor)}
        whileHover={{ rotate: 15 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-700 flex-grow">{description}</p>
    </motion.div>
  );
};

// ================================
// Funding Partner Icons Data (Placeholder)
// ================================
const partnerIcons = [
  { name: "Partner A", icon: Building },
  { name: "Partner B", icon: Briefcase },
  { name: "Partner C", icon: Landmark },
  { name: "Partner D", icon: University },
  { name: "Partner E", icon: HeartHandshake },
];

// ================================
// Main Metrix AI Home Page Component
// ================================
const MetrixAIHomePage = () => {
  const [showFeatures, setShowFeatures] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowFeatures(true);
          if (featuresRef.current) {
             observer.unobserve(featuresRef.current);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      const currentRef = featuresRef.current;
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // CSS for the scrolling animation (defined within the component for self-containment)
  const scrollAnimationStyle = `
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-scroll {
      animation: scroll 30s linear infinite;
    }
  `;

  return (
    // Main container
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Inject the CSS animation styles */}
      <style>{scrollAnimationStyle}</style>

      {/* ========================== Hero Section ========================== */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-white via-stone-50 to-stone-100 overflow-hidden">
        {/* Increased horizontal padding: px-16 */}
        <div className="relative z-10 container mx-auto px-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left side: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <img src={MetrixAILogo} alt="Metrix AI Logo" className="h-12 w-12 rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/ffffff/a8a29e?text=MAI'; }}/>
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80]" // Navy to Medium Teal
                  whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  Metrix AI
                </motion.h1>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900">
                 Intelligent Clinical Workflow: Scribe, Predict, Decide
              </h2>
              <p className="text-lg text-stone-700">
                Empowering clinicians and healthcare organizations with cutting-edge AI. Slash documentation time, predict ED flow, get instant decision support, and choose secure cloud or on-site deployment.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/free-trial" >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80] text-white hover:from-[#254058] hover:to-[#316667] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                  >
                    <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                      <Zap className="w-5 h-5" />
                      Start Free Trial
                    </motion.span>
                  </Button>
                </a>
                 <a href="#features" >
                   <Button variant="outline" size="lg" className="text-stone-700 border-stone-300 hover:bg-stone-100 hover:text-stone-900 transition-colors duration-200">
                     Explore Features
                   </Button>
                 </a>
              </div>
            </motion.div>

            {/* Right side: Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="relative mt-8 md:mt-0"
            >
              <motion.img
                src={HeroImage}
                alt="Metrix AI platform showing scribe, predictions and chatbot features"
                className="rounded-xl shadow-lg border border-stone-200 w-full max-w-md mx-auto"
                whileHover={{ scale: 1.03, rotate: 2 }}
                transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                 onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/ffffff/a8a29e?text=Metrix+AI+Platform'; }}
              />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-tr from-[#68A9A9]/30 to-[#3D7F80]/30 rounded-full blur-xl"></div>
            </motion.div>
          </div>
        </div>
        {/* Background Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#68A9A9]/20 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3D7F80]/20 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
      </section>

      {/* ========================== AI Scribe Section ========================== */}
      <section id="scribe" className="py-16 md:py-24 bg-white">
        {/* Increased horizontal padding: px-16 */}
        <div className="container mx-auto px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900">Effortless Real-Time Documentation</h2>
              <p className="text-lg text-stone-700">
                Reclaim your time with our highly accurate AI clinical scribe... {/* Content shortened for brevity */}
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600 pt-2">
                <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Significantly reduced documentation time</motion.li>
                <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Improved note accuracy and completeness</motion.li>
                <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Enhanced focus on direct patient interaction</motion.li>
              </ul>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
              <img src={ScribeImage} alt="Metrix AI scribe interface showing real-time transcription" className="rounded-xl shadow-lg border border-stone-200 w-full" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f5f5f4/78716c?text=AI+Scribe'; }}/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================== ED Prediction Section ========================== */}
      <section id="predictions" className="py-16 md:py-24 bg-stone-100">
        {/* Increased horizontal padding: px-16 */}
        <div className="container mx-auto px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div className="md:order-last" whileHover={{ scale: 1.03 }} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
              <img src={PredictionImage} alt="Dashboard showing ED prediction metrics" className="rounded-xl shadow-lg border border-stone-200 w-full" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/ffffff/a8a29e?text=ED+Predictions'; }}/>
            </motion.div>
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900">Proactive ED Flow Management</h2>
              <p className="text-lg text-stone-700">
                Gain valuable foresight with our state-of-the-art ED prediction tools... {/* Content shortened for brevity */}
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600 pt-2">
                 <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Optimize resource planning and staffing</motion.li>
                 <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Identify potential bottlenecks proactively</motion.li>
                 <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Enhance situational awareness for teams</motion.li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================== AI Chatbot Section ========================== */}
      <section id="chatbot" className="py-16 md:py-24 bg-white">
        {/* Increased horizontal padding: px-16 */}
        <div className="container mx-auto px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900">AI-Powered Clinical Decision Support</h2>
              <p className="text-lg text-stone-700">
                Access critical information instantly with our curated AI chatbot... {/* Content shortened for brevity */}
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600 pt-2">
                 <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Streamline diagnostic & treatment planning</motion.li>
                 <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Improve adherence to guidelines</motion.li>
                 <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Reduce time spent searching</motion.li>
              </ul>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
              <img src={ChatbotImage} alt="Metrix AI chatbot interface answering a clinical query" className="rounded-xl shadow-lg border border-stone-200 w-full" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f5f5f4/78716c?text=AI+Chatbot'; }}/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================== Technology / Models Section ========================== */}
      <section id="technology" className="py-16 md:py-24 bg-stone-100">
        {/* Increased horizontal padding: px-16 */}
        <div className="container mx-auto px-16">
          <motion.div initial="hidden" whileInView="visible" variants={containerVariants} viewport={{ once: true }} className="space-y-8">
            <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center">Secure, Flexible, Clinician-Developed AI</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={itemVariants} className="space-y-4">
                <p className="text-lg text-stone-700">
                  Built by clinicians in NZ and the UK... **Benefit from transparent, auditable AI or leverage our high-performance, custom fine-tuned models...** {/* Content shortened for brevity */}
                </p>
                <p className="text-lg text-stone-700">
                  Choose the deployment model that fits your needs: secure cloud or on-site hosting... {/* Content shortened for brevity */}
                </p>
                <ul className="list-disc list-inside space-y-2 text-stone-600 pt-2">
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}> <ShieldCheck className="inline w-5 h-5 mr-2 text-[#2D4F6C]" /> Secure On-Site Deployment</motion.li>
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}> <BadgeCheck className="inline w-5 h-5 mr-2 text-[#68A9A9]" /> Robust Secure Cloud Platform</motion.li>
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}> <BrainCircuit className="inline w-5 h-5 mr-2 text-[#3D7F80]" /> Custom Fine-Tuned LLMs</motion.li>
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}> <Users className="inline w-5 h-5 mr-2 text-[#68A9A9]" /> Developed by NZ/UK Clinicians</motion.li>
                </ul>
              </motion.div>
              <motion.div variants={itemVariants}>
                <motion.img src={TechImage} alt="Diagram showing cloud vs on-site deployment options" className="rounded-xl shadow-lg border border-stone-200 w-full" whileHover={{ scale: 1.03, rotate: -2 }} transition={{ type: 'spring', stiffness: 100 }} onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/ffffff/a8a29e?text=Deployment'; }}/>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

       {/* ========================== See Features in Action Section ========================== */}
      <section id="demo-video" className="py-16 md:py-24 bg-white text-center">
          {/* Increased horizontal padding: px-16 */}
          <div className="container mx-auto px-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 mb-6">See Metrix AI in Action</h2>
              <p className="text-lg text-stone-700 max-w-3xl mx-auto mb-8">
                  Watch this brief overview demonstrating how Metrix AI streamlines documentation... {/* Content shortened for brevity */}
              </p>
              <motion.div
                  className="relative max-w-4xl mx-auto aspect-video bg-stone-200 rounded-lg shadow-lg overflow-hidden cursor-pointer group border border-stone-300"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                  <img src={VideoPlaceholderImage} alt="Video placeholder thumbnail" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/1280x720/e5e7eb/a8a29e?text=Demo+Video'; }}/>
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-white/80 transition-all duration-300 group-hover:text-white group-hover:scale-110" />
                  </div>
              </motion.div>
          </div>
      </section>

      {/* ========================== Testimonials Section ========================== */}
      <section className="py-16 md:py-24 bg-stone-100">
        {/* Increased horizontal padding: px-16 */}
        <div className="container mx-auto px-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center mb-12">
            Trusted by Clinicians & Administrators
          </h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================== Key Features Section ========================== */}
      <section id="features" className="py-16 md:py-24 bg-white" ref={featuresRef}>
        {/* Increased horizontal padding: px-16 */}
        <div className="container mx-auto px-16">
           <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center mb-12">
            Comprehensive AI Clinical Toolkit
          </h2>
          <AnimatePresence>
            {showFeatures && (
              <motion.div
                variants={containerVariants} initial="hidden" animate="visible" exit="hidden"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                <FeatureCard title="AI Clinical Scribe" description="Real-time, accurate documentation..." icon={<FileText className="w-10 h-10" />} iconColor="text-[#3D7F80]" />
                <FeatureCard title="ED Predictive Analytics" description="Forecast Length of Stay, admission..." icon={<TrendingUp className="w-10 h-10" />} iconColor="text-[#2D4F6C]" />
                <FeatureCard title="AI Decision Support" description="Chatbot access to test/treatment info..." icon={<Bot className="w-10 h-10" />} iconColor="text-[#3D7F80]" />
                <FeatureCard title="Flexible Deployment" description="Choose secure cloud hosting or on-site..." icon={<ShieldCheck className="w-10 h-10" />} iconColor="text-[#2D4F6C]" />
                <FeatureCard title="Seamless EHR Integration" description="Integrate effortlessly with popular EHRs." icon={<BadgeCheck className="w-10 h-10" />} iconColor="text-[#68A9A9]" />
                <FeatureCard title="Clinician-Developed" description="Designed by practicing clinicians (NZ/UK)." icon={<Users className="w-10 h-10" />} iconColor="text-[#68A9A9]" />
              </motion.div>
            )}
          </AnimatePresence>
           {!showFeatures && ( <div className="text-center text-stone-500">Loading features...</div> )}
        </div>
      </section>

      {/* ========================== Funding Partners Section ========================== */}
      <section id="partners" className="py-12 bg-white">
        {/* Increased horizontal padding: px-16 */}
        <div className="container mx-auto px-16">
          <h3 className="text-center text-xl font-semibold text-stone-600 mb-8">Our Funding Partners & Supporters</h3>
          <div className="w-full overflow-hidden relative">
            <div className="flex animate-scroll">
              {[...partnerIcons, ...partnerIcons].map((partner, index) => (
                <div key={index} className="mx-10 flex-shrink-0 flex items-center justify-center" title={partner.name}>
                  <partner.icon className="h-12 w-12 text-stone-400 hover:text-stone-600 transition-colors" />
                </div>
              ))}
            </div>
             <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent"></div>
             <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent"></div>
          </div>
        </div>
      </section>

      {/* ========================== Footer ========================== */}
      <footer className="py-8 bg-stone-100 border-t border-stone-200">
        {/* Increased horizontal padding: px-16 */}
        <div className="container mx-auto px-16 text-center text-stone-500 text-sm">
          &copy; {new Date().getFullYear()} Metrix AI. All rights reserved. | <a href="/privacy" className="hover:text-stone-800 transition-colors">Privacy Policy</a> | <a href="/terms" className="hover:text-stone-800 transition-colors">Terms of Service</a>
          <p className="mt-2 text-xs">Developed in collaboration between clinicians in New Zealand <MapPin className="inline h-3 w-3 mx-1"/> & the United Kingdom <MapPin className="inline h-3 w-3 mx-1"/>.</p>
        </div>
      </footer>
    </div>
  );
};

export default MetrixAIHomePage;

