'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingCart, Users, LineChart, PlusCircle, BookHeart, ShieldCheck, User as UserIcon, Package } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/logo";

const clientNavItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/menu", icon: BookHeart, label: "My Menu" },
    { href: "/dashboard/orders", icon: ShoppingCart, label: "My Orders" },
    { href: "/dashboard/new-order", icon: PlusCircle, label: "New Order" },
];

const adminNavItems = [
    { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
    { href: "/admin/orders", icon: ShoppingCart, label: "All Orders", badge: 23 },
    { href: "/admin/users", icon: Users, label: "Manage Users" },
    { href: "/admin/reports", icon: LineChart, label: "Analytics" },
];

const driverNavItems = [
    { href: "/rider/dashboard", icon: Home, label: "Dashboard" },
    { href: "/rider/orders", icon: Package, label: "Available Orders" },
    { href: "/rider/profile", icon: UserIcon, label: "My Profile" },
];


export default function Sidebar({ role }: { role: 'admin' | 'client' | 'driver' }) {
  const pathname = usePathname();
  
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return adminNavItems;
      case 'driver':
        return driverNavItems;
      case 'client':
      default:
        return clientNavItems;
    }
  }
  const navItems = getNavItems();
  
  const getHomeHref = () => {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'driver':
            return '/rider/dashboard';
        case 'client':
        default:
            return '/dashboard';
    }
  }
  const homeHref = getHomeHref();

  return (
    <div className="hidden border-r bg-primary text-primary-foreground md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b border-primary/20 px-4 lg:h-[60px] lg:px-6">
          <Logo href={homeHref} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-primary-foreground/70 transition-all hover:text-primary-foreground hover:bg-accent/20",
                  (pathname.startsWith(item.href)) && "bg-accent/20 text-primary-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
        {role === 'client' && (
            <div className="mt-auto p-4">
            <Card className="bg-accent/10 border-primary/20">
                <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                    Contact our support team for any questions about your orders.
                </CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Contact Support
                </Button>
                </CardContent>
            </Card>
            </div>
        )}
      </div>
    </div>
  )
}
