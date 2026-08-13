/**
 * Updates per page of the trip report. A long trip's report is mostly photos,
 * and every one a reader scrolls past is a download from the store — lazy
 * loading means an unread photo costs nothing, but reaching the bottom of a
 * two-month trip would still pull every photo in it. A page bounds what one
 * visit can fetch, and most readers only want the last few days anyway.
 */
export const REPORT_PAGE_SIZE = 20;

/**
 * Slice newest-first items for `?page=N`. A page number that is out of range,
 * zero, or not a number lands on page 1 rather than an empty page.
 */
export function paginate<T>(
  items: T[],
  page: string | undefined,
  size = REPORT_PAGE_SIZE,
): { pageItems: T[]; currentPage: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const requested = Number.parseInt(page ?? "1", 10);
  const currentPage =
    Number.isFinite(requested) && requested >= 1 && requested <= totalPages ? requested : 1;
  const start = (currentPage - 1) * size;
  return { pageItems: items.slice(start, start + size), currentPage, totalPages };
}
