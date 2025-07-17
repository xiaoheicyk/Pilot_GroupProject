import { useNavigate } from "react-router"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import AuthForm from "../../components/AuthForm"
import type { AuthField } from "../../components/AuthForm"
import {
  selectLoginStatus,
  selectRole,
  selectLoadingStatus,
} from "../../features/auth/authSlice"
import type { LoginPayload } from "../../features/auth/authThunk"
import { login } from "../../features/auth/authThunk"
import { useEffect } from "react"
import type { FormikHelpers } from "formik"

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
  const loading = useAppSelector(selectLoadingStatus)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleSubmit = async (
    values: LoginPayload,
    helpers: FormikHelpers<LoginPayload>,
  ) => {
    const result = await dispatch(login(values))
    if (login.rejected.match(result)) {
      helpers.setStatus("Invalid email or password")
    }
  }

  useEffect(() => {
    if (loginStatus) {
      if (role === "EMPLOYEE") {
        void navigate("/info")
      } else if (role === "HR") {
        void navigate("/hr")
      }
    }
  }, [loginStatus, role, navigate])

  return (
    <AuthForm<LoginPayload>
      title="Sign in"
      fields={fields}
      initialValues={{ email: "", password: "" }}
      onSubmit={handleSubmit}
      submitLabel={loading ? "Signing in..." : "Sign in"}
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
