import { useState } from "react"
import { Link, NavLink } from "react-router"
import { Menu, X } from "lucide-react"
import { useAppSelector, useAppDispatch } from "../app/hooks"
import { logout, selectToken } from "../features/auth/authSlice"

type NavItem = {
  to: string
  label: string
}

/* HR specific navigation links */
const HR_LINKS: NavItem[] = [
  { to: "/hr", label: "Home" },
  { to: "/hr/employee-profiles", label: "Employee Profiles" },
  { to: "/hr/visa-management", label: "Visa Status Management" },
  { to: "/hr/hiring", label: "Hiring Management" },
  { to: "/hr/housing-management", label: "Housing Management" },
]

const HRNavBar = () => {
  const [open, setOpen] = useState(false)
  const token = useAppSelector(selectToken)
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    dispatch(logout())
    setOpen(false)
  }

  /* Tailwind class helpers */
  const base = "block rounded px-3 py-2 text-sm font-medium transition"
  const active = "bg-indigo-600 text-white"
  const inactive = "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 md:px-6">
        {/* Brand */}
        <Link to="/hr" className="text-xl font-bold text-indigo-700">
          HR Portal
        </Link>

        {/* Hamburger (mobile only) */}
        <button
          className="md:hidden"
          onClick={() => {
            setOpen(!open)
          }}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Links – desktop */}
        <ul className="hidden gap-2 md:flex">
          {HR_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `${base} ${isActive ? active : inactive}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}

          {token ? (
            <li>
              <button onClick={handleLogout} className={`${base} ${inactive}`}>
                Logout
              </button>
            </li>
          ) : (
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${base} ${isActive ? active : inactive}`
                }
              >
                Login
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      {/* Links – mobile dropdown */}
      {open && (
        <ul className="space-y-1 border-t p-4 md:hidden">
          {HR_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={() => {
                  setOpen(false)
                }}
                className={({ isActive }) =>
                  `${base} ${isActive ? active : inactive}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}

          {token ? (
            <li>
              <button onClick={handleLogout} className={`${base} ${inactive}`}>
                Logout
              </button>
            </li>
          ) : (
            <li>
              <NavLink
                to="/login"
                onClick={() => {
                  setOpen(false)
                }}
                className={({ isActive }) =>
                  `${base} ${isActive ? active : inactive}`
                }
              >
                Login
              </NavLink>
            </li>
          )}
        </ul>
      )}
    </header>
  )
}

export default HRNavBar
