// Conta super-admin que enxerga métricas globais em /admin.
// O fluxo de login bootstrappa essa conta no Firebase Auth na primeira
// tentativa, criando o doc em users/{uid} com isSuperAdmin: true e role: admin.
export const SUPER_ADMIN_EMAIL = "visionxma@gmail.com"
export const SUPER_ADMIN_PASSWORD = "FroX@Admin2026!"
export const SUPER_ADMIN_NAME = "Super Admin FroX"
export const SUPER_ADMIN_COMPANY = "FroX"

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}
