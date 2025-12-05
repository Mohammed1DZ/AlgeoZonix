import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Order } from "@/lib/types"

type OrderStatus = Order['status'];

export function OrderStatusBadge({ status, className }: { status: OrderStatus, className?: string }) {
  const statusVariants: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
    Pending: "secondary",
    Processing: "default",
    Shipped: "outline",
    Delivered: "default",
    Cancelled: "destructive",
  };

  const statusSpecificClasses: Record<OrderStatus, string> = {
    Delivered: 'bg-accent text-accent-foreground hover:bg-accent/80',
    Pending: '',
    Processing: '',
    Shipped: 'border-dashed',
    Cancelled: ''
  }

  return (
    <Badge 
        variant={statusVariants[status]}
        className={cn("capitalize", statusSpecificClasses[status], className)}
    >
      {status}
    </Badge>
  )
}
