/**
 * MaapSetu Design Tokens: "Instrument & Ledger"
 * Precise design constants reflecting calibration, hairline borders, and official certificate tones.
 */

export type AppStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'active'
  | 'valid'
  | 'expiring_soon'
  | 'expired'
  | 'revoked';

export const tokens = {
  surfaces: {
    ink950: '#0D111A', // Sidebar, headers, deep panels
    ink800: '#171D2B', // Raised ink surfaces, hover on ink-950
    paper50: '#FAF8F3', // App background — warm document paper
    paper0: '#FFFFFF', // Cards, panels, tables
    line200: '#E4E0D6', // Hairline borders on paper surfaces
    lineInk: '#2A3142', // Hairline borders on ink surfaces
  },
  text: {
    paper900: '#171A21', // Primary text on paper
    paper600: '#5B5F6B', // Secondary text on paper
    paper400: '#8A8D96', // Muted / metadata on paper
    ink100: '#F3F1EA', // Primary text on ink
    ink500: '#9AA0AF', // Secondary text on ink
  },
  seal: {
    600: '#A6772E', // Brass / seal gold — primary CTA, verified mark, active nav indicator
    700: '#8C6226', // Hover/pressed state
    50: 'rgba(166, 119, 46, 0.08)',
    border: 'rgba(166, 119, 46, 0.25)',
  },
  status: {
    neutral: '#6B7280', // submitted, expired, inactive
    info: '#2F6FED', // assigned
    warning: '#B76E00', // in-progress, expiring-soon
    success: '#1F8A54', // completed / certificate valid
    danger: '#C4291C', // rejected / revoked
  },
  typography: {
    display: 'font-fraunces font-semibold tracking-tight',
    body: 'font-sans font-normal',
    mono: 'font-mono tracking-tight',
  },
  radius: {
    button: 'rounded-[6px]',
    card: 'rounded-[10px]',
  },
};
