'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, KeyRound, Phone as PhoneIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export function RiderSignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase services are not ready. Please try again later.",
        });
        return;
    }
    setIsSubmitting(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Save user profile to Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        profileInfo: {
            firstName: formData.name.split(' ')[0] || '',
            lastName: formData.name.split(' ').slice(1).join(' ') || '',
        },
        email: user.email,
        phone: formData.phone,
        role: 'driver',
        status: 'unverified',
      });

      toast({
        title: 'Account Created!',
        description: "You'll be redirected to your dashboard to complete verification.",
      });

      // Redirect to the new rider dashboard to complete verification.
      // We'll use a timeout to allow the user to see the toast.
      setTimeout(() => {
        router.push('/rider/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error("Error creating user:", error);
      let description = "Could not create user. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already registered. Please try logging in instead.";
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: description,
      });
      setIsSubmitting(false);
    }
  };

  const canProceed = formData.name && formData.email && formData.password && formData.phone;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <div className="space-y-4">
           <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required className="pl-8"/>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
             <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="m@example.com" required className="pl-8"/>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className="pl-8"/>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <PhoneIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 890" required className="pl-8"/>
            </div>
          </div>
      </div>
      
      <Button type="submit" disabled={!canProceed || isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Account & Continue'}
      </Button>
    </form>
  );
}
