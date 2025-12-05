import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { OrderDataTable } from "@/components/order-data-table"
  
export default function AdminOrdersPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Client Orders</CardTitle>
                <CardDescription>View, manage, and track all orders in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <OrderDataTable />
            </CardContent>
        </Card>
    )
}
