import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { OrderDataTableClient } from "@/components/order-data-table-client"
  
export default function ClientOrdersPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Orders</CardTitle>
                <CardDescription>A list of all your past and current orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <OrderDataTableClient />
            </CardContent>
        </Card>
    )
}
