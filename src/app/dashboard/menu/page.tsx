'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MenuItemForm } from '@/components/menu-item-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { MenuItem } from '@/lib/types';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';

export default function MenuPage() {
  const [open, setOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  // NOTE: For now, we assume the clientId is the same as the user's UID.
  // In a more complex app, you might fetch a client profile document
  // that is linked to the user's UID.
  const clientId = user?.uid;

  const menuItemsQuery = useMemoFirebase(
    () => (firestore && clientId ? collection(firestore, 'clients', clientId, 'menuItems') : null),
    [firestore, clientId]
  );

  const { data: menuItems, isLoading } = useCollection<Omit<MenuItem, 'id'>>(menuItemsQuery);

  const handleEdit = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setOpen(true);
  };

  const handleAddNew = () => {
    setSelectedMenuItem(null);
    setOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!firestore || !clientId) return;
    if (confirm('Are you sure you want to delete this item?')) {
      const docRef = doc(firestore, 'clients', clientId, 'menuItems', itemId);
      try {
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setSelectedMenuItem(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">My Menu</h1>
          <p className="text-muted-foreground">Manage your offerings and pricing.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} disabled={!clientId}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{selectedMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
              <DialogDescription>
                {selectedMenuItem ? 'Update the details of your item.' : 'Fill in the details to add a new item to your menu.'}
              </DialogDescription>
            </DialogHeader>
            {clientId && <MenuItemForm menuItem={selectedMenuItem} onSuccess={closeDialog} clientId={clientId} />}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-center">Loading menu...</p>}

      {!isLoading && menuItems && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader className="p-0">
                <div className="relative w-full h-48">
                  <Image
                    src={item.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                    alt={item.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-lg"
                    data-ai-hint="food item"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow flex flex-col">
                <CardTitle className="text-lg font-semibold mb-2">{item.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground flex-grow mb-4">{item.description}</CardDescription>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="text-base font-bold">${item.price.toFixed(2)}</Badge>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!menuItems || menuItems.length === 0) && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">Your Menu is Empty</h3>
            <p>You haven&apos;t added any menu items yet.</p>
            <Button variant="link" onClick={handleAddNew} className="mt-2">Add your first item</Button>
        </div>
      )}
    </div>
  );
}
