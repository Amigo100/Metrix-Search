import { User } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState({
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@hospital.com',
    specialty: 'Emergency Medicine',
    institution: 'General Hospital',
    role: 'Attending Physician',
    bio: 'Emergency medicine physician with 10 years of experience in trauma and critical care.',
  });

  const handleSave = () => {
    // Here you would typically save to a backend
    console.log('Saving profile:', profile);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="max-w-[84rem]">
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>User Profile</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{profile.name}</h3>
              <p className="text-sm text-gray-600">{profile.specialty}</p>
              <p className="text-sm text-gray-500">{profile.institution}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Medical Specialty</Label>
              <Select
                value={profile.specialty}
                onValueChange={(value) =>
                  setProfile({ ...profile, specialty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anesthesiology">Anesthesiology</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Dermatology">Dermatology</SelectItem>
                  <SelectItem value="Emergency Medicine">
                    Emergency Medicine
                  </SelectItem>
                  <SelectItem value="Family Medicine">
                    Family Medicine
                  </SelectItem>
                  <SelectItem value="Gastroenterology">
                    Gastroenterology
                  </SelectItem>
                  <SelectItem value="General Surgery">
                    General Surgery
                  </SelectItem>
                  <SelectItem value="Internal Medicine">
                    Internal Medicine
                  </SelectItem>
                  <SelectItem value="Intensive Care">Intensive Care</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Obstetrics and Gynecology">
                    Obstetrics and Gynecology
                  </SelectItem>
                  <SelectItem value="Oncology">Oncology</SelectItem>
                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                  <SelectItem value="Radiology">Radiology</SelectItem>
                  <SelectItem value="Infectious Disease">
                    Infectious Disease
                  </SelectItem>
                  <SelectItem value="Nephrology">Nephrology</SelectItem>
                  <SelectItem value="Ophthalmology">Ophthalmology</SelectItem>
                  <SelectItem value="Otolaryngology">
                    Otolaryngology (ENT)
                  </SelectItem>
                  <SelectItem value="Pulmonology">Pulmonology</SelectItem>
                  <SelectItem value="Rheumatology">Rheumatology</SelectItem>
                  <SelectItem value="Urology">Urology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={profile.institution}
                onChange={(e) =>
                  setProfile({ ...profile, institution: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="role">Role/Position</Label>
              <Input
                id="role"
                value={profile.role}
                onChange={(e) =>
                  setProfile({ ...profile, role: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary-600"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
