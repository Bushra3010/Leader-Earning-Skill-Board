export function inr(n: number) {
  return '₹' + Math.round(Number(n)).toLocaleString('en-IN')
}

export function maskPhone(p: string) {
  const d = p.replace(/\s/g, '')
  if (d.length < 6) return d
  return d.slice(0, d.length - 7) + 'xxxxx' + d.slice(-2)
}

export function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
