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
import { useUser } from "@/firebase";
import { Loader2, DollarSign, Package, Star, Percent } from "lucide-react";

export default function RiderDashboardPage() {
    const { user, isUserLoading } = useUser();

    const kpiData = [
        { title: "Earnings (Today)", value: "$75.50", icon: DollarSign, change: "+15%" },
        { title: "Completed Deliveries", value: "12", icon: Package, change: "+2 from yesterday" },
        { title: "Your Rating", value: "4.9", icon: Star, change: "Based on last 50 reviews" },
        { title: "Acceptance Rate", value: "92%", icon: Percent, change: "Last 7 days" },
    ];


    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome back, {user?.displayName?.split(' ')[0] || 'Rider'}!</h1>
                    <p className="text-muted-foreground">Here's a summary of your activity today.</p>
                </div>
                 <Button asChild>
                    <Link href="/rider/orders">View Available Orders</Link>
                </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {kpiData.map((kpi) => (
                    <Card key={kpi.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                            <kpi.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                            <p className="text-xs text-muted-foreground">{kpi.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>You have no new notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <p className="font-semibold">No recent activity to show.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
