import { ContratoInesperado } from './errors';
// Quoted fields, escaped quotes and CRLF; decoding must precede tokenization.
export function csv(bytes: Uint8Array): string[][] {
  const text = Buffer.from(bytes).toString('latin1');
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false; let closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; } }
      else field += c;
    } else if (c === '"' && field === '' && !closed) quoted = true;
    else if (c === ';' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false;
      if (c !== ';') { if (c === '\r' && text[i+1] === '\n') i++; if (row.some(v => v !== '')) rows.push(row); row = []; }
    } else { if (closed || c === '"') throw new ContratoInesperado('Aspas CSV inesperadas'); field += c; }
  }
  if (quoted) throw new ContratoInesperado('Campo CSV não terminado');
  if (field !== '' || row.length || closed) { row.push(field); rows.push(row); }
  return rows;
}
export const absent = (value: string) => ['','#NULO#','-1','-3','#NE'].includes(value.trim());
export function count(raw: string): number | null {
  if (absent(raw)) return null;
  if (!/^\d+$/.test(raw.trim())) throw new ContratoInesperado(`Contagem inválida: ${raw}`);
  const value = Number(raw.trim());
  if (!Number.isSafeInteger(value)) throw new ContratoInesperado('Contagem fora do intervalo seguro');
  return value;
}
