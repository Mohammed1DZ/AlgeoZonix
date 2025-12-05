'use client';
import Link from "next/link"
import { CircleUser, Menu, Search, Home, ShoppingCart, Users, LineChart, PlusCircle, BookHeart, ShieldCheck, Bell, Package, User as UserIcon } from "lucide-react"
import { collection, signOut } from 'firebase/auth';
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "./logo"
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection as firestoreCollection } from "firebase/firestore";


const clientNavItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/menu", icon: BookHeart, label: "My Menu" },
    { href: "/dashboard/orders", icon: ShoppingCart, label: "My Orders" },
    { href: "/dashboard/new-order", icon: PlusCircle, label: "New Order" },
];

const adminNavItems = [
    { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
    { href: "/admin/orders", icon: ShoppingCart, label: "All Orders" },
    { href: "/admin/users", icon: Users, label: "Manage Users" },
    { href: "/admin/reports", icon: LineChart, label: "Analytics" },
];

const driverNavItems = [
    { href: "/rider/dashboard", icon: Home, label: "Dashboard" },
    { href: "/rider/orders", icon: Package, label: "Available Orders" },
    { href: "/rider/profile", icon: UserIcon, label: "My Profile" },
];

export default function Header({ role }: { role: 'admin' | 'client' | 'driver' }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const notificationsQuery = useMemoFirebase(
      () => (firestore && user ? firestoreCollection(firestore, 'users', user.uid, 'notifications') : null),
      [firestore, user]
    );

    const { data: notifications } = useCollection(notificationsQuery);

    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const getNavItems = () => {
        switch (role) {
            case 'admin': return adminNavItems;
            case 'driver': return driverNavItems;
            case 'client':
            default: return clientNavItems;
        }
    }
    const navItems = getNavItems();
    
    const getHomeHref = () => {
        switch (role) {
            case 'admin': return '/admin/dashboard';
            case 'driver': return '/rider/dashboard';
            case 'client':
            default: return '/dashboard';
        }
    }
    const homeHref = getHomeHref();

    const getProfileHref = () => {
        switch(role) {
            case 'admin': return '/admin/users';
            case 'driver': return '/rider/profile';
            case 'client':
            default: return '/dashboard';
        }
    }

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out.",
            });
            router.push('/login');
        } catch (error) {
            console.error("Logout failed:", error);
            toast({
                variant: "destructive",
                title: "Logout Failed",
                description: "Could not log out. Please try again.",
            });
        }
    };


    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-primary text-primary-foreground w-[280px]">
                <div className="flex h-14 items-center border-b border-primary/20 px-4 lg:h-[60px] lg:px-6">
                   <Logo href={homeHref} />
                </div>
                <div className="flex-1 py-4 overflow-y-auto">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary-foreground/70 transition-all hover:text-primary-foreground"
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
           <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center text-xs" variant="destructive">
                    {unreadCount}
                </Badge>
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={getProfileHref()}>My Profile</Link>
                </DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
      )
}
