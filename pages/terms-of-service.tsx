import { FileText } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import Header from '@/components/Header';

import remarkGfm from 'remark-gfm';

export default function TermsOfServicePage() {
  const termsMarkdown = `### Terms of Service

*Effective Date: 4 June 2025*

---

By accessing or using the Metrix platform (the **"Service"**), you agree to be bound by these Terms of Service (the **"Terms"**). If you do not agree to these Terms, do not use the Service.

#### 1. Use of the Service

You may use the Service only for lawful purposes and in accordance with these Terms. You are responsible for all content that you submit or actions you take through the Service.

#### 2. Intellectual Property

All content and software associated with the Service are the property of Metrix Health Ltd or its licensors. You may not reproduce, distribute, or create derivative works without our express permission.

#### 3. Termination

We may suspend or terminate your access to the Service at any time if you violate these Terms or engage in fraudulent or illegal activities.

#### 4. Disclaimer of Warranties

The Service is provided on an "as is" and "as available" basis without warranties of any kind. We do not guarantee that the Service will be uninterrupted or error-free.

#### 5. Limitation of Liability

To the fullest extent permitted by law, Metrix Health Ltd shall not be liable for any indirect, incidental, or consequential damages arising out of or relating to your use of the Service.

#### 6. Governing Law

These Terms are governed by the laws of England and Wales. Any disputes will be resolved exclusively in the courts of England and Wales.

#### 7. Contact Us

If you have any questions about these Terms, please contact **[support@metrixhealth.ai](mailto:support@metrixhealth.ai)**.

---

**Last Updated:** 4 June 2025`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto p-4 pt-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Terms of Service
        </h1>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="prose prose-sm max-w-none text-gray-700"
        >
          {termsMarkdown}
        </ReactMarkdown>
      </main>
    </div>
  );
}
