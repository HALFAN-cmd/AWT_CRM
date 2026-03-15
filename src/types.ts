export type WarehouseType = 'Main warehouse' | 'Office Store' | 'Van';

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  createdAt: any;
}

export interface Salesman {
  id: string;
  name: string;
  warehouseId: string;
  createdAt: any;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  unit: string;
  createdAt: any;
}

export type TransactionType = 'GRN' | 'MaterialRequest' | 'StockTransfer' | 'Invoice' | 'SalesReturn' | 'ItemHandover';
export type HandoverReason = 'Expired' | 'Damaged' | 'Other Reasons';

export interface TransactionItem {
  itemId: string;
  quantity: number;
  price?: number;
  reason?: HandoverReason;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: any;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  items: TransactionItem[];
  total?: number;
  reference?: string;
  createdBy: string;
}

export interface Stock {
  id: string; // warehouseId_itemId
  warehouseId: string;
  itemId: string;
  quantity: number;
}

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  permissions: string[];
}
