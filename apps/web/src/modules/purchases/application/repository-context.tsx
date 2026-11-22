import { createContext, useContext, ReactNode } from 'react';
import { PurchasesApi } from '../domain/repository';

const PurchasesContext = createContext<PurchasesApi | null>(null);

export function PurchasesApiProvider({ value, children }: { value: PurchasesApi; children: ReactNode }) {
  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchasesApi(): PurchasesApi {
  const context = useContext(PurchasesContext);
  if (!context) throw new Error('usePurchasesApi debe usarse dentro de PurchasesApiProvider');
  return context;
}
