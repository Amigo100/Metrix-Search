import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap,
  Brain,
  Hospital,
  Mail,
  Linkedin,
  Search,
  Users,
  MapPin,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import Header from '@/components/Header';

const About = () => {
  const founders = [
    {
      name: 'Dr Alexander Deighton',
      title: 'Co-Founder & CEO',
      image:
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
      linkedin: '#',
    },
    {
      name: 'Dr James Deighton',
      title: 'Co-Founder & CTO',
      image:
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
      linkedin: '#',
    },
    {
      name: 'Dr Rozalia Dobrogowska',
      title: 'Co-Founder & Medical Director',
      image:
        'https://images.unsplash.com/photo-1594824388597-7c740d90c4ad?w=400&h=400&fit=crop&crop=face',
      linkedin: '#',
    },
  ];

  const features = [
    {
      icon: <Hospital className="h-6 w-6 text-teal-600" />,
      title: 'Local Trust Selection',
      description:
        'Choose specific NHS trusts to access relevant local guidelines and policies tailored to your practice area.',
    },
    {
      icon: <Sparkles className="h-6 w-6 text-purple-600" />,
      title: 'AI-Generated Summaries',
      description:
        'Toggle AI-powered natural language summaries for complex medical guidelines, making information more accessible.',
    },
    {
      icon: <Search className="h-6 w-6 text-blue-600" />,
      title: 'Advanced Search',
      description:
        'Powerful search capabilities across national, regional, and local health policies using cutting-edge NLP technology.',
    },
    {
      icon: <Brain className="h-6 w-6 text-orange-600" />,
      title: 'AI & NLP Processing',
      description:
        'Sophisticated artificial intelligence processes vast amounts of medical literature to surface relevant information quickly.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Search className="h-12 w-12 text-teal-600 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">About Metrix</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing healthcare information access through AI and NLP technology, built by doctors for healthcare professionals across the UK.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-16 bg-gradient-to-r from-teal-50 to-blue-50 border-none shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl text-gray-900">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              The Metrix Platform was created to improve access to national, regional, and local health policy and guidelines. Using advanced AI and Natural Language Processing, we make complex medical information more accessible and actionable for healthcare professionals across the UK.
            </p>
          </CardContent>
        </Card>

        {/* Founders Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Founding Team</h2>
            <p className="text-lg text-gray-600">Three UK-trained doctors committed to improving healthcare information access</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {founders.map((founder, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mx-auto mb-4">
                    <img
                      src={founder.image}
                      alt={founder.name}
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-teal-100"
                    />
                  </div>
                  <CardTitle className="text-xl">{founder.name}</CardTitle>
                  <CardDescription className="text-teal-600 font-medium">
                    {founder.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">UK-trained Doctor</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-16" />

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-lg text-gray-600">Designed by healthcare professionals for healthcare professionals</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Features Highlight */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-teal-600" />
                <CardTitle className="text-xl text-teal-900">Local Trust Selection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-teal-800 mb-4">
                Access guidelines specific to your NHS trust. Our platform allows you to filter and view policies relevant to your local healthcare environment.
              </p>
              <Badge variant="secondary" className="bg-teal-200 text-teal-800">
                Customizable by Trust
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-xl text-purple-900">AI Natural Language Summaries</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 mb-4">
                Toggle AI-generated summaries that translate complex medical guidelines into clear, actionable insights using natural language processing.
              </p>
              <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                Optional AI Enhancement
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Your Trust Not Listed?</CardTitle>
            <CardDescription className="text-gray-300">
              We're continuously expanding our coverage across the UK
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              If your NHS trust isn't currently available on the platform, we'd love to hear from you. Contact our team to discuss adding your local guidelines and policies to Metrix.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-5 w-5" />
                <span className="font-medium">info@metrix-health.com</span>
              </div>
              <Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                <Mail className="h-4 w-4 mr-2" />
                Get in Touch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Powered by Advanced Technology</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="text-sm py-2 px-4">
              <Brain className="h-4 w-4 mr-2" />
              Artificial Intelligence
            </Badge>
            <Badge variant="outline" className="text-sm py-2 px-4">
              <MessageSquare className="h-4 w-4 mr-2" />
              Natural Language Processing
            </Badge>
            <Badge variant="outline" className="text-sm py-2 px-4">
              <Search className="h-4 w-4 mr-2" />
              Advanced Search Algorithms
            </Badge>
            <Badge variant="outline" className="text-sm py-2 px-4">
              <Users className="h-4 w-4 mr-2" />
              Healthcare-Focused Design
            </Badge>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
