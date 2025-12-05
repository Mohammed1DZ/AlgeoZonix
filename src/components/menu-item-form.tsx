'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem } from '@/lib/types';
import { FileUp } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const formSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0.'),
  imageUrl: z.string().url('Please enter a valid image URL.').optional().or(z.literal('')),
});

type MenuItemFormProps = {
    menuItem?: MenuItem | null;
    onSuccess: () => void;
    clientId: string;
};

export function MenuItemForm({ menuItem, onSuccess, clientId }: MenuItemFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: menuItem?.name || '',
      description: menuItem?.description || '',
      price: menuItem?.price || 0,
      imageUrl: menuItem?.imageUrl || '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !clientId) return;

    const itemId = menuItem?.id || uuidv4();
    const itemRef = doc(firestore, 'clients', clientId, 'menuItems', itemId);
    
    const dataToSave = {
      ...values,
      id: itemId,
      clientId: clientId,
      imageUrl: values.imageUrl || `https://picsum.photos/seed/${itemId}/600/400`,
    };

    setDocumentNonBlocking(itemRef, dataToSave, { merge: true });

    toast({
      title: menuItem ? 'Item Updated!' : 'Item Added!',
      description: `"${values.name}" has been successfully ${menuItem ? 'updated' : 'added'}.`,
    });
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Artisan Sourdough Loaf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the item, its ingredients, and any special features."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
              <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                  <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input type="number" step="0.01" placeholder="12.50" className="pl-7" {...field} />
                  </div>
              </FormControl>
              <FormMessage />
              </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormDescription>Leave blank to use a placeholder image.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">{menuItem ? 'Save Changes' : 'Add Item'}</Button>
      </form>
    </Form>
  );
}
