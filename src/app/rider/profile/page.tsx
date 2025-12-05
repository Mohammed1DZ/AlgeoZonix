'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2, User as UserIcon, Mail, Phone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RiderProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );

    const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

    const isLoading = isUserLoading || isUserDocLoading;

    const getStatusVariant = (status?: string) => {
        switch (status) {
            case 'verified':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'unverified':
                return 'destructive';
            default:
                return 'outline';
        }
    }

    const getStatusDescription = (status?: string) => {
        switch (status) {
            case 'verified':
                return "Congratulations! Your account is fully verified and you can accept orders.";
            case 'pending':
                return "Your application is currently under review. We will notify you once it's complete.";
            case 'unverified':
                return "Your account is not yet verified. Please complete all steps to start driving.";
            default:
                return "Your verification status is unknown.";
        }
    }


    const fullName = `${userData?.profileInfo?.firstName || ''} ${userData?.profileInfo?.lastName || ''}`.trim();
    const fallback = fullName.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.[0].toUpperCase();


    if (isLoading) {
        return (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
             <CardHeader className="p-0">
                <CardTitle className="text-3xl font-bold tracking-tight font-headline">My Profile</CardTitle>
                <CardDescription>
                    View your account details and verification status.
                </CardDescription>
            </CardHeader>

            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/128/128`} alt={fullName} data-ai-hint="person" />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xl font-bold">{fullName || 'Rider'}</p>
                            <p className="text-muted-foreground">Driver Partner</p>
                        </div>
                    </div>
                   <div className="grid sm:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm">{userData?.email}</span>
                        </div>
                         <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm">{userData?.phone || 'No phone number'}</span>
                        </div>
                   </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Verification Status</CardTitle>
                    <CardDescription>
                       {getStatusDescription(userData?.status)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="p-4 border w-full rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                           <div>
                               <p className="text-sm font-medium text-muted-foreground">Your current status is:</p>
                               <Badge variant={getStatusVariant(userData?.status)} className="text-base capitalize mt-1">
                                    {userData?.status?.replace(/_/g, ' ') || 'Unknown'}
                                </Badge>
                           </div>
                        </div>
                        {userData?.status === 'unverified' && (
                             <Button asChild>
                                <Link href="/rider/verify">Start Verification</Link>
                            </Button>
                        )}
                        {userData?.status === 'rejected' && ( // You might want a different state for this
                             <Button variant="outline">Contact Support</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
