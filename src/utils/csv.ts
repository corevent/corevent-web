function escapeCell(value: string | number): string {
  let text = String(value)
  // Neutralize spreadsheet formulas (CSV/formula injection): user-provided names starting
  // with = + - @ (or tab/CR) would otherwise be executed by Excel/LibreOffice.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Downloads a ";"-separated CSV with BOM so Excel (pt-BR) opens accents correctly. */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]): void {
  const content = [header, ...rows].map((row) => row.map(escapeCell).join(';')).join('\r\n')
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
