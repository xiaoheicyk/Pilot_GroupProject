import { useNavigate, useParams } from "react-router"
import AuthForm from "../../components/AuthForm"
import type { AuthField } from "../../components/AuthForm"
import { useState } from "react"
import api from "../../api"
import axios from "axios"

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
  const navigate = useNavigate()
  const { token } = useParams()

  const [loading, setLoading] = useState(false)
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: SignupValues) => {
    setLoading(true)
    setServerMessage(null)
    setErrorMessage(null)

    try {
      const res = await api.post<{ message?: string }>("/auth/signup", {
        ...values,
        token,
      })
      setServerMessage(res.data.message ?? "Signup successful")
      setTimeout(() => {
        void navigate("/login")
      }, 500)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string } | undefined)?.message ??
          err.message
        setErrorMsg(msg)
      } else {
        setErrorMsg("Unknown signup error.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AuthForm<SignupValues>
        title="Create account"
        fields={fields}
        initialValues={{ username: "", email: "", password: "" }}
        onSubmit={handleSubmit}
        submitLabel={loading ? "Signing up..." : "Sign up"}
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
      {serverMessage && (
        <p className="mt-2 text-center text-sm text-emerald-600">
          {serverMessage}
        </p>
      )}
      {errorMessage && (
        <p className="mt-2 text-center text-sm text-red-600">{errorMessage}</p>
      )}
    </>
  )
}

export default Signup
