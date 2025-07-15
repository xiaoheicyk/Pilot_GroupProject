import AuthForm from "../../components/AuthForm"
import type { AuthField } from "../../components/AuthForm"

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
  const handleSubmit = async (values: LoginValues) => {
    console.log("login", values)
  }

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
