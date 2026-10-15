import { createContext, useContext, ReactNode } from 'react';
import { InventoryApi } from '../domain/repository';

const InventoryApiContext = createContext<InventoryApi | null>(null);

export function InventoryApiProvider({ value, children }: { value: InventoryApi; children: ReactNode }) {
  return <InventoryApiContext.Provider value={value}>{children}</InventoryApiContext.Provider>;
}

export function useInventoryApi(): InventoryApi {
  const context = useContext(InventoryApiContext);
  if (!context) throw new Error('useInventoryApi debe usarse dentro de InventoryApiProvider');
  return context;
}
