import React, { useState, useEffect, useRef } from 'react';
// Note: 'next/link' and 'next/router' are specific to Next.js projects.
// Replaced Link with <a> and removed useRouter for preview compatibility.

// Note: Assumes Button component is available, likely from shadcn/ui or similar.
// Placeholder Button component for preview if not available in the environment
const Button = ({ children, className, variant, size, ...props }: any) => {
  // Basic styling to mimic a button for preview purposes
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variantStyle = variant === 'outline'
    ? "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
    : "bg-primary text-primary-foreground shadow hover:bg-primary/90";
  const sizeStyle = size === 'lg' ? "h-10 px-4 py-2" : "h-9 px-3 py-2"; // Simplified sizing

  // Combine base, variant, size, and custom classes
  const combinedClassName = [baseStyle, variantStyle, sizeStyle, className].filter(Boolean).join(' ');

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};


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
  PlayCircle,   // Video Placeholder (Not used for actual video tag)
  MapPin,       // Location / NZ/UK Collab (Example)
  Users,        // Collaboration / Team (Example)
  Building,     // Partner Icon Placeholder
  Briefcase,    // Partner Icon Placeholder
  Landmark,     // Partner Icon Placeholder
  University,   // Partner Icon Placeholder
  HeartHandshake, // Partner Icon Placeholder
  LogIn,        // Login Icon
} from 'lucide-react';

// Note: Assumes 'cn' utility function is available, likely from shadcn/ui or similar.
// Placeholder cn function for preview
const cn = (...inputs: any[]) => {
    // Simplified version for joining class names
    return inputs.filter(Boolean).join(' ');
};


// ================================
// Asset Paths (Update with actual paths or URLs)
// ================================
// Using placehold.co for robust placeholders and local public paths for some assets
const HeroImage = 'https://placehold.co/600x400/e0f2f7/37474f?text=Metrix+AI+Platform';
const MetrixAILogo = '/MetrixAI.png'; // Assumes MetrixAI.png is in public folder
const ScribeImage = 'https://placehold.co/600x400/f5f5f4/78716c?text=AI+Scribe';
const PredictionImage = '/Predictive_Screenshot.png'; // Assumes Predictive_Screenshot.png is in public folder
const ChatbotImage = 'https://placehold.co/600x400/f5f5f4/78716c?text=AI+Chatbot';
const TechImage = 'https://placehold.co/600x400/ffffff/a8a29e?text=Deployment';
// === Updated Video Path ===
const DemoVideoPath = '/Patient_Tasks_Video.mp4'; // Path relative to the public folder root

