import { z } from 'zod';
import { Parser as Json2CsvParser } from 'json2csv';
import logger from '../config/logger.js';
import { fetchDispenses, DispenseFiltersSchema } from './repositories/DispensesRepo.js';

const CsvFields = [
  { label: 'Dispensed At', value: 'dispensedAt' },
  { label: 'Medicine', value: 'medicineName' },
  { label: 'Quantity', value: 'quantity' },
  { label: 'Unit Price', value: 'unitPrice' },
  { label: 'Total Price', value: 'totalPrice' },
  { label: 'Patient Name', value: 'patientName' },
  { label: 'Patient Number', value: 'patientNumber' },
  { label: 'Dispensed By', value: (row) => row.dispensedBy?.name || '' },
  { label: 'Dispensed By Role', value: (row) => row.dispensedBy?.role || '' },
  { label: 'Invoice ID', value: 'invoiceId' },
];

export const DispenseQuerySchema = DispenseFiltersSchema.extend({
  format: z.enum(['json', 'csv']).optional(),
});

class DispensesService {
  async list(filters) {
    const parsed = DispenseQuerySchema.parse(filters || {});
    logger.debug('[DispensesService] list with filters', { filters: parsed });
    const result = await fetchDispenses(parsed);
    return result;
  }

  async exportCsv(filters) {
    // Export respecting validation limits: paginate internally to collect all rows
    const base = DispenseQuerySchema.parse({ ...filters, page: 1, pageSize: 100 });

    let allItems = [];
    let page = 1;
    // Hard safety cap to prevent runaway loops
    const MAX_PAGES = 1000;

    // Fetch first page and then continue until all items are collected
    // Uses server-side total to stop when we have everything
    // pageSize <= 100 as per schema; iterate pages instead of requesting a huge pageSize
    /* eslint-disable no-await-in-loop */
    while (page <= MAX_PAGES) {
      const { items, total } = await fetchDispenses({ ...base, page });
      allItems = allItems.concat(items || []);
      if (!items?.length || allItems.length >= (total || 0)) {
        break;
      }
      page += 1;
    }
    /* eslint-enable no-await-in-loop */

    const parser = new Json2CsvParser({ fields: CsvFields, withBOM: true });
    const csv = parser.parse(allItems);
    return csv;
  }
}

export default new DispensesService();
