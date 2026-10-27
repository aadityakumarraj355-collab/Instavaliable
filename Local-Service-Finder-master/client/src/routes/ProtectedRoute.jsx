import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AccessDenied from '../pages/AccessDenied'

export default function ProtectedRoute({ roles, permission, requireSuperAdmin = false, children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    const isAdminRoute = requireSuperAdmin || roles?.includes('admin') || roles?.includes('super_admin')
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />
  }

  // 1. Strict Super Admin Check
  if (requireSuperAdmin) {
    if (user?.role !== 'super_admin') {
      return (
        <AccessDenied
          title="Super Administrator Access Required"
          reason="This administrative management area is strictly restricted to the authorized Super Administrator."
        />
      )
    }
  }

  // 2. Role Check (super_admin satisfies 'admin' role check)
  if (roles && roles.length > 0) {
    const isSuperAdminAllowedAsAdmin = roles.includes('admin') && user?.role === 'super_admin'
    const hasRole = roles.includes(user?.role) || isSuperAdminAllowedAsAdmin

    if (!hasRole) {
      return (
        <AccessDenied
          title="Access Denied"
          reason={`Your current role (${user?.role}) does not have permission to view this section.`}
        />
      )
    }
  }

  // 3. Fine-Grained Permission Check (super_admin has all permissions implicitly)
  if (permission) {
    const isSuperAdmin = user?.role === 'super_admin'
    let hasPermission = false

    if (Array.isArray(permission)) {
      hasPermission = permission.some((p) => user?.permissions?.includes(p))
    } else {
      hasPermission = user?.permissions && user.permissions.includes(permission)
    }

    if (!isSuperAdmin && !hasPermission) {
      return (
        <AccessDenied
          title="Permission Denied"
          reason="Your administrator account has not been granted the required permission to access this tool."
          permission={Array.isArray(permission) ? permission.join(', ') : permission}
        />
      )
    }
  }

  return children ? children : <Outlet />
}
