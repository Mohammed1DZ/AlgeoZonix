export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  date: string;
  amount: number;
  items: OrderItem[];
};

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
}

export type User = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "client" | "driver";
    avatarUrl: string;
    lastLogin: string;
}

export type MenuItem = {
  id: string;
  clientId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}