// Example testimonial images using placehold.co with initials
const DrWilliamsPNG = 'https://placehold.co/48x48/ffffff/a8a29e?text=JW';
const AdminJonesPNG = 'https://placehold.co/48x48/ffffff/a8a29e?text=AJ';
const DrLeePNG = 'https://placehold.co/48x48/ffffff/a8a29e?text=SL';

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
          // Robust onError using placehold.co
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            const target = e.currentTarget;
            target.onerror = null; // Prevent infinite loop if placeholder fails
            const initials = testimonial.name.split(' ').map((n) => n[0]).join('');
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
      viewport={{ once: true }} // Animate only once when it enters the viewport
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
  // State to control the visibility of features for animation trigger
  const [showFeatures, setShowFeatures] = useState(false);
  // Ref to the features section to observe intersection
  const featuresRef = useRef<HTMLDivElement>(null);

  // Effect to observe when the features section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the element is intersecting (visible)
        if (entry.isIntersecting) {
          setShowFeatures(true); // Trigger the animation state
          // Stop observing once triggered (optional, good for performance)
          if (featuresRef.current) {
            observer.unobserve(featuresRef.current);
          }
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );

    // Start observing the features section if the ref is attached
    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    // Cleanup function to unobserve when the component unmounts
    return () => {
      const currentRef = featuresRef.current;
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // CSS for the scrolling animation (defined within the component for self-containment)
  const scrollAnimationStyle = `
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); } /* Scroll one full set of logos */
    }
    .animate-scroll {
      /* Apply the animation */
      animation: scroll 30s linear infinite;
    }
  `;

  return (
    // Main container with background and font settings
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Inject the CSS animation styles into the head */}
      <style>{scrollAnimationStyle}</style>

      {/* ========================== Hero Section ========================== */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-white via-stone-50 to-stone-100 overflow-hidden">
        {/* Increased horizontal padding for wider layout */}
        {/* Make container relative to position the login button */}
        <div className="relative z-10 container mx-auto px-16">

          {/* === Login Button - Top Right === */}
          <div className="absolute top-4 right-16 z-20">
            <a href="/login">
              <Button
                variant="outline"
                className="text-stone-700 border-stone-300 hover:bg-stone-100 hover:text-stone-900 transition-colors duration-200 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </a>
          </div>
          {/* === End Login Button === */}


          <div className="grid md:grid-cols-2 gap-8 items-center pt-12 md:pt-0">
            {/* Left side: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="space-y-6"
            >
              {/* Logo and Title */}
              <div className="flex items-center gap-4">
                <img
                  src={MetrixAILogo}
                  alt="Metrix AI Logo"
                  className="h-12 w-12 rounded-full"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = 'https://placehold.co/48x48/3D7F80/ffffff?text=MAI'; // Fallback
                  }}
                />
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80]"
                  whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  Metrix AI
                </motion.h1>
              </div>
              {/* Subtitle */}
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900">
                  Intelligent Clinical Workflow: Scribe, Predict, Decide
              </h2>
              {/* Description */}
              <p className="text-lg text-stone-700">
                Empowering clinicians and healthcare organizations with cutting-edge AI. Slash documentation time, predict ED flow, get instant decision support, and choose secure cloud or on-site deployment.
              </p>
              {/* Call to Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {/* Start Free Trial Button */}
                <a href="/login">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#2D4F6C] to-[#3D7F80] text-white hover:from-[#254058] hover:to-[#316667] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                  >
                    <motion.span
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <Zap className="w-5 h-5" />
                      Start Free Trial
                    </motion.span>
                  </Button>
                </a>
                {/* Explore Features Button */}
                <a href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-stone-700 border-stone-300 hover:bg-stone-100 hover:text-stone-900 transition-colors duration-200"
                  >
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
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/e0f2f7/37474f?text=Metrix+AI+Platform';
                }}
              />
              {/* Decorative element */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-tr from-[#68A9A9]/30 to-[#3D7F80]/30 rounded-full blur-xl"></div>
            </motion.div>
          </div>
        </div>
        {/* Background Animated Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#68A9A9]/20 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3D7F80]/20 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
        {/* CSS for blob animation */}
        <style jsx global>{`
            @keyframes blob {
              0% { transform: translate(0px, 0px) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
              100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob {
              animation: blob 7s infinite;
            }
            .animation-delay-2000 {
              animation-delay: 2s;
            }
            .animation-delay-4000 {
              animation-delay: 4s;
            }
        `}</style>
      </section>

      {/* ========================== AI Scribe Section ========================== */}
      <section id="scribe" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900">Effortless Real-Time Documentation</h2>
              <p className="text-lg text-stone-700">
                Reclaim your time with our highly accurate AI clinical scribe. It listens to patient encounters and automatically generates structured clinical notes, ready for your review and EHR integration. Focus more on patient care, less on typing.
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600 pt-2">
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Significantly reduced documentation time</motion.li>
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Improved note accuracy and completeness</motion.li>
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Enhanced focus on direct patient interaction</motion.li>
              </ul>
            </motion.div>
            {/* Image */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <img
                src={ScribeImage}
                alt="Metrix AI scribe interface showing real-time transcription"
                className="rounded-xl shadow-lg border border-stone-200 w-full"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/f5f5f4/78716c?text=AI+Scribe';
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================== ED Prediction Section ========================== */}
      <section id="predictions" className="py-16 md:py-24 bg-stone-100">
        <div className="container mx-auto px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <motion.div
              className="md:order-last"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <img
                src={PredictionImage}
                alt="Dashboard showing ED prediction metrics"
                className="rounded-xl shadow-lg border border-stone-200 w-full"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/ffffff/a8a29e?text=ED+Predictions';
                }}
              />
            </motion.div>
            {/* Text Content */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900">Proactive ED Flow Management</h2>
              <p className="text-lg text-stone-700">
                Gain valuable foresight with our state-of-the-art ED prediction tools. Predict patient length of stay, likelihood of admission, and overall department busyness to optimize staffing, resource allocation, and patient flow.
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
        <div className="container mx-auto px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900">AI-Powered Clinical Decision Support</h2>
              <p className="text-lg text-stone-700">
                Access critical information instantly with our curated AI chatbot. Ask questions about diagnostic criteria, treatment guidelines, medication interactions, or clinical scoring systems, receiving evidence-based answers in seconds.
              </p>
              <ul className="list-disc list-inside space-y-2 text-stone-600 pt-2">
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Streamline diagnostic & treatment planning</motion.li>
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Improve adherence to guidelines</motion.li>
                  <motion.li whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>Reduce time spent searching</motion.li>
              </ul>
            </motion.div>
            {/* Image */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <img
                src={ChatbotImage}
                alt="Metrix AI chatbot interface answering a clinical query"
                className="rounded-xl shadow-lg border border-stone-200 w-full"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/f5f5f4/78716c?text=AI+Chatbot';
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================== Technology / Models Section ========================== */}
      <section id="technology" className="py-16 md:py-24 bg-stone-100">
        <div className="container mx-auto px-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center">
              Secure, Flexible, Clinician-Developed AI
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div variants={itemVariants} className="space-y-4">
                <p className="text-lg text-stone-700">
                  Built by clinicians in NZ and the UK, Metrix AI understands the nuances of clinical practice. Benefit from transparent, auditable AI or leverage our high-performance, custom fine-tuned models for maximum accuracy and efficiency.
                </p>
                <p className="text-lg text-stone-700">
                  Choose the deployment model that fits your needs: secure cloud or on-site hosting for complete data control. Our platform integrates seamlessly with existing EHR systems.
                </p>
                <ul className="list-none space-y-3 text-stone-700 pt-2">
                    <motion.li whileHover={{ scale: 1.05, x: 5 }} transition={{ type: 'spring', stiffness: 300 }} className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#2D4F6C]" /> Secure On-Site Deployment Option
                    </motion.li>
                    <motion.li whileHover={{ scale: 1.05, x: 5 }} transition={{ type: 'spring', stiffness: 300 }} className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-[#68A9A9]" /> Robust Secure Cloud Platform
                    </motion.li>
                    <motion.li whileHover={{ scale: 1.05, x: 5 }} transition={{ type: 'spring', stiffness: 300 }} className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-[#3D7F80]" /> Custom Fine-Tuned LLMs
                    </motion.li>
                    <motion.li whileHover={{ scale: 1.05, x: 5 }} transition={{ type: 'spring', stiffness: 300 }} className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#68A9A9]" /> Developed by NZ/UK Clinicians
                    </motion.li>
                </ul>
              </motion.div>
              {/* Image */}
              <motion.div variants={itemVariants}>
                <motion.img
                  src={TechImage}
                  alt="Diagram showing cloud vs on-site deployment options"
                  className="rounded-xl shadow-lg border border-stone-200 w-full"
                  whileHover={{ scale: 1.03, rotate: -2 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = 'https://placehold.co/600x400/ffffff/a8a29e?text=Deployment';
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================== See Features in Action Section ========================== */}
      <section id="demo-video" className="py-16 md:py-24 bg-white text-center">
        <div className="container mx-auto px-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 mb-6">
            See Metrix AI in Action
          </h2>
          <p className="text-lg text-stone-700 max-w-3xl mx-auto mb-8">
            Watch this brief overview demonstrating how Metrix AI streamlines documentation, provides predictive insights, and supports clinical decisions directly within your workflow.
          </p>
          {/* === Updated Video Section === */}
          <div className="max-w-4xl mx-auto">
            {/* Use HTML <video> tag */}
            <video
              controls // Show browser default controls (play/pause, volume, etc.)
              preload="metadata" // Hint to browser to load video metadata (duration, dimensions)
              className="rounded-lg shadow-lg w-full border border-stone-300 bg-stone-200" // Styling to match previous placeholder
              src={DemoVideoPath} // Use the constant pointing to the video file in /public
              // Optional: Add a poster image (shown before loading/playing)
              // poster="/path/to/your/video_poster.jpg"
            >
              {/* Fallback message for browsers that don't support the video tag */}
              Your browser does not support the video tag. You can download the video
              <a href={DemoVideoPath} download className="underline ml-1">here</a>.
            </video>
          </div>
          {/* === End Updated Video Section === */}
        </div>
      </section>

      {/* ========================== Testimonials Section ========================== */}
      <section className="py-16 md:py-24 bg-stone-100">
        <div className="container mx-auto px-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center mb-12">
            Trusted by Clinicians & Administrators
          </h2>
          {/* Grid for Testimonials */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Map through testimonials data and render TestimonialCard */}
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================== Key Features Section ========================== */}
      <section id="features" className="py-16 md:py-24 bg-white" ref={featuresRef}>
        <div className="container mx-auto px-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-stone-900 text-center mb-12">
            Comprehensive AI Clinical Toolkit
          </h2>
          {/* AnimatePresence handles the appearance of features */}
          <AnimatePresence>
            {showFeatures && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {/* Feature Cards */}
                <FeatureCard
                  title="AI Clinical Scribe"
                  description="Real-time, accurate documentation from patient encounters."
                  icon={<FileText className="w-10 h-10" />}
                  iconColor="text-[#3D7F80]"
                />
                <FeatureCard
                  title="ED Predictive Analytics"
                  description="Forecast Length of Stay, admission likelihood, and department load."
                  icon={<TrendingUp className="w-10 h-10" />}
                  iconColor="text-[#2D4F6C]"
                />
                <FeatureCard
                  title="AI Decision Support"
                  description="Chatbot access to test/treatment info, guidelines, scores."
                  icon={<Bot className="w-10 h-10" />}
                  iconColor="text-[#3D7F80]"
                />
                <FeatureCard
                  title="Flexible Deployment"
                  description="Choose secure cloud hosting or on-site for data control."
                  icon={<ShieldCheck className="w-10 h-10" />}
                  iconColor="text-[#2D4F6C]"
                />
                <FeatureCard
                  title="Seamless EHR Integration"
                  description="Integrate effortlessly with popular EHR systems."
                  icon={<BadgeCheck className="w-10 h-10" />}
                  iconColor="text-[#68A9A9]"
                />
                <FeatureCard
                  title="Clinician-Developed"
                  description="Designed by practicing clinicians (NZ/UK) for real-world use."
                  icon={<Users className="w-10 h-10" />}
                  iconColor="text-[#68A9A9]"
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Loading indicator */}
          {!showFeatures && <div className="text-center text-stone-500">Loading features...</div>}
        </div>
      </section>

      {/* ========================== Funding Partners Section ========================== */}
      <section id="partners" className="py-12 bg-white">
        <div className="container mx-auto px-16">
          <h3 className="text-center text-xl font-semibold text-stone-600 mb-8">
            Our Funding Partners & Supporters
          </h3>
          {/* Container for scrolling animation */}
          <div className="w-full overflow-hidden relative">
            {/* Flex container with doubled icons */}
            <div className="flex animate-scroll">
              {[...partnerIcons, ...partnerIcons].map((partner, index) => (
                <div
                  key={index}
                  className="mx-10 flex-shrink-0 flex items-center justify-center"
                  title={partner.name}
                >
                  <partner.icon className="h-12 w-12 text-stone-400 hover:text-stone-600 transition-colors" />
                </div>
              ))}
            </div>
            {/* Fades on the edges */}
            <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* ========================== Footer ========================== */}
      <footer className="py-8 bg-stone-100 border-t border-stone-200">
        <div className="container mx-auto px-16 text-center text-stone-500 text-sm">
          {/* Copyright and Links */}
          &copy; {new Date().getFullYear()} Metrix AI. All rights reserved. |{' '}
          <a href="/privacy" className="hover:text-stone-800 transition-colors">
            Privacy Policy
          </a>{' '}
          |{' '}
          <a href="/terms" className="hover:text-stone-800 transition-colors">
            Terms of Service
          </a>
          {/* Collaboration Info */}
          <p className="mt-2 text-xs">
            Developed in collaboration between clinicians in New Zealand <MapPin className="inline h-3 w-3 mx-1" /> & the United Kingdom <MapPin className="inline h-3 w-3 mx-1" />.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Export the component as default
export default MetrixAIHomePage;
