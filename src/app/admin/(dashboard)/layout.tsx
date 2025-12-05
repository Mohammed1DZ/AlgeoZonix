'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode; }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  const userDocRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
  );
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  // Verify: Firebase Auth state is loaded AND user exists
  const isAuthVerified = !isUserLoading && user !== null;
  
  // Verify: Firestore is available
  const isFirestoreReady = firestore !== null;
  
  // Verify: User document is loaded
  const isUserDataLoaded = !isUserDocLoading && userData !== undefined;
  
  // Verify: User has admin role
  const isAdminRole = userData?.role === 'admin';
  
  // Complete verification when both auth and firestore checks are done
  const isFullyVerified = isAuthVerified && isFirestoreReady && isUserDataLoaded && isAdminRole;
  const isStillChecking = isUserLoading || isUserDocLoading || !isFirestoreReady;

  useEffect(() => {
    setAuthCheckComplete(true);
  }, []);

  // Redirect if auth check is complete but user is not an authenticated admin
  useEffect(() => {
    if (authCheckComplete && !isStillChecking && !isFullyVerified) {
      router.replace('/admin/login');
    }
  }, [authCheckComplete, isStillChecking, isFullyVerified, router]);

  // Loading state: waiting for both Firebase Auth and Firestore verification
  if (isStillChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verifying admin credentials...
          </p>
        </div>
      </div>
    );
  }

  // Error state: auth check complete but verification failed
  if (authCheckComplete && !isFullyVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!isAuthVerified 
              ? 'Not authenticated. Redirecting to login...'
              : !isAdminRole 
              ? 'Insufficient permissions. Admin access required.'
              : 'Failed to verify admin status. Please try logging in again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Fully verified: render the protected dashboard
  return <AppShell role="admin">{children}</AppShell>;
}
