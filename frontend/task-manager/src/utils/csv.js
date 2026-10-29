export function toCsv(rows) {
  return rows.map((row) => row.map((value) => {
    let text = String(value ?? '');
    // Keep user-entered text from being interpreted as a spreadsheet formula.
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }).join(',')).join('\r\n');
}
