import { WorkOrderStatus } from './index';

// 1. Clientes
export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  document_id?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type CustomerUpdate = Partial<CustomerInsert>;

// 2. Bicicletas
export interface Bicycle {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  bike_type: string;
  color: string;
  frame_size?: string | null;
  wheel_size?: string | null;
  serial_number?: string | null;
  year?: number | null;
  key_components?: string | null;
  observations?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  photos?: BicyclePhoto[];
}

export interface BicyclePhoto {
  id: string;
  bicycle_id: string;
  photo_url: string;
  photo_type: 'general' | 'danio' | 'transmision' | 'frenos' | 'cuadro';
  caption?: string | null;
  created_at: string;
}

export type BicycleInsert = Omit<Bicycle, 'id' | 'created_at' | 'updated_at' | 'customer' | 'photos'>;
export type BicycleUpdate = Partial<BicycleInsert>;

// 3. Códigos QR
export interface BikeQRCode {
  id: string;
  bicycle_id: string;
  qr_code: string;
  public_token: string;
  is_active: boolean;
  created_at: string;
}

// 4. Categorías de Producto
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
}

// 5. Productos e Inventario
export interface Product {
  id: string;
  sku: string;
  category_id: string;
  name: string;
  brand: string;
  description?: string | null;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  location?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>;
export type ProductUpdate = Partial<ProductInsert>;

// 6. Kardex y Movimientos de Inventario
export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: string | null;
  user_id?: string | null;
  created_at: string;
  product?: Product;
}

// 7. Servicios del Taller
export interface Service {
  id: string;
  name: string;
  description?: string | null;
  estimated_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

// 8. Órdenes de Trabajo
export interface WorkOrder {
  id: string;
  order_number: string;
  customer_id: string;
  bicycle_id: string;
  technician_id?: string | null;
  status: WorkOrderStatus;
  reported_issues: string;
  accessories_received?: string | null;
  entry_mileage_km?: number | null;
  estimated_delivery_at?: string | null;
  total_labor: number;
  total_parts: number;
  discount: number;
  grand_total: number;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  bicycle?: Bicycle;
  items?: WorkOrderItem[];
}

export type WorkOrderInsert = Omit<
  WorkOrder,
  'id' | 'order_number' | 'created_at' | 'updated_at' | 'customer' | 'bicycle' | 'items'
> & { order_number?: string };
export type WorkOrderUpdate = Partial<WorkOrderInsert>;

// 9. Items de la Orden de Trabajo
export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  item_type: 'service' | 'part';
  product_id?: string | null;
  service_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// 10. Trazabilidad de Estados
export interface WorkOrderStatusHistory {
  id: string;
  work_order_id: string;
  from_status?: string | null;
  to_status: WorkOrderStatus;
  user_id?: string | null;
  notes?: string | null;
  created_at: string;
}

// 11. Firmas Digitales
export interface Signature {
  id: string;
  work_order_id: string;
  signature_type: 'reception' | 'delivery';
  signature_data: string;
  signer_name: string;
  signer_doc?: string | null;
  signed_at: string;
}

// 12. Sesiones de Caja
export interface CashRegister {
  id: string;
  opened_by: string;
  opened_at: string;
  initial_amount: number;
  closed_by?: string | null;
  closed_at?: string | null;
  final_counted_amount?: number | null;
  system_calculated_amount?: number | null;
  difference?: number | null;
  status: 'OPEN' | 'CLOSED';
  notes?: string | null;
}

// 13. Movimientos de Caja
export interface CashMovement {
  id: string;
  cash_register_id: string;
  type: 'INCOME' | 'EXPENSE';
  concept: string;
  amount: number;
  payment_method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER';
  reference_type?: 'WORK_ORDER' | 'INVOICE' | 'MANUAL' | null;
  reference_id?: string | null;
  user_id: string;
  notes?: string | null;
  created_at: string;
}

// 14. Facturación
export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  work_order_id?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: 'PAID' | 'PENDING' | 'CANCELLED';
  issued_by: string;
  created_at: string;
  customer?: Customer;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// 15. Citas y Agenda
export interface Appointment {
  id: string;
  customer_id: string;
  bicycle_id?: string | null;
  service_id?: string | null;
  technician_id?: string | null;
  mechanic_name?: string | null;
  service_name?: string | null;
  scheduled_at: string;
  estimated_duration_min: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
  created_at: string;
  customer?: Customer | null;
  bicycle?: Bicycle | null;
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'customer' | 'bicycle'>;
export type AppointmentUpdate = Partial<AppointmentInsert>;
