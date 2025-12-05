'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck } from "lucide-react"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { Order, OrderItem } from "@/lib/types";
import { orders as mockOrders } from "@/lib/data";

const availableOrders: Order[] = mockOrders.filter(o => o.status === 'Pending');

export default function RiderOrdersPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );

    const { data: userData } = useDoc(userDocRef);
    const isVerified = userData?.status === 'verified';

    return (
        <div className="flex flex-col gap-6">
            <CardHeader className="p-0">
                <CardTitle className="text-3xl font-bold tracking-tight font-headline">Available Orders</CardTitle>
                <CardDescription>
                    {isVerified
                        ? "Accept new orders to start earning."
                        : "This is a preview of available orders. Complete your profile verification to start accepting them."
                    }
                </CardDescription>
            </CardHeader>

            {!isVerified && (
                 <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-300">
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Verification Required</AlertTitle>
                    <AlertDescription>
                        Your account is not yet verified. 
                        <Link href="/rider/profile" className="font-bold underline ml-1">Complete your verification</Link> to accept orders.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableOrders.map(order => (
                    <Card key={order.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                                <Badge variant="secondary">New</Badge>
                            </div>
                            <CardDescription>From: Restaurant Name</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm text-muted-foreground">Payout</p>
                                    <p className="text-xl font-bold text-green-600">${(order.amount * 0.15).toFixed(2)}</p>
                                </div>
                                <Button size="sm" disabled={!isVerified}>
                                    {isVerified ? 'Accept Order' : 'Accept'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {availableOrders.length === 0 && (
                <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg col-span-full">
                    <p className="font-semibold text-lg">No available orders right now.</p>
                    <p>Check back soon for new delivery opportunities!</p>
                </div>
            )}
        </div>
    )
}
