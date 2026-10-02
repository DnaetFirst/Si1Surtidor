import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { AuditApiProvider } from '../modules/enterprise/audit/application/repository-context';
import { auditApi } from '../modules/enterprise/audit/infrastructure/api';
import { CompanyApiProvider } from '../modules/enterprise/company/application/repository-context';
import { companyApi } from '../modules/enterprise/company/infrastructure/api';
import { AuthApiProvider } from '../modules/security/auth/application/repository-context';
import { store } from '../modules/security/auth/application/session';
import { authApi } from '../modules/security/auth/infrastructure/api';
import { PermissionsApiProvider } from '../modules/security/permissions/application/repository-context';
import { permissionsApi } from '../modules/security/permissions/infrastructure/api';
import { RolesApiProvider } from '../modules/security/roles/application/repository-context';
import { rolesApi } from '../modules/security/roles/infrastructure/api';
import { UsersApiProvider } from '../modules/security/users/application/repository-context';
import { usersApi } from '../modules/security/users/infrastructure/api';
import { api } from '../shared/infrastructure/http';
export function Providers({ children }: {
    children: ReactNode;
}) { return <Provider store={store}><SWRConfig value={{ fetcher: api, shouldRetryOnError: false, revalidateOnFocus: true }}><BrowserRouter><UsersApiProvider value={usersApi}><RolesApiProvider value={rolesApi}><PermissionsApiProvider value={permissionsApi}><AuthApiProvider value={authApi}><CompanyApiProvider value={companyApi}><AuditApiProvider value={auditApi}>{children}</AuditApiProvider></CompanyApiProvider></AuthApiProvider></PermissionsApiProvider></RolesApiProvider></UsersApiProvider></BrowserRouter></SWRConfig></Provider>; }
