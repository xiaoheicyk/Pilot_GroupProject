import { Formik, Form, Field, ErrorMessage } from "formik"
import type { FormikHelpers } from "formik"

export type AuthField = {
  name: string
  label: string
  type?: string
  placeholder?: string
}

export type AuthFormProps<T> = {
  /** Form title (“Sign in”, “Create account”, …) */
  title: string
  /** Array of fields to render */
  fields: AuthField[]
  /** Initial values object */
  initialValues: T
  /** Called with values on submit */
  onSubmit: (values: T, helpers: FormikHelpers<T>) => void | Promise<void>
  /** Text for the submit button */
  submitLabel: string
  /** Optional footer JSX (e.g. link to other flow) */
  footer?: React.ReactNode
}

const AuthForm = <T extends Record<string, unknown>>({
  title,
  fields,
  initialValues,
  onSubmit,
  submitLabel,
  footer,
}: AuthFormProps<T>) => (
  <section className="flex flex-1 items-center justify-center p-6">
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {({ isSubmitting }) => (
        <Form className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-center text-3xl font-bold text-slate-800">
            {title}
          </h1>

          {fields.map(({ name, label, type = "text", placeholder }) => (
            <div key={name} className="space-y-1">
              <label
                htmlFor={name}
                className="block text-sm font-medium text-slate-600"
              >
                {label}
              </label>
              <Field
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                className="w-full rounded-md border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
              <ErrorMessage
                name={name}
                component="p"
                className="text-sm text-red-600"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitLabel}
          </button>

          {footer}
        </Form>
      )}
    </Formik>
  </section>
)

export default AuthForm
