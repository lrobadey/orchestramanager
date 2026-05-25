import React from 'react'
import logo from '../assets/logo.png'

interface AppShellProps {
  vitals?: React.ReactNode
  children: React.ReactNode
  position?: React.ReactNode
  nav?: React.ReactNode
  seasonDots?: React.ReactNode
  chromeless?: boolean
}

export default function AppShell({
  vitals,
  children,
  position,
  nav,
  seasonDots,
  chromeless,
}: AppShellProps) {
  if (chromeless) {
    return (
      <div className="shell-root">
        <main className="shell-main shell-main-bleed">{children}</main>
      </div>
    )
  }
  return (
    <div className="shell-root">
      <header className="shell-header">
        <div className="shell-header-inner">
          <div className="shell-brand">
            <img src={logo} alt="Orchestra Manager" className="shell-logo" />
            <span className="shell-title">Orchestra Manager</span>
            {position && <span className="shell-position">{position}</span>}
            {seasonDots}
          </div>
          {nav && <nav className="shell-nav">{nav}</nav>}
        </div>
      </header>
      {vitals}
      <main className="shell-main">{children}</main>
    </div>
  )
}
