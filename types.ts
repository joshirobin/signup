
export enum TransactionType {
  FUEL = 'FUEL',
  STORE = 'STORE',
  PAYMENT = 'PAYMENT'
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  creditLimit: number;
  currentBalance: number;
  createdAt: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  type: TransactionType;
  amount: number;
  items: LineItem[];
  invoiceId?: string;
}

export interface Invoice {
  id: string;
  accountId: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  items: LineItem[];
  emailSent?: boolean;
}

export interface DashboardStats {
  totalReceivables: number;
  overdueAmount: number;
  activeAccounts: number;
  monthlyRevenue: number;
}
