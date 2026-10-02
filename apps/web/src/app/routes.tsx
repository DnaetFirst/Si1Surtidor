import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuditPage } from '../modules/enterprise/audit/presentation/Audit';
import { CompanyPage } from '../modules/enterprise/company/presentation/Company';
import { allowed, firstPath, useSession } from '../modules/security/auth/application/session';
import { Login } from '../modules/security/auth/presentation/Login';
import { PermissionForm, Permissions } from '../modules/security/permissions/presentation/Permissions';
import { RoleForm, Roles } from '../modules/security/roles/presentation/Roles';
import { Profile } from '../modules/security/users/presentation/Profile';
import { UserForm, Users } from '../modules/security/users/presentation/Users';
import { Card, Empty, Loading } from '../shared/presentation/index';
import { Layout } from './Layout';

function Guard({
    module
}: {
    module?: string;
}) {
    const { user, ready } = useSession();

    if (!ready)
        return <Loading text="Verificando sesión…"/>;

    if (!user)
        return <Navigate to="/login" replace/>;

    if (module && !allowed(user, module))
        return (
            <Card>
                <Empty
                    title="Acceso restringido"
                    text="Tu rol no tiene permiso para consultar esta sección."
                />
            </Card>
        );

    return <Outlet />;
}

function Home() {
    const { user } = useSession();

    return (
        <Card
            title={`Bienvenido, ${user?.nombre}`}
            subtitle={user?.rol.nombre}
        >
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
            <Route path="/login" element={<Login />}/>

            <Route element={<Guard />}>
                <Route element={<Layout />}>
                    <Route
                        path="/"
                        element={<Navigate to={firstPath(user)} replace/>}
                    />

                    <Route path="/inicio" element={<Home />}/>
                    <Route path="/mi-perfil" element={<Profile />}/>

                    <Route element={<Guard module="usuarios"/>}>
                        <Route path="/usuarios" element={<Users />}/>
                        <Route path="/usuarios/crear" element={<UserForm />}/>
                        <Route path="/usuarios/:ci/editar" element={<UserForm />}/>
                        <Route path="/usuarios/:ci" element={<UserForm readonly/>}/>
                    </Route>

                    <Route element={<Guard module="roles"/>}>
                        <Route path="/usuarios/roles" element={<Roles />}/>
                        <Route path="/usuarios/roles/crear" element={<RoleForm />}/>
                        <Route path="/usuarios/roles/:id/editar" element={<RoleForm />}/>
                    </Route>

                    <Route element={<Guard module="permisos"/>}>
                        <Route path="/usuarios/permisos" element={<Permissions />}/>
                        <Route path="/usuarios/permisos/crear" element={<PermissionForm />}/>
                        <Route path="/usuarios/permisos/:id/editar" element={<PermissionForm />}/>
                    </Route>

                    <Route element={<Guard module="empresa"/>}>
                        <Route path="/empresa" element={<CompanyPage />}/>
                    </Route>

                    <Route element={<Guard module="bitacora"/>}>
                        <Route path="/empresa/bitacora" element={<AuditPage />}/>
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