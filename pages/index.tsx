import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ShieldCheck,
  BrainCircuit,
  Code2,
  FileText,
  BadgeCheck,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ================================
// PNG image references (place them in /public folder)
// ================================
const HeroImage = '/hero.png';            // e.g. a hero banner image
const MetrixAILogo = '/MetrixAI.png';     // your Metrix AI logo
const ScribeImage = '/scribe.png';        // depicts a scribe or medical notes
const AIMODELSPNG = '/models.png';        // AI/medical conceptual image

// Example testimonial images:
const DrSmithPNG = '/dr-smith.png';
const DrWilliamsPNG = '/dr-williams.png';
const DrLeePNG = '/dr-lee.png';

// Testimonial Data
const testimonials = [
  {
    name: 'Dr. Emily Smith',
    title: 'Cardiologist',
    quote:
      "Metrix AI has revolutionized my practice. The on-site scribe is incredibly accurate, and I've seen a significant reduction in my documentation time.",
    image: DrSmithPNG,
  },
  {
    name: 'Dr. John Williams',
    title: 'Emergency Physician',
    quote:
      "The real-time documentation feature is a game-changer in the fast-paced ER environment. It allows me to focus on patient care without worrying about charting.",
    image: DrWilliamsPNG,
  },
  {
    name: 'Dr. Sarah Lee',
    title: 'Oncologist',
    quote:
      "I was initially concerned about data security, but Metrix AI's on-site deployment and HIPAA compliance have put my mind at ease. The customizable templates are also a huge plus.",
    image: DrLeePNG,
  },
];

// Animation variants
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

