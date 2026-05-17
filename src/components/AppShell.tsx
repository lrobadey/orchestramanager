import React from 'react'

interface AppShellProps {
  left: React.ReactNode
  children: React.ReactNode
  timeline?: React.ReactNode
  rightRail?: React.ReactNode
}

export default function AppShell({ left, children, timeline, rightRail }: AppShellProps) {
  return (
    <div className={`shell-root${rightRail ? ' has-rail' : ''}`}>
      <aside className="shell-sidebar">{left}</aside>
      <header className="shell-topbar">{timeline}</header>
      <main className="shell-main">{children}</main>
      {rightRail && <aside className="shell-rightrail">{rightRail}</aside>}
    </div>
  )
}
