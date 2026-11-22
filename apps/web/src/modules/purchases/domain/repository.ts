import { Provider, ProviderProduct, PurchaseOrder, PurchaseReceipt } from './models';

export interface PurchasesApi {
  // Proveedores
  listProvidersKey: (q?: string, activo?: string, page?: number) => string;
  getProvider: (id: number) => Promise<Provider>;
  createProvider: (data: Partial<Provider>) => Promise<Provider>;
  updateProvider: (id: number, data: Partial<Provider>) => Promise<Provider>;
  toggleProviderStatus: (id: number) => Promise<Provider>;
  getProviderProducts: (id: number) => Promise<ProviderProduct[]>;
  linkProviderProduct: (id: number, data: { idProducto: number; ultimoPrecio: number; detalle?: string }) => Promise<ProviderProduct>;
  unlinkProviderProduct: (id: number, productId: number) => Promise<void>;

  // Órdenes de compra
  listOrdersKey: (q?: string, branchId?: number, page?: number) => string;
  getOrder: (id: number) => Promise<PurchaseOrder>;
  createOrder: (data: any) => Promise<PurchaseOrder>;
  updateOrderStatus: (id: number, estado: string, motivo?: string) => Promise<PurchaseOrder>;

  // Compras (Recepciones)
  listPurchasesKey: (q?: string, branchId?: number, page?: number) => string;
  getPurchase: (id: number) => Promise<PurchaseReceipt>;
  createPurchase: (data: any) => Promise<PurchaseReceipt>;
  listBatchesKey: (productId?: number, page?: number) => string;
}
