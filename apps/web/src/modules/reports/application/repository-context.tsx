import { createContext, useContext, ReactNode } from 'react';
import { ReportsApi } from '../domain/repository';

const ReportsContext = createContext<ReportsApi | null>(null);

export function ReportsApiProvider({ value, children }: { value: ReportsApi; children: ReactNode }) {
  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReportsApi(): ReportsApi {
  const context = useContext(ReportsContext);
  if (!context) throw new Error('useReportsApi debe usarse dentro de ReportsApiProvider');
  return context;
}
