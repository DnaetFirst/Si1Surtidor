import { createContext, useContext, ReactNode } from 'react';
import { SystemModulesApi } from '../domain/repository';

const SystemModulesApiContext = createContext<SystemModulesApi | null>(null);

export function SystemModulesApiProvider({ value, children }: { value: SystemModulesApi; children: ReactNode }) {
  return <SystemModulesApiContext.Provider value={value}>{children}</SystemModulesApiContext.Provider>;
}

export function useSystemModulesApi(): SystemModulesApi {
  const context = useContext(SystemModulesApiContext);
  if (!context) throw new Error('useSystemModulesApi debe usarse dentro de SystemModulesApiProvider');
  return context;
}
