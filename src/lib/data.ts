import type { Order, User, MenuItem } from './types';

// This file now contains only mock data that is not yet replaced by Firestore.
// As more of the application is connected to live data, this file will shrink.

export const orders: Order[] = [
    {
      id: "ORD001",
      customerName: "Bob Williams",
      customerEmail: "bob@example.com",
      status: "Delivered",
      date: "2023-06-23",
      amount: 250.0,
      items: [{ id: 'item_a', name: 'Widget A', quantity: 2 }]
    },
    {
      id: "ORD002",
      customerName: "Charlie Brown",
      customerEmail: "charlie@example.com",
      status: "Processing",
      date: "2023-06-24",
      amount: 150.0,
      items: [{ id: 'item_b', name: 'Gadget B', quantity: 1 }]
    },
    {
      id: "ORD003",
      customerName: "Diana Prince",
      customerEmail: "diana@example.com",
      status: "Shipped",
      date: "2023-06-25",
      amount: 350.0,
      items: [{ id: 'item_c', name: 'Gizmo C', quantity: 5 }]
    },
    {
      id: "ORD004",
      customerName: "Bob Williams",
      customerEmail: "bob@example.com",
      status: "Pending",
      date: "2023-06-26",
      amount: 450.0,
      items: [{ id: 'item_d', name: 'Thing D', quantity: 3 }]
    },
    {
      id: "ORD005",
      customerName: "Charlie Brown",
      customerEmail: "charlie@example.com",
      status: "Cancelled",
      date: "2023-06-27",
      amount: 550.0,
      items: [{ id: 'item_e', name: 'Doohickey E', quantity: 10 }]
    },
];

export const clientOrders = orders.filter(o => o.customerEmail !== 'alice@example.com');
