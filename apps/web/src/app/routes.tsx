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
        text="Tu rol no tiene módulos disponibles en este ciclo. Puedes cerrar sesión desde el icono de tu cuenta."
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

          {/* Gestión de Inventario (Ciclo 2) */}
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
