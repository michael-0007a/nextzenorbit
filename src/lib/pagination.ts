export function pagination(search: URLSearchParams, defaultLimit = 50) {
  const integer = (key: string, fallback: number, max: number) => {
    const value = Number(search.get(key));
    return Number.isSafeInteger(value) && value > 0 ? Math.min(value, max) : fallback;
  };
  const page = integer("page", 1, 100_000);
  const limit = integer("limit", defaultLimit, 100);
  return { page, limit, offset: (page - 1) * limit };
}
export function paginationMeta(page: number, limit: number, total: number) {
  return { page, perPage: limit, total, totalPages: Math.ceil(total / limit) };
}
