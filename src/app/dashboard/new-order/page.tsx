import { NewOrderForm } from '@/components/new-order-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewOrderPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Order</CardTitle>
          <CardDescription>Fill out the form below to place a new order.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewOrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
