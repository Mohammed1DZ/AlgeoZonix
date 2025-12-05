import { RiderSignupForm } from "@/components/rider-signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RiderSignupPage() {
  return (
    <Card className="mx-auto max-w-lg w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Become a Rider for AlgeoZonix</CardTitle>
        <CardDescription>
          Step 1: Create your account. You can complete the document verification on the next page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RiderSignupForm />
         <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
