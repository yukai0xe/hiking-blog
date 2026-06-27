export function toDateInput(d: Date | null | undefined): string {
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseDate(dateStr: string): { date: Date | null; iso: string | null } {
  if (!dateStr) return { date: null, iso: null }
  const d = new Date(dateStr + 'T00:00')
  if (isNaN(d.getTime())) return { date: null, iso: null }
  return { date: d, iso: d.toISOString() }
}

export function formatWptTime(d: Date): string {
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function safeFilename(s: string): string {
  return s.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'export'
}

export function fmtDate(iso: string): string {
  const d = iso.slice(0, 10)
  return `${d.slice(0, 4)}/${d.slice(5, 7)}/${d.slice(8, 10)}`
}
