import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 24, ...rest }: P, children: React.ReactNode, fill = false) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

export const IconHome = (p: P) => base(p, <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>)
export const IconHomeFill = (p: P) => base(p, <path d="M11.3 2.7a1.1 1.1 0 0 1 1.4 0l8.5 7.1c.5.4.2 1.2-.4 1.2H19.5v8.8a1.2 1.2 0 0 1-1.2 1.2H14.5v-6h-5v6H5.7a1.2 1.2 0 0 1-1.2-1.2V11H3.2c-.6 0-.9-.8-.4-1.2l8.5-7.1Z" />, true)
export const IconLayers = (p: P) => base(p, <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /><path d="m3 16.5 9 5 9-5" /></>)
export const IconClipboard = (p: P) => base(p, <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><rect x="9" y="2.5" width="6" height="3" rx="1" /><path d="M9 11h6M9 15h4" /></>)
export const IconPlay = (p: P) => base(p, <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></>)
export const IconGrid = (p: P) => base(p, <><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /></>)
export const IconGridFill = (p: P) => base(p, <><circle cx="7" cy="7" r="3.3" /><circle cx="17" cy="7" r="3.3" /><circle cx="7" cy="17" r="3.3" /><circle cx="17" cy="17" r="3.3" /></>, true)
export const IconBell = (p: P) => base(p, <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>)
export const IconUser = (p: P) => base(p, <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" /></>)
export const IconSearch = (p: P) => base(p, <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)
export const IconCap = (p: P) => base(p, <><path d="M22 9 12 4 2 9l10 5 10-5Z" /><path d="M6 11v5c3 2.5 9 2.5 12 0v-5" /><path d="M22 9v6" /></>)
export const IconCapFill = (p: P) => base(p, <><path d="M12 3.5 1 9l11 5.5L21 10v6h2V9L12 3.5Z" /><path d="M5.5 12.6V16c3.4 3 9.6 3 13 0v-3.4L12 15.9l-6.5-3.3Z" /></>, true)
export const IconBook = (p: P) => base(p, <><path d="M2 5c3-1.5 6-1.5 10 1 4-2.5 7-2.5 10-1v14c-3-1.5-6-1.5-10 1-4-2.5-7-2.5-10-1V5Z" /><path d="M12 6v14" /></>)
export const IconHorse = (p: P) => base(p, <><path d="M2.5 18c5.5 3.5 13.5 3.5 19 0" /><path d="M7.5 19.6 8.6 14.5M16.5 19.6l-1-5" /><path d="M8.6 14.5h7.4c1.2-1.5 1.4-3 1-4.5" /><path d="M8.6 14.5C6.8 12.5 7 9 9.5 7.5L10 3.5l2.2 2.4c2.3.1 4.3 1.4 5 3.4L20.5 11l-.8 1.8-2.7-.8" /><circle cx="12.3" cy="8.3" r=".9" fill="currentColor" stroke="none" /></>)
export const IconArrowRight = (p: P) => base(p, <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>)
export const IconChevronRight = (p: P) => base(p, <path d="m9 6 6 6-6 6" />)
export const IconCart = (p: P) => base(p, <><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21.5 8H6" /><circle cx="10" cy="20.5" r="1.5" /><circle cx="18" cy="20.5" r="1.5" /></>)
export const IconShare = (p: P) => base(p, <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>)
export const IconUsers = (p: P) => base(p, <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" /><circle cx="5" cy="9" r="2.5" /><circle cx="19" cy="9" r="2.5" /><path d="M1 18v-.5A3.5 3.5 0 0 1 4.5 14M23 18v-.5a3.5 3.5 0 0 0-3.5-3.5" /></>)
export const IconBox = (p: P) => base(p, <><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" /><path d="m3 7 9 5 9-5M12 12v10" /><path d="m7.5 4.5 9 5" /></>)
export const IconChart = (p: P) => base(p, <><path d="M5 20V12M10 20V8M15 20v-6M20 20V5" strokeWidth={3} /><path d="M3 21h18" /></>)
export const IconMegaphone = (p: P) => base(p, <><path d="M3 10v4a1 1 0 0 0 1 1h3l8 5V4L7 9H4a1 1 0 0 0-1 1Z" /><path d="M7 15l1.5 5h2.5l-1-5" /><path d="M19 9a4 4 0 0 1 0 6" /></>)
export const IconWallet = (p: P) => base(p, <><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" /><path d="M3 7h16a2 2 0 0 1 2 2v2h-5a2.5 2.5 0 0 0 0 5h5" /><circle cx="16" cy="13.5" r=".6" fill="currentColor" /></>)
export const IconHeadset = (p: P) => base(p, <><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><rect x="2" y="13" width="5" height="7" rx="2" /><rect x="17" y="13" width="5" height="7" rx="2" /><path d="M19.5 20c0 1.5-2 2.5-5 2.5H12" /></>)
export const IconSettings = (p: P) => base(p, <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>)
export const IconStar = (p: P) => base(p, <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />, true)
export const IconBolt = (p: P) => base(p, <path d="M13.5 1.5 4 13.5h7l-1.5 9 9.5-12h-7l1.5-9Z" />, true)
export const IconIdCard = (p: P) => base(p, <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3v2h6V3M8 11h8M8 15h5" /></>)
export const IconHand = (p: P) => base(p, <><path d="M7 11V8a1.5 1.5 0 0 1 3 0v3M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6" /><path d="M16 9a1.5 1.5 0 0 1 3 0v5a8 8 0 0 1-8 8h-.5a7 7 0 0 1-5.6-2.8L2.6 16a1.6 1.6 0 0 1 2.4-2l2 1.8V11" /></>)
export const IconLogout = (p: P) => base(p, <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>)
export const IconShield = (p: P) => base(p, <><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></>)

export function Trophy({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 130" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#ffe9a3" /><stop offset=".45" stopColor="#f5c542" /><stop offset="1" stopColor="#c98a12" /></linearGradient>
        <linearGradient id="tb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2f4fd1" /><stop offset="1" stopColor="#14246b" /></linearGradient>
      </defs>
      {/* laurels */}
      {[0, 1].map((side) => (
        <g key={side} transform={side ? 'translate(160 0) scale(-1 1)' : undefined} fill="#4f6fe0">
          <path d="M30 100c-10-14-12-32-4-48" stroke="#4f6fe0" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="20" cy="56" rx="4.5" ry="9" transform="rotate(-30 20 56)" />
          <ellipse cx="17" cy="70" rx="4.5" ry="9" transform="rotate(-55 17 70)" />
          <ellipse cx="19" cy="84" rx="4.5" ry="9" transform="rotate(-75 19 84)" />
          <ellipse cx="32" cy="58" rx="4" ry="8" transform="rotate(25 32 58)" />
          <ellipse cx="31" cy="73" rx="4" ry="8" transform="rotate(10 31 73)" />
          <ellipse cx="33" cy="88" rx="4" ry="8" transform="rotate(-5 33 88)" />
        </g>
      ))}
      {/* handles */}
      <path d="M52 30H38c0 18 8 28 20 30M108 30h14c0 18-8 28-20 30" stroke="url(#tg)" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* cup */}
      <path d="M50 18h60v18c0 22-13 36-30 36S50 58 50 36V18Z" fill="url(#tg)" />
      <ellipse cx="80" cy="18" rx="30" ry="5" fill="#ffefb8" />
      <path d="m80 30 4 8.2 9 1.3-6.5 6.3 1.5 9-8-4.2-8 4.2 1.5-9-6.5-6.3 9-1.3L80 30Z" fill="#fff6d0" opacity=".9" />
      <rect x="74" y="72" width="12" height="12" fill="url(#tg)" />
      <path d="M64 84h32l4 10H60l4-10Z" fill="url(#tg)" />
      {/* base */}
      <rect x="54" y="94" width="52" height="22" rx="4" fill="url(#tb)" />
      <rect x="66" y="100" width="28" height="9" rx="2" fill="#f5c542" />
      <ellipse cx="80" cy="120" rx="38" ry="5" fill="#1d2f86" opacity=".18" />
    </svg>
  )
}
