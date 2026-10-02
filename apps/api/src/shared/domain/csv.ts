/** Every cell is quoted; spreadsheet formula prefixes are neutralized as text. */
export function csv(headers: string[], rows: unknown[][]): string {
    const cell = (value: unknown) => {
        let text = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
        if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
            text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    };
    return '\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
}
