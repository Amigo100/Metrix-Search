import { Shield } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({
  isOpen,
  onClose,
}: PrivacyPolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Privacy Policy</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                1. Information We Collect
              </h3>
              <p className="text-gray-600 mb-3">
                We collect information to provide better services to all users
                of ClinSearch. The types of information we collect include:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600">
                <li>
                  Personal identification information (Name, email address,
                  professional credentials)
                </li>
                <li>
                  Usage data (Search queries, accessed guidelines, interaction
                  patterns)
                </li>
                <li>
                  Technical information (IP address, browser type, device
                  information)
                </li>
                <li>
                  Professional information (Medical specialty, institution,
                  role)
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                2. How We Use Information
              </h3>
              <p className="text-gray-600 mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600">
                <li>Provide, maintain, and improve our services</li>
                <li>Personalize search results and recommendations</li>
                <li>
                  Monitor usage and analyze trends to enhance user experience
                </li>
                <li>
                  Communicate with users about updates and relevant clinical
                  information
                </li>
                <li>Ensure platform security and prevent misuse</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                3. Information Sharing
              </h3>
              <p className="text-gray-600 mb-3">
                We do not sell, trade, or otherwise transfer personal
                information to third parties without consent, except:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600">
                <li>
                  With healthcare institutions for legitimate medical education
                  purposes
                </li>
                <li>When required by law or to protect rights and safety</li>
                <li>
                  With service providers who assist in platform operations
                  (under strict confidentiality agreements)
                </li>
                <li>
                  In anonymized, aggregated form for research and improvement
                  purposes
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                4. Data Security
              </h3>
              <p className="text-gray-600 mb-3">
                We implement appropriate security measures to protect personal
                information against unauthorized access, alteration, disclosure,
                or destruction. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Compliance with healthcare data protection standards</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                5. User Rights
              </h3>
              <p className="text-gray-600 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-600">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt-out of certain communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                6. Cookies and Tracking
              </h3>
              <p className="text-gray-600 mb-3">
                We use cookies and similar technologies to enhance user
                experience, analyze usage patterns, and provide personalized
                content. You can control cookie settings through your browser
                preferences.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                7. Updates to Privacy Policy
              </h3>
              <p className="text-gray-600 mb-3">
                This privacy policy may be updated periodically. Users will be
                notified of significant changes via email or platform
                notifications. Continued use of the service constitutes
                acceptance of updated terms.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                8. Contact Information
              </h3>
              <p className="text-gray-600">
                For questions about this privacy policy or data practices,
                contact us at:
                <br />
                Email: privacy@clinsearch.com
                <br />
                Phone: 1-800-CLINSCH
                <br />
                Address: 123 Medical Plaza, Healthcare City, HC 12345
              </p>
            </section>

            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <p className="text-xs text-gray-500">
                <strong>Last Updated:</strong> June 4, 2025
                <br />
                <strong>Effective Date:</strong> June 4, 2025
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} className="bg-primary hover:bg-primary-600">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
