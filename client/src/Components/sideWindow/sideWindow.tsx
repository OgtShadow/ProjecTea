import './sideWindow.css'
import type { ReactNode } from 'react'
import { useState } from 'react'

interface Props {
  children: ReactNode
  side?: 'left' | 'right'
  ariaLabel?: string
}

function SideWindow({ children, side = 'left', ariaLabel = 'Panel boczny' }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <aside
      className={`side-window side-window-${side} ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      aria-label={ariaLabel}
    >
      <div className="side-window-handle" aria-hidden="true" />

      <div className="side-window-content" aria-hidden={!isExpanded}>
        <div className="side-window-slot">{children}</div>
      </div>
    </aside>
  )
}

export default SideWindow