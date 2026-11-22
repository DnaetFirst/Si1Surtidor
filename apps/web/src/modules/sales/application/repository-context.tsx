import { createContext, useContext, ReactNode } from 'react';
import { SalesApi } from '../domain/repository';

const SalesContext = createContext<SalesApi | null>(null);

export function SalesApiProvider({ value, children }: { value: SalesApi; children: ReactNode }) {
  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSalesApi(): SalesApi {
  const context = useContext(SalesContext);
  if (!context) throw new Error('useSalesApi debe usarse dentro de SalesApiProvider');
  return context;
}
