import { useState } from "react"
import { Link, NavLink } from "react-router"
import { Menu, X } from "lucide-react"
import { useAppSelector, useAppDispatch } from "../app/hooks"
import { logout, selectRole, selectToken } from "../features/auth/authSlice"

type NavItem = {
  to: string
  label: string
}

/* ------------ 1. Maps role ➜ set of links ------------- */
const EMPLOYEE_LINKS: NavItem[] = [
  { to: "/info", label: "Personal Info" },
  { to: "/visa", label: "Visa Status" },
  { to: "/housing", label: "Housing" },
]

const HR_LINKS: NavItem[] = [
  { to: "/hr", label: "Home" },
  { to: "/hr/employee-profiles", label: "Employee Profiles" },
  { to: "/hr/visa-management", label: "Visa Management" },
  { to: "/hr/hiring", label: "Hiring" },
  { to: "/hr/housing", label: "Housing Mgmt" },
]

/* ------------ 2. Component ------------- */
const NavBar = () => {
  const [open, setOpen] = useState(false)

  /* auth slice shape: { user: { role: "EMPLOYEE" | "HR" }, token: string | null } */
  const token = useAppSelector(selectToken)
  const dispatch = useAppDispatch()

  const role = useAppSelector(selectRole)

  /** links the current user should see */
  const links: NavItem[] =
    role === "Employee" ? EMPLOYEE_LINKS : role === "HR" ? HR_LINKS : []

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
        <Link to="/" className="text-xl font-bold text-indigo-700">
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
          {links.map(({ to, label }) => (
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
          {links.map(({ to, label }) => (
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

export default NavBar