// Testimonial Card Component
const TestimonialCard = ({ testimonial }: any) => (
  <motion.div
    className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 transition-all duration-300
               flex flex-col justify-between"
    variants={itemVariants}
    whileHover={{ scale: 1.03, y: -5 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  >
    <div className="space-y-4 flex-grow">
      <p className="text-gray-300 italic">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="flex items-center gap-4">
        <motion.img
          src={testimonial.image}
          alt={testimonial.name}
          className="h-12 w-12 rounded-full"
          whileHover={{ scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        />
        <div>
          <h4 className="text-white font-semibold">{testimonial.name}</h4>
          <p className="text-gray-400 text-sm">{testimonial.title}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const FeatureCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <motion.div
      className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 transition-all duration-300
                 hover:shadow-xl hover:scale-[1.02] flex flex-col items-start h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <motion.div className="mb-4">{icon}</motion.div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </motion.div>
  );
};

const MetrixAIHomePage = () => {
  const router = useRouter();
  const [showFeatures, setShowFeatures] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowFeatures(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-gray-900 via-gray-950 to-black overflow-hidden">
        {/* Content wrapper => ensures we can place overlay behind content */}
        <div className="relative z-20 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="space-y-6"
            >
              {/* Logo */}
              <div className="flex items-center gap-4">
                <img
                  src={MetrixAILogo}
                  alt="Metrix AI Logo"
                  className="h-12 w-12 rounded-full"
                />
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  Metrix AI
                </motion.h1>
              </div>
              <p className="text-lg sm:text-xl text-gray-300">
                The Future of Clinical Documentation
              </p>
              <p className="text-lg sm:text-xl text-gray-300">
                Empowering healthcare professionals with cutting-edge, on-site AI clinical scribe technology.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login" passHref>
                  <Button
                    asChild
                    variant="default"
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white 
                               hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl 
                               transition-all duration-300 transform hover:scale-105 
                               flex items-center gap-2 relative z-50"
                  >
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <Zap className="w-5 h-5" />
                      Get Started
                    </motion.span>
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="relative"
            >
              <motion.img
                src={HeroImage}
                alt="Metrix AI Clinical Scribe"
                className="rounded-xl shadow-2xl border border-gray-800 w-full max-w-md mx-auto"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </motion.div>
          </div>
        </div>

        {/* Overlay => pointer-events-none so it doesn't block clicks */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/90 opacity-60" />
      </section>

      {/* AI-Powered Efficiency Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-semibold text-white">AI-Powered Efficiency</h2>
              <p className="text-lg text-gray-300">
                Metrix AI is dedicated to revolutionizing clinical documentation. Our advanced,
                on-site AI solutions streamline workflows and improve patient care. We leverage
                cutting-edge technology to reduce administrative burden and empower healthcare
                providers to focus on what truly matters: their patients.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <motion.li
                  whileHover={{ scale: 1.1, color: '#60a5fa' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Reduced documentation time
                </motion.li>
                <motion.li
                  whileHover={{ scale: 1.1, color: '#60a5fa' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Improved accuracy and efficiency
                </motion.li>
                <motion.li
                  whileHover={{ scale: 1.1, color: '#60a5fa' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Enhanced focus on patient care
                </motion.li>
              </ul>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <img
                src={ScribeImage}
                alt="AI-Powered Clinical Scribe"
                className="rounded-xl shadow-2xl border border-gray-800 w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Models Section */}
      <section className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-white text-center">Our Models</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div variants={itemVariants} className="space-y-4">
                <p className="text-lg text-gray-300">
                  Our platform is built on a foundation of cutting-edge AI, with a focus on on-site
                  deployment. We offer both open-source and proprietary machine learning models,
                  fine-tuned for clinical note generation, providing unparalleled accuracy, security,
                  and efficiency.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-400">
                  <motion.li
                    whileHover={{ scale: 1.1, color: '#60a5fa' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    On-Site Deployment for Enhanced Security
                  </motion.li>
                  <motion.li
                    whileHover={{ scale: 1.1, color: '#60a5fa' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    Open-Source Options for Transparency
                  </motion.li>
                  <motion.li
                    whileHover={{ scale: 1.1, color: '#60a5fa' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    Proprietary Models for Optimized Performance
                  </motion.li>
                  <motion.li
                    whileHover={{ scale: 1.1, color: '#60a5fa' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    Customizable Solutions
                  </motion.li>
                </ul>
              </motion.div>
              <motion.div variants={itemVariants}>
                <motion.img
                  src={AIMODELSPNG}
                  alt="AI Models"
                  className="rounded-xl shadow-2xl border border-gray-800 w-full"
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white text-center mb-12">
            What Our Users Say
          </h2>
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 md:py-24 bg-gray-900" ref={containerRef}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white text-center mb-12">
            Key Features
          </h2>
          <AnimatePresence>
            {showFeatures && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-8"
              >
                <FeatureCard
                  title="On-Site Deployment"
                  description="Maintain full control over your data with our secure, on-premises deployment options."
                  icon={<ShieldCheck className="w-10 h-10 text-blue-400 mb-4" />}
                />
                <FeatureCard
                  title="Open & Proprietary Models"
                  description="Benefit from the flexibility of open-source and the performance of our proprietary AI."
                  icon={<BrainCircuit className="w-10 h-10 text-purple-400 mb-4" />}
                />
                <FeatureCard
                  title="Customizable Solutions"
                  description="Tailor Metrix AI to your specific needs with our flexible customization options."
                  icon={<Code2 className="w-10 h-10 text-green-400 mb-4" />}
                />
                <FeatureCard
                  title="Real-Time Documentation"
                  description="Capture clinical encounters in real-time, reducing administrative burden."
                  icon={<FileText className="w-10 h-10 text-yellow-400 mb-4" />}
                />
                <FeatureCard
                  title="EHR Integration"
                  description="Seamlessly integrate with your existing Electronic Health Record systems."
                  icon={<BadgeCheck className="w-10 h-10 text-pink-400 mb-4" />}
                />
                <FeatureCard
                  title="Enhanced Accuracy"
                  description="Improve the accuracy and completeness of clinical documentation."
                  icon={<Rocket className="w-10 h-10 text-orange-400 mb-4" />}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-400">
          &copy; {new Date().getFullYear()} Metrix AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MetrixAIHomePage;
