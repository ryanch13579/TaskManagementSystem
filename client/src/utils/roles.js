export const hasRole = (user, role) => !!user?.roles?.includes(role);

export const isAdmin = (user) => hasRole(user, "admin");

export const hasNonAdminRole = (user) => !!user?.roles?.some((r) => r !== "admin");
