import AuthForm from "../../components/AuthForm"
import type { AuthField } from "../../components/AuthForm"

type SignupValues = {
  username: string
  email: string
  password: string
}

const fields: AuthField[] = [
  { name: "username", label: "Username", placeholder: "pengtao" },
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
    placeholder: "Create a strong password",
  },
]

const Signup = () => {
  const handleSubmit = async (values: SignupValues) => {
    console.log("signup", values)
  }

  return (
    <AuthForm<SignupValues>
      title="Create account"
      fields={fields}
      initialValues={{ username: "", email: "", password: "" }}
      onSubmit={handleSubmit}
      submitLabel="Sign up"
      footer={
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Sign in
          </a>
        </p>
      }
    />
  )
}

export default Signup
