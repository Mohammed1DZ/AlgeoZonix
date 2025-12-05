
'use client';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bike, Loader2 } from "lucide-react"
import { GoogleIcon } from "@/components/google-icon"
import { useState } from "react"
import { useAuth, useFirestore } from "@/firebase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export default function SignupPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const handleGoogleSignIn = async () => {
        if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase is not ready. Please try again.",
        });
        return;
        }
        setIsSubmitting(true);
        const provider = new GoogleAuthProvider();
        try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            toast({
            title: "Login Successful",
            description: "Welcome back!",
            });
        } else {
            const [firstName, ...lastName] = user.displayName?.split(" ") || ["", ""];
            await setDoc(userDocRef, {
                profileInfo: {
                    firstName: firstName,
                    lastName: lastName.join(" "),
                    avatarUrl: user.photoURL
                },
                email: user.email,
                role: 'client',
                status: 'verified',
                createdAt: serverTimestamp(),
            });
            toast({
                title: "Account Created",
                description: "Welcome to AlgeoZonix!",
            });
        }
        router.push('/dashboard');

        } catch (error: any) {
        console.error("Google Sign-In failed:", error);
        toast({
            variant: "destructive",
            title: "Sign-In Failed",
            description: error.message || "Could not sign in with Google. Please try again.",
        });
        } finally {
        setIsSubmitting(false);
        }
    }


  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Sign Up for AlgeoZonix</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <GoogleIcon className="mr-2 h-4 w-4" />}
                Sign up with Google
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                    </span>
                </div>
            </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" placeholder="Max" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" placeholder="Robinson" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          <Button type="submit" className="w-full">
            Create an account
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                Or are you a rider?
                </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/rider-signup">
                <Bike className="mr-2 h-4 w-4" />
                Sign up as a Rider
            </Link>
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
