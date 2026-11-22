import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Branches, BranchForm } from '../modules/enterprise/branches/presentation/Branches';
import { AuditPage } from '../modules/enterprise/audit/presentation/Audit';
import { CompanyPage } from '../modules/enterprise/company/presentation/Company';
import { CategoriesGroups } from '../modules/inventory/presentation/CategoriesGroups';
import { CategoryGroupForm } from '../modules/inventory/presentation/CategoryGroupForm';
import { FuelForm } from '../modules/inventory/presentation/FuelForm';
import { Fuels } from '../modules/inventory/presentation/Fuels';
import { ProductForm } from '../modules/inventory/presentation/ProductForm';
import { Products } from '../modules/inventory/presentation/Products';
import { ProductExits } from '../modules/inventory/presentation/ProductExits';
import { ProductExitForm } from '../modules/inventory/presentation/ProductExitForm';
import { Providers } from '../modules/purchases/presentation/Providers';
import { ProviderForm } from '../modules/purchases/presentation/ProviderForm';
import { ProviderDetail } from '../modules/purchases/presentation/ProviderDetail';
import { PurchaseOrders } from '../modules/purchases/presentation/PurchaseOrders';
import { PurchaseOrderForm } from '../modules/purchases/presentation/PurchaseOrderForm';
import { Purchases } from '../modules/purchases/presentation/Purchases';
import { PurchaseForm } from '../modules/purchases/presentation/PurchaseForm';
import { PurchaseDetail } from '../modules/purchases/presentation/PurchaseDetail';
import { Dispensers } from '../modules/sales/presentation/Dispensers';
import { DispenserForm } from '../modules/sales/presentation/DispenserForm';
import { Discounts } from '../modules/sales/presentation/Discounts';
import { DiscountForm } from '../modules/sales/presentation/DiscountForm';
import { Sales } from '../modules/sales/presentation/Sales';
import { SaleForm } from '../modules/sales/presentation/SaleForm';
import { SaleDetail } from '../modules/sales/presentation/SaleDetail';
import { Reports } from '../modules/reports/presentation/Reports';
import { allowed, firstPath, useSession } from '../modules/security/auth/application/session';
import { Login } from '../modules/security/auth/presentation/Login';
import { PasswordRecovery, PasswordReset } from '../modules/security/auth/presentation/PasswordRecovery';
import { PermissionForm, Permissions } from '../modules/security/permissions/presentation/Permissions';
import { RoleForm, Roles } from '../modules/security/roles/presentation/Roles';
import { SystemModuleForm } from '../modules/security/system-modules/presentation/SystemModuleForm';
import { SystemModules } from '../modules/security/system-modules/presentation/SystemModules';
import { Profile } from '../modules/security/users/presentation/Profile';
import { UserForm, Users } from '../modules/security/users/presentation/Users';
import { Card, Empty, Loading } from '../shared/presentation/index';
import { Layout } from './Layout';

function Guard({ module }: { module?: string }) {
  const { user, ready } = useSession();

  if (!ready) return <Loading text="Verificando sesión…" />;

  if (!user) return <Navigate to="/login" replace />;

  if (module && !allowed(user, module)) {
    return (
      <Card>
        <Empty
          title="Acceso restringido"
          text="Tu rol no tiene permiso para consultar esta sección."
        />
      </Card>
    );
  }

  return <Outlet />;
}

function Home() {
  const { user } = useSession();

  return (
    <Card title={`Bienvenido, ${user?.nombre}`} subtitle={user?.rol.nombre}>
      <Empty
        title="Tu cuenta está lista"
        text="Selecciona un módulo en el menú lateral para comenzar a operar."
      />
    </Card>
  );
}

