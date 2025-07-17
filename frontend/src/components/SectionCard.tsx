import { useState } from "react"
import { Formik } from "formik"
import type { FormikConfig } from "formik"
import type { ReactNode } from "react"

/** Props common to every personal-info section */
export type SectionCardProps<T> = {
  title: string
  /** Regular (read-only) view */
  display: (values: T) => ReactNode
  /** Whether the section is editable */
  editable: boolean
  /** Whether the section is submitted */
  submitted?: boolean
  /** Editable view (Formik’s <Form> body) */
  children: ReactNode
} & Omit<FormikConfig<T>, "children">

/**
 * Wraps a card with “Edit / Save / Cancel” behaviour.
 * Keeps local draft state; on cancel offers a confirm dialog.
 */
export default function SectionCard<T extends Record<string, unknown>>({
  title,
  display,
  editable,
  submitted,
  children,
  ...formikCfg
}: SectionCardProps<T>) {
  const [editing, setEditing] = useState(!submitted)

  return (
    <div className="w-full rounded-lg bg-white p-6 shadow">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {editable && !editing && (
          <button
            className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
            onClick={() => {
              setEditing(true)
            }}
          >
            Edit
          </button>
        )}
      </header>

      <Formik<T> {...formikCfg}>
        {({ handleSubmit, resetForm, dirty }) =>
          editing ? (
            <form
              onSubmit={v => {
                handleSubmit(v)
                setEditing(false)
              }}
              className="space-y-4"
              autoComplete="off"
            >
              {children}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-1 font-medium text-white hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-300 px-4 py-1 font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    if (!dirty || confirm("Discard all changes?")) {
                      resetForm()
                      setEditing(false)
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>{display(formikCfg.initialValues)}</div>
          )
        }
      </Formik>
    </div>
  )
}
