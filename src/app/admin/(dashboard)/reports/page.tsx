import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function AdminReportsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Reporting and Analytics</CardTitle>
                <CardDescription>Generate and export summary reports.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 items-start">
               <p className="text-muted-foreground">Select your criteria and generate a report from the options below.</p>
               <div className="flex flex-wrap gap-2">
                <Button>Generate Monthly Revenue Report</Button>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Users (CSV)
                </Button>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export All Orders (JSON)
                </Button>
               </div>
            </CardContent>
        </Card>
    )
}
