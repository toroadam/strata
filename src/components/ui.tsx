import React from 'react'
import { colors } from '../styles/tokens'

/* ============================================================
   Icons — crisp 24px line icons (stroke-based)
   ============================================================ */
type IconProps = { size?: number; className?: string; style?: React.CSSProperties; strokeWidth?: number }
const ic = (path: React.ReactNode) => ({ size = 20, className, style, strokeWidth = 1.8 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    {path}
  </svg>
)

export const Icons = {
  Upload: ic(<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>),
  Image: ic(<><rect x="3" y="3" width="18" height="18" rx="2.5" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>),
  Map: ic(<><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></>),
  Pin: ic(<><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>),
  Check: ic(<path d="M20 6 9 17l-5-5" />),
  CheckCircle: ic(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5L16 9" /></>),
  Search: ic(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  Plus: ic(<><path d="M12 5v14M5 12h14" /></>),
  ArrowRight: ic(<><path d="M5 12h14M13 6l6 6-6 6" /></>),
  ArrowLeft: ic(<><path d="M19 12H5M11 18l-6-6 6-6" /></>),
  ChevronRight: ic(<path d="m9 6 6 6-6 6" />),
  X: ic(<path d="M18 6 6 18M6 6l12 12" />),
  Layers: ic(<><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>),
  Sparkles: ic(<><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" /><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>),
  Eye: ic(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  EyeOff: ic(<><path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.2M6.7 6.7A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4-.9" /><path d="m3 3 18 18" /><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" /></>),
  Activity: ic(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />),
  Rocket: ic(<><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8.9-2.2 0-3-.8-.8-2.2-.7-3 0Z" /><path d="M9 13a16 16 0 0 1 7-9c2.5 0 4 1.5 4 4a16 16 0 0 1-9 7l-2-2Z" /><circle cx="15" cy="9" r="1.3" /></>),
  Globe: ic(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></>),
  Flag: ic(<><path d="M5 21V4M5 4l9 2-2 5 7 1V4l-14-2" /></>),
  Sliders: ic(<><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0M16 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="14" cy="18" r="2" /></>),
  Download: ic(<><path d="M12 4v12M7 11l5 5 5-5" /><path d="M5 20h14" /></>),
  Clock: ic(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  Grid: ic(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
}

/* ============================================================
   Button
   ============================================================ */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark'
type ButtonSize = 'sm' | 'md' | 'lg'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', iconLeft, iconRight, children, className = '', ...rest }) => {
  const sizeClass = size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : ''
  return (
    <button className={`btn btn-${variant} ${sizeClass} ${className}`} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}

/* ============================================================
   Card
   ============================================================ */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: number | string
}
export const Card: React.FC<CardProps> = ({ hover, padding = 20, style, className = '', children, ...rest }) => (
  <div className={`card ${hover ? 'card-hover' : ''} ${className}`} style={{ padding, ...style }} {...rest}>
    {children}
  </div>
)

/* ============================================================
   Badge
   ============================================================ */
type EnvKind = 'sandbox' | 'staging' | 'production'
const ENV_STYLES: Record<EnvKind, { bg: string; fg: string; dot: string; label: string }> = {
  sandbox: { bg: colors.successTint, fg: '#0F5132', dot: '#16A34A', label: 'Sandbox' },
  staging: { bg: colors.infoTint, fg: '#0369A1', dot: '#0EA5E9', label: 'Staging' },
  production: { bg: colors.warningTint, fg: '#92400E', dot: '#D97706', label: 'Production' },
}
export const EnvBadge: React.FC<{ env: EnvKind }> = ({ env }) => {
  const s = ENV_STYLES[env] || ENV_STYLES.sandbox
  return (
    <span className="badge" style={{ background: s.bg, color: s.fg }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {s.label}
    </span>
  )
}

export const Badge: React.FC<{ children: React.ReactNode; bg?: string; fg?: string; dot?: string }> = ({ children, bg = colors.gray100, fg = colors.gray700, dot }) => (
  <span className="badge" style={{ background: bg, color: fg }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: dot }} />}
    {children}
  </span>
)

/* ============================================================
   Form fields
   ============================================================ */
export const Field: React.FC<{ label: string; hint?: string; optional?: boolean; children: React.ReactNode }> = ({ label, hint, optional, children }) => (
  <div>
    <label className="field-label">
      {label}{optional && <span style={{ color: colors.gray400, fontWeight: 500 }}> · optional</span>}
    </label>
    {children}
    {hint && <p style={{ margin: '6px 0 0', fontSize: 12, color: colors.gray500 }}>{hint}</p>}
  </div>
)

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => (
  <input className={`input ${className}`} {...rest} />
)
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...rest }) => (
  <select className={`select ${className}`} {...rest}>{children}</select>
)
export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...rest }) => (
  <textarea className={`textarea ${className}`} {...rest} />
)

/* ============================================================
   Section heading for steps
   ============================================================ */
export const StepTitle: React.FC<{ eyebrow?: string; title: string; subtitle?: string }> = ({ eyebrow, title, subtitle }) => (
  <div style={{ marginBottom: 4 }}>
    {eyebrow && (
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.toroRed, marginBottom: 8 }}>
        {eyebrow}
      </div>
    )}
    <h2 style={{ fontSize: 28, fontWeight: 700, color: colors.ink, lineHeight: 1.15 }}>{title}</h2>
    {subtitle && <p style={{ margin: '10px 0 0', fontSize: 15, color: colors.gray500, lineHeight: 1.55, maxWidth: 620 }}>{subtitle}</p>}
  </div>
)
