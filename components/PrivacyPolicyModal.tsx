import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/Dialog';
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
        <p className="text-sm text-gray-700 mb-4">The privacy policy content would be displayed here.</p>
        <DialogFooter>
          <DialogClose>
            <Button size="sm" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
