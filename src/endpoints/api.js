const publicApiBase = process.env.NEXT_PUBLIC_API || process.env.NEXT_PUBLIC_AP || '';

export const apiBase = publicApiBase;
export const apiVentas = process.env.API_VENTAS || publicApiBase;