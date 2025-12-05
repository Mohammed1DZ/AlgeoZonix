'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, updateDoc, doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import type { WithId } from "@/firebase/firestore/use-collection";
import { useToast } from "@/hooks/use-toast";


type UserProfile = {
    email: string;
    phone: string;
    profileInfo: {
        firstName: string;
        lastName: string;
    };
    role: 'admin' | 'client' | 'driver' | 'customer';
    status: 'unverified' | 'pending' | 'verified' | 'suspended';
};

export function VerificationQueue() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const verificationQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), where('status', '==', 'pending')) : null),
        [firestore]
    );
    const { data: applicants, isLoading } = useCollection<UserProfile>(verificationQuery);

    const handleUpdateStatus = async (userId: string, newStatus: 'verified' | 'unverified') => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userRef, { status: newStatus });
            toast({
                title: "Status Updated",
                description: `User has been ${newStatus === 'verified' ? 'approved' : 'rejected'}.`
            })
        } catch (error) {
            console.error("Failed to update status:", error);
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: "Could not update user status. Please try again."
            })
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Driver Verification Queue</CardTitle>
                <CardDescription>Review and approve or reject new driver applications.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                     <div className="flex justify-center items-center h-48">
                        <Loader2 className="animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Applicant</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applicants?.map((user: WithId<UserProfile>) => {
                                const fullName = `${user.profileInfo?.firstName || ''} ${user.profileInfo?.lastName || ''}`.trim();
                                const fallback = fullName.split(' ').map(n => n[0]).join('').toUpperCase() || user.email[0].toUpperCase();

                                return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} alt={fullName} data-ai-hint="person" />
                                                <AvatarFallback>{fallback}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{fullName || 'N/A'}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                        {user.phone || 'No phone number'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm">View Details</Button>
                                            <Button size="sm" onClick={() => handleUpdateStatus(user.id, 'verified')}>Approve</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(user.id, 'unverified')}>Reject</Button>
                                       </div>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                )}
                 {!isLoading && !applicants?.length && (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <p className="font-semibold">The verification queue is empty.</p>
                        <p>There are no new applications to review at this time.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
