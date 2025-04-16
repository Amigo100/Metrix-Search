import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Import Link for the back button
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui Button
import { Input } from '@/components/ui/input'; // Assuming shadcn/ui Input
import { Label } from '@/components/ui/label'; // Assuming shadcn/ui Label
import { motion } from 'framer-motion';
import { Lock, User, KeyRound, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { cn } from "@/lib/utils"; // Assuming shadcn/ui utility

// Define styles consistent with index page's form-input using Tailwind directly
// In a real app, this might be a shared style or component
const formInputStyles = "block w-full rounded-lg border border-gray-300 py-3 px-4 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400";
const formInputWithIconStyles = `${formInputStyles} pl-10`; // Add padding for icon

const LoginPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    // Simulate an API call (replace with your actual authentication logic)
    try {
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demonstration: "test@example.com" with password "password" logs in
      // Using the credentials from the original code snippet
      if (email === 'alexdeighton@metrixai.com' && password === 'Alexander') {
        // Redirect to the dashboard
        router.push('/dashboard'); // Assuming a dashboard route
        return;
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError(`An error occurred: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Updated background to light theme
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-50 to-white text-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Metrix Logo */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
        >
            <Link href="/" legacyBehavior>
                <a className="flex items-center space-x-2 cursor-pointer">
                    <img
                        src="/images/metrix-logo.png" // Ensure this path is correct
                        alt="Metrix Logo"
                        width={40} // Adjust size as needed
                        height={40}
                        className="h-10 w-10"
                    />
                     <span className="font-bold text-3xl text-gray-800">Metrix</span>
                </a>
            </Link>
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }} // Stagger animation
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900"> {/* Updated text color */}
              Sign in to Metrix
            </h2>
            <p className="mt-2 text-sm text-gray-600"> {/* Updated text color */}
              Welcome back! Please enter your credentials.
            </p>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          // Updated card style to light theme
          className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Removed rounded-md shadow-sm wrapper */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-address" className="sr-only">
                  Email address
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> {/* Adjusted icon color */}
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    // Applied updated input styles
                    className={cn(
                      formInputWithIconStyles, // Use defined style
                      error && "border-red-500 focus:ring-red-500 focus:border-red-500" // Error state
                    )}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="sr-only">
                  Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> {/* Adjusted icon color */}
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                     // Applied updated input styles
                    className={cn(
                      formInputWithIconStyles, // Use defined style
                      error && "border-red-500 focus:ring-red-500 focus:border-red-500" // Error state
                    )}
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center" role="alert"> {/* Adjusted error text color */}
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  // Updated checkbox style
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700"> {/* Updated label color */}
                  Remember me
                </Label>
              </div>

              <div className="text-sm">
                <a
                  href="#" // Add password reset link if available
                  // Updated link style
                  className="font-medium text-teal-600 hover:text-teal-500 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                // Updated button style to match landing page
                className={cn(
                  "group relative w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300 ease-in-out",
                  loading
                    ? "bg-gray-400 cursor-not-allowed" // Adjusted loading style
                    : "bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700", // Teal gradient
                  "disabled:opacity-70 disabled:cursor-not-allowed"
                )}
                disabled={loading}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {/* Adjusted icon color */}
                  <Lock className="h-5 w-5 text-teal-300 group-hover:text-teal-100" aria-hidden="true" />
                </span>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </motion.div>
        <div className="text-center">
          <p className="text-sm text-gray-600"> {/* Updated text color */}
            Need access?{' '}
            <Link href="/#contact" legacyBehavior> {/* Link to contact section on landing page */}
                <a className="font-medium text-teal-600 hover:text-teal-500 hover:underline">
                    Request Demo
                </a>
            </Link>
          </p>
           <div className="mt-4">
                <Link href="/" legacyBehavior>
                    <a className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-teal-600 group">
                        <ArrowLeft className="h-4 w-4 mr-1 transition-transform duration-200 ease-in-out group-hover:-translate-x-1" />
                        Back to Home
                    </a>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
