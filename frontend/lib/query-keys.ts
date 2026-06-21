export const queryKeys = {
  products: (params: { search: string; page: number; limit: number }) =>
    ['products', params] as const,
  order: (id: string) => ['orders', id] as const,
  salesReport: (params: { from: string; to: string }) => ['reports', 'sales', params] as const,
}
