import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-700 space-y-3 max-h-[60vh] overflow-y-auto mb-4">
          <p>
            We respect your privacy and are committed to protecting your personal information.
            Any data you enter in this application is stored locally in your browser and
            transmitted securely to our servers only when necessary to perform searches.
          </p>
          <p>
            We do not share your personal details with third parties. Anonymous usage
            statistics may be collected to help improve the quality of this service.
          </p>
          <p>
            If you have any questions about how your data is handled, please contact us at
            <a href="mailto:privacy@example.com" className="text-teal-600 underline">privacy@example.com</a>.
          </p>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button size="sm" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