export function AppRoutes() {
  const { user } = useSession();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-contrasena" element={<PasswordRecovery />} />
      <Route path="/restablecer-contrasena" element={<PasswordReset />} />

      <Route element={<Guard />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to={firstPath(user)} replace />} />

          <Route path="/inicio" element={<Home />} />
          <Route path="/mi-perfil" element={<Profile />} />

          {/* Gestión de Usuarios y Seguridad */}
          <Route element={<Guard module="usuarios" />}>
            <Route path="/usuarios" element={<Users />} />
            <Route path="/usuarios/crear" element={<UserForm />} />
            <Route path="/usuarios/:ci/editar" element={<UserForm />} />
            <Route path="/usuarios/:ci" element={<UserForm readonly />} />
          </Route>

          <Route element={<Guard module="roles" />}>
            <Route path="/usuarios/roles" element={<Roles />} />
            <Route path="/usuarios/roles/crear" element={<RoleForm />} />
            <Route path="/usuarios/roles/:id/editar" element={<RoleForm />} />
          </Route>

          <Route element={<Guard module="permisos" />}>
            <Route path="/usuarios/permisos" element={<Permissions />} />
            <Route path="/usuarios/permisos/crear" element={<PermissionForm />} />
            <Route path="/usuarios/permisos/:id/editar" element={<PermissionForm />} />
          </Route>

          {/* CU20: Módulos del Sistema */}
          <Route element={<Guard module="modulos" />}>
            <Route path="/usuarios/modulos" element={<SystemModules />} />
            <Route path="/usuarios/modulos/crear" element={<SystemModuleForm />} />
            <Route path="/usuarios/modulos/:id/editar" element={<SystemModuleForm />} />
          </Route>

          {/* Gestión de Empresa */}
          <Route element={<Guard module="sucursales" />}>
            <Route path="/empresa/sucursales" element={<Branches />} />
            <Route path="/empresa/sucursales/crear" element={<BranchForm />} />
            <Route path="/empresa/sucursales/:id/editar" element={<BranchForm />} />
            <Route path="/empresa/sucursales/:id" element={<BranchForm readonly />} />
          </Route>
          <Route element={<Guard module="empresa" />}>
            <Route path="/empresa" element={<CompanyPage />} />
          </Route>

          <Route element={<Guard module="bitacora" />}>
            <Route path="/empresa/bitacora" element={<AuditPage />} />
          </Route>

          {/* Gestión de Inventario (Ciclo 2 y CU19) */}
          <Route element={<Guard module="productos" />}>
            <Route path="/productos" element={<Products />} />
            <Route path="/productos/crear" element={<ProductForm />} />
            <Route path="/productos/:id/editar" element={<ProductForm />} />
          </Route>

          <Route element={<Guard module="combustibles" />}>
            <Route path="/productos/combustibles" element={<Fuels />} />
            <Route path="/productos/combustibles/crear" element={<FuelForm />} />
            <Route path="/productos/combustibles/:id/editar" element={<FuelForm />} />
          </Route>

          <Route element={<Guard module="categorias" />}>
            <Route path="/productos/categorias-grupos" element={<CategoriesGroups />} />
            <Route path="/productos/categorias-grupos/crear" element={<CategoryGroupForm />} />
          </Route>

          <Route element={<Guard module="salidas" />}>
            <Route path="/inventario/salidas" element={<ProductExits />} />
            <Route path="/inventario/salidas/crear" element={<ProductExitForm />} />
          </Route>

          {/* Gestión de Compras (Ciclo 3) */}
          <Route element={<Guard module="proveedores" />}>
            <Route path="/compras/proveedores" element={<Providers />} />
            <Route path="/compras/proveedores/crear" element={<ProviderForm />} />
            <Route path="/compras/proveedores/:id" element={<ProviderDetail />} />
            <Route path="/compras/proveedores/:id/editar" element={<ProviderForm />} />
          </Route>

          <Route element={<Guard module="ordenes" />}>
            <Route path="/compras/ordenes" element={<PurchaseOrders />} />
            <Route path="/compras/ordenes/crear" element={<PurchaseOrderForm />} />
          </Route>

          <Route element={<Guard module="compras" />}>
            <Route path="/compras" element={<Purchases />} />
            <Route path="/compras/crear" element={<PurchaseForm />} />
            <Route path="/compras/:id" element={<PurchaseDetail />} />
          </Route>

          {/* Gestión de Ventas (Ciclo 4) */}
          <Route element={<Guard module="ventas" />}>
            <Route path="/ventas" element={<Sales />} />
            <Route path="/ventas/nueva" element={<SaleForm />} />
            <Route path="/ventas/:id" element={<SaleDetail />} />
          </Route>

          <Route element={<Guard module="dispensadores" />}>
            <Route path="/ventas/dispensadores" element={<Dispensers />} />
            <Route path="/ventas/dispensadores/crear" element={<DispenserForm />} />
            <Route path="/ventas/dispensadores/:id/editar" element={<DispenserForm />} />
          </Route>

          <Route element={<Guard module="descuentos" />}>
            <Route path="/ventas/descuentos" element={<Discounts />} />
            <Route path="/ventas/descuentos/crear" element={<DiscountForm />} />
            <Route path="/ventas/descuentos/:id/editar" element={<DiscountForm />} />
          </Route>

          {/* Reportes y Estadísticas (Ciclo 4) */}
          <Route element={<Guard module="reportes" />}>
            <Route path="/reportes" element={<Reports />} />
          </Route>

          <Route
            path="*"
            element={
              <Card>
                <Empty
                  title="Página no encontrada"
                  text="Selecciona una sección en el menú para continuar."
                />
              </Card>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
