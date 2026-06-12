/**
 * Material Symbols Outlined icon wrapper
 */
export function Icon({ name, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      role="img"
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
