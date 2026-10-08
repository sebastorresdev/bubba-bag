import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

export function exportToExcel<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
  const rows = data.map(item => {
    const row: Record<string, string | number | boolean> = {};
    columns.forEach(col => {
      const val = col.accessor(item);
      row[col.header] = val ?? '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  // Ajustar anchos de columnas automáticamente
  const colWidths = columns.map(col => {
    const maxLen = Math.max(
      col.header.length,
      ...rows.map(r => String(r[col.header] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 60) };
  });
  worksheet['!cols'] = colWidths;

  const cleanName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanName);
}

export function exportToCSV<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
  const rows = data.map(item => {
    const row: Record<string, string | number | boolean> = {};
    columns.forEach(col => {
      const val = col.accessor(item);
      row[col.header] = val ?? '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', cleanName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
