import { useNavigate } from "react-router"
import { useAppSelector } from "../../app/hooks"
import AuthForm from "../../components/AuthForm"
import type { AuthField } from "../../components/AuthForm"
import { selectLoginStatus, selectRole } from "../../features/auth/authSlice"
import { useEffect } from "react"

type LoginValues = {
  email: string
  password: string
}

const fields: AuthField[] = [
  {
    name: "email",
    label: "Email address",
    type: "email",
    placeholder: "you@example.com",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "••••••••",
  },
]

const Login = () => {
  const loginStatus = useAppSelector(selectLoginStatus)
  const role = useAppSelector(selectRole)
  const navigate = useNavigate()

  const handleSubmit = async (values: LoginValues) => {
    console.log("login", values)
  }

  useEffect(() => {
    if (loginStatus) {
      if (role === "EMPLOYEE") {
        void navigate("/info")
      } else if (role === "HR") {
        void navigate("/hr")
      }
    }
  })

  return (
    <AuthForm<LoginValues>
      title="Sign in"
      fields={fields}
      initialValues={{ email: "", password: "" }}
      onSubmit={handleSubmit}
      submitLabel="Sign in"
      footer={
        <p className="text-center text-sm text-slate-500">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="font-medium text-indigo-600 hover:underline"
          >
            Create one
          </a>
        </p>
      }
    />
  )
}

export default Login
