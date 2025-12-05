import { RiderVerificationFlow } from "@/components/rider-verification-flow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RiderVerificationPage() {
  return (
    <Card className="mx-auto max-w-4xl w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Driver Verification</CardTitle>
        <CardDescription>
          Please complete the following steps to verify your identity and vehicle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RiderVerificationFlow />
      </CardContent>
    </Card>
  );
}
