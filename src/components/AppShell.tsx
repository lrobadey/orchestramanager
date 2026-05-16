import React from 'react'

interface AppShellProps {
  left: React.ReactNode
  children: React.ReactNode
}

export default function AppShell({ left, children }: AppShellProps) {
  return (
    <div className="shell-root">
      <header className="shell-header">
        <div className="shell-header-inner">
          <span className="shell-title">Orchestra Manager</span>
          <span className="shell-subtitle">Seattle · Debut Season</span>
        </div>
      </header>
      <div className="shell-body">
        <aside className="shell-left">{left}</aside>
        <main className="shell-main">{children}</main>
      </div>
    </div>
  )
}
