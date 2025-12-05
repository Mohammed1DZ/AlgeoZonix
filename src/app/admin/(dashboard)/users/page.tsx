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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { Loader2, MoreHorizontal } from "lucide-react";
import type { WithId } from "@/firebase/firestore/use-collection";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteUser } from "@/ai/flows/delete-user-flow";

type UserProfile = {
    email: string;
    phone: string;
    profileInfo: {
        firstName: string;
        lastName: string;
    };
    role: 'admin' | 'client' | 'driver' | 'customer';
    status: 'unverified' | 'pending' | 'verified';
};

export default function AdminUsersPage() {
    const { user: adminUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), orderBy('role')) : null),
        [firestore]
    );
    const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<WithId<UserProfile> | null>(null);


    const getStatusVariant = (status: string) => {
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

    const handleUpdateStatus = async (userId: string, newStatus: UserProfile['status']) => {
        if (!firestore) return;
        setIsSubmitting(true);
        const userRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userRef, { status: newStatus });
            toast({
                title: "Status Updated",
                description: `User status has been changed to ${newStatus}.`,
            });
        } catch (error) {
            console.error("Failed to update status:", error);
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: "Could not update user status.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || !adminUser) return;
        setIsSubmitting(true);

        try {
            const result = await deleteUser({
                userIdToDelete: selectedUser.id,
                adminUserId: adminUser.uid,
            });

            if (result.success) {
                 toast({
                    title: "User Deleted",
                    description: `User ${selectedUser.email} has been permanently deleted.`,
                });
            } else {
                throw new Error(result.message);
            }
           
        } catch (error: any) {
            console.error("Failed to delete user:", error);
             toast({
                variant: 'destructive',
                title: "Delete Failed",
                description: error.message || "Could not delete user.",
            });
        } finally {
            setIsSubmitting(false);
            setDialogOpen(false);
            setSelectedUser(null);
        }
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users in the system.</CardDescription>
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
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user: WithId<UserProfile>) => {
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
                                        <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'} className="capitalize">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                         <Badge variant={getStatusVariant(user.status)} className="capitalize">
                                            {user.status || 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.phone || 'No phone number'}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}>
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem disabled>Edit User</DropdownMenuItem>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, 'verified')}>Verified</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, 'pending')}>Pending</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, 'unverified')}>Unverified</DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setDialogOpen(true);
                                                    }}
                                                    disabled={user.id === adminUser?.uid}
                                                >
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                )}
                 {!isLoading && !users?.length && (
                    <div className="text-center text-muted-foreground py-12">
                        No users found in the system.
                    </div>
                 )}
            </CardContent>
        </Card>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user account
                        for <span className="font-bold">{selectedUser?.email}</span> and remove all of their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                         {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                        Yes, delete user
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </>
    )
}
