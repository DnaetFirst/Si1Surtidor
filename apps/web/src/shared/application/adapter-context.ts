import { createContext, useContext } from 'react';
export function createAdapterContext<T>(name: string) {
    const Context = createContext<T | null>(null);
    function useAdapter(): T { const adapter = useContext(Context); if (!adapter)
        throw new Error(name + ' no está configurado.'); return adapter; }
    return { Provider: Context.Provider, useAdapter };
}
