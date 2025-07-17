import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import axios from "axios"
import api from "../../api" // <-- your configured axios instance
import { Field, FieldArray, ErrorMessage } from "formik"
import SectionCard from "../../components/SectionCard"
import { useAppSelector, useAppDispatch } from "../../app/hooks"
import {
  selectLoginStatus,
  selectOnBoardingStatus,
  selectUser,
  selectRole,
  login as loginAction,
} from "../../features/auth/authSlice"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type EmergencyContact = {
  firstName: string
  middleName: string
  lastName: string
  phone: string
  email: string
  relationship: string
}
type EmployeeFile = {
  name: string
  url: string
}
type EmployeeInfo = {
  firstName: string
  middleName: string
  lastName: string
  preferredName: string
  email: string
  ssn: string
  dob: string
  gender: string
  building: string
  street: string
  city: string
  state: string
  zip: string
  cellPhone: string
  workPhone: string
  visaTitle: string
  visaStart: string
  visaEnd: string
  emergency: EmergencyContact[]
  files: EmployeeFile[]
}

/* empty shell to keep controlled forms happy before load */
const EMPTY_INFO: EmployeeInfo = {
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  email: "",
  ssn: "",
  dob: "",
  gender: "n/a",
  building: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  cellPhone: "",
  workPhone: "",
  visaTitle: "",
  visaStart: "",
  visaEnd: "",
  emergency: [],
  files: [],
}

/* ------------------------------------------------------------------ */
/* API helpers (adjust endpoints as needed)                           */
/* ------------------------------------------------------------------ */
const employeeUrl = (id: string) => `/profile/${id}` // GET/PATCH
const onboardingSubmitUrl = "/employee/onboarding"

async function fetchEmployeeInfo(id: string): Promise<EmployeeInfo> {
  const res = await api.get<EmployeeInfo>(employeeUrl(id))
  return res.data
}

async function submitOnboarding(
  id: string,
  info: EmployeeInfo,
): Promise<{
  status: "pending" | "rejected" | "approved" | "unsubmitted"
  feedback?: string
}> {
  const res = await api.post(onboardingSubmitUrl, {
    id,
    ...info,
  })
  return res.data
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
const Info = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const loginStatus = useAppSelector(selectLoginStatus)
  const authUser = useAppSelector(selectUser) // full auth state
  const onBoardingStatus = useAppSelector(selectOnBoardingStatus)
  const role = useAppSelector(selectRole)

  const [info, setInfo] = useState<EmployeeInfo>(EMPTY_INFO)
  const [loading, setLoading] = useState(true)
  const [fetchErr, setFetchErr] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!loginStatus) {
      void navigate("/login")
    } else if (role === "HR") {
      void navigate("/hr")
    }
  }, [loginStatus, navigate, role])

  useEffect(() => {
    if (!loginStatus) return
    if (!authUser.id) return

    let cancelled = false

    const fetchInfo = async () => {
      setLoading(true)
      setFetchErr(null)
      try {
        const data = await fetchEmployeeInfo(authUser.id)
        if (!cancelled) {
          setInfo(data)
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setFetchErr(
            (err.response?.data as { message?: string } | undefined)?.message ??
              err.message,
          )
        } else {
          setFetchErr("Failed to load employee info.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchInfo()

    return () => {
      cancelled = true
    }
  }, [loginStatus, authUser.id])

  /* set HR rejection feedback if slice says rejected */
  useEffect(() => {
    if (loginStatus && onBoardingStatus === "rejected") {
      // Replace with real feedback from backend if provided in auth slice
      setFeedback("Your onboarding submission requires updates. See HR notes.")
    }
  }, [loginStatus, onBoardingStatus])

  /* convenience: editable only when unsubmitted */
  const editable = onBoardingStatus === "unsubmitted"

  const saveName = (v: any) => {
    setInfo({
      ...info,
      firstName: v.firstName,
      middleName: v.middleName,
      lastName: v.lastName,
      preferredName: v.preferredName,
      email: v.email,
      ssn: v.ssn,
      dob: v.dob,
      gender: v.gender,
    })
  }

  const saveAddress = (v: any) => {
    setInfo({
      ...info,
      address: {
        building: v.building,
        street: v.street,
        city: v.city,
        state: v.state,
        zip: v.zip,
      },
    })
  }

  const saveContact = (v: any) => {
    setInfo({
      ...info,
      contact: {
        cellPhone: v.cellPhone,
        workPhone: v.workPhone,
      },
    })
  }

  const saveEmployment = (v: any) => {
    setInfo({
      ...info,
      employment: {
        visaTitle: v.visaTitle,
        visaStart: v.visaStart,
        visaEnd: v.visaEnd,
      },
    })
  }

  const saveEmergency = (v: any) => {
    setInfo({
      ...info,
      emergency: v.emergency,
    })
  }

  const saveDocs = (v: any) => {
    setInfo({
      ...info,
      docs: v.docs,
    })
  }

  /* submit entire onboarding package */
  const handleSubmitOnboarding = async () => {
    const res = await submitOnboarding(authUser.id, info)
    dispatch(
      loginAction({
        id: authUser.id,
        token: authUser.token,
        username: authUser.username,
        email: authUser.email,
        role: authUser.role,
        onBoardingStatus: res.status,
      }),
    )
  }

  /* labeled input helper */
  const L = ({
    name,
    label,
    type = "text",
  }: {
    name: string
    label: string
    type?: string
  }) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-slate-600">
        {label}
      </label>
      <Field
        id={name}
        name={name}
        type={type}
        className="rounded border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
      />
      <ErrorMessage
        name={name}
        component="p"
        className="text-sm text-red-600"
      />
    </div>
  )

  /* loading / error states ------------------------------------------------ */
  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6">
        <p className="text-sm text-slate-600">Loading your information…</p>
      </main>
    )
  }
  if (fetchErr) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6">
        <p className="text-sm text-red-600">{fetchErr}</p>
      </main>
    )
  }

  /* shorthand values for SectionCard initialValues ----------------------- */
  const nameVals = {
    firstName: info.firstName,
    middleName: info.middleName,
    lastName: info.lastName,
    preferredName: info.preferredName,
    email: info.email,
    ssn: info.ssn,
    dob: info.dob,
    gender: info.gender,
  }
  const addrVals = {
    building: info.building,
    street: info.street,
    city: info.city,
    state: info.state,
    zip: info.zip,
  }
  const contactVals = {
    cellPhone: info.cellPhone,
    workPhone: info.workPhone,
  }
  const employmentVals = {
    visaTitle: info.visaTitle,
    visaStart: info.visaStart,
    visaEnd: info.visaEnd,
  }
  const emergencyVals = { emergency: info.emergency }
  const filesVals = { files: info.files }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6">
      {/* ===== Onboarding banner ===== */}
      {(onBoardingStatus === "pending" || onBoardingStatus === "rejected") && (
        <SectionCard
          title="Onboarding Status"
          editable={false}
          submitted
          initialValues={{}}
          onSubmit={() => undefined}
          display={() => (
            <p
              className={
                onBoardingStatus === "pending"
                  ? "text-sm text-amber-700"
                  : "text-sm text-red-700"
              }
            >
              {onBoardingStatus === "pending" &&
                "Your information is under reviewing."}
              {onBoardingStatus === "rejected" && feedback}
            </p>
          )}
        >
          <></>
        </SectionCard>
      )}

      {/* Submit full onboarding (visible only when unsubmitted) ------------ */}
      {onBoardingStatus === "unsubmitted" && (
        <div className="rounded-lg bg-white p-6 shadow">
          <button
            type="button"
            onClick={() => {
              void handleSubmitOnboarding()
              return
            }}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Submit Onboarding Info
          </button>
        </div>
      )}

      {/* ===== Name & Identity ===== */}
      <SectionCard
        title="Name & Identity"
        editable={editable}
        submitted={onBoardingStatus !== "unsubmitted"}
        initialValues={nameVals}
        onSubmit={saveName}
        display={v => (
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-700">
            <li>
              <span className="font-medium">Legal name:</span> {v.firstName}{" "}
              {v.middleName} {v.lastName}
            </li>
            <li>
              <span className="font-medium">Preferred name:</span>{" "}
              {v.preferredName || "—"}
            </li>
            <li>
              <span className="font-medium">Email:</span> {v.email}
            </li>
            <li>
              <span className="font-medium">DOB:</span> {v.dob}
            </li>
            <li>
              <span className="font-medium">SSN:</span> •••-••-••••
            </li>
            <li>
              <span className="font-medium">Gender:</span> {v.gender}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="firstName" label="First name" />
          <L name="middleName" label="Middle name" />
          <L name="lastName" label="Last name" />
          <L name="preferredName" label="Preferred name" />
          <L name="email" label="Email" type="email" />
          <L name="dob" label="Date of birth" type="date" />
          <L name="ssn" label="SSN" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Gender</label>
            <Field
              as="select"
              name="gender"
              className="rounded border border-slate-300 p-2"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="n/a">Prefer not to say</option>
            </Field>
            <ErrorMessage
              name="gender"
              component="p"
              className="text-sm text-red-600"
            />
          </div>
        </div>
      </SectionCard>

      {/* ===== Address ===== */}
      <SectionCard
        title="Address"
        editable={editable}
        submitted={onBoardingStatus !== "unsubmitted"}
        initialValues={addrVals}
        onSubmit={saveAddress}
        display={v => (
          <p className="text-slate-700">
            {v.building} {v.street}, {v.city}, {v.state} {v.zip}
          </p>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="building" label="Building/Apt #" />
          <L name="street" label="Street" />
          <L name="city" label="City" />
          <L name="state" label="State" />
          <L name="zip" label="ZIP" />
        </div>
      </SectionCard>

      {/* ===== Contact Info ===== */}
      <SectionCard
        title="Contact Info"
        editable={editable}
        submitted={onBoardingStatus !== "unsubmitted"}
        initialValues={contactVals}
        onSubmit={saveContact}
        display={v => (
          <ul className="text-slate-700">
            <li>
              <span className="font-medium">Cell:&nbsp;</span>
              {v.cellPhone}
            </li>
            <li>
              <span className="font-medium">Work:&nbsp;</span>
              {v.workPhone || "—"}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="cellPhone" label="Cell phone" />
          <L name="workPhone" label="Work phone" />
        </div>
      </SectionCard>

      {/* ===== Employment ===== */}
      <SectionCard
        title="Employment"
        editable={editable}
        submitted={onBoardingStatus !== "unsubmitted"}
        initialValues={employmentVals}
        onSubmit={saveEmployment}
        display={v => (
          <ul className="text-slate-700">
            <li>
              <span className="font-medium">Visa:&nbsp;</span>
              {v.visaTitle}
            </li>
            <li>
              <span className="font-medium">Start:&nbsp;</span>
              {v.visaStart}
            </li>
            <li>
              <span className="font-medium">End:&nbsp;</span>
              {v.visaEnd}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="visaTitle" label="Visa title" />
          <L name="visaStart" label="Start date" type="date" />
          <L name="visaEnd" label="End date" type="date" />
        </div>
      </SectionCard>

      {/* ===== Emergency Contact(s) ===== */}
      <SectionCard
        title="Emergency Contact(s)"
        editable={editable}
        submitted={onBoardingStatus !== "unsubmitted"}
        initialValues={emergencyVals}
        onSubmit={saveEmergency}
        display={v => (
          <ul className="space-y-2 text-slate-700">
            {v.emergency.map((c: EmergencyContact, idx: number) => (
              <li key={idx}>
                <span className="font-medium">
                  {c.firstName} {c.lastName}:
                </span>{" "}
                {c.phone} · {c.email} · {c.relationship}
              </li>
            ))}
          </ul>
        )}
      >
        <FieldArray name="emergency">
          {arrayHelpers => {
            const { form } = arrayHelpers
            const contacts: EmergencyContact[] = form.values.emergency
            return (
              <div className="space-y-6">
                {contacts.map((_, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-4">
                    <L name={`emergency.${idx}.firstName`} label="First name" />
                    <L name={`emergency.${idx}.middleName`} label="Middle" />
                    <L name={`emergency.${idx}.lastName`} label="Last name" />
                    <L name={`emergency.${idx}.phone`} label="Phone" />
                    <L name={`emergency.${idx}.email`} label="Email" />
                    <L
                      name={`emergency.${idx}.relationship`}
                      label="Relationship"
                    />
                    <button
                      type="button"
                      onClick={() => arrayHelpers.remove(idx)}
                      className="col-span-3 rounded border border-red-300 p-2 text-sm text-red-600"
                    >
                      Remove contact
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    arrayHelpers.push({
                      firstName: "",
                      middleName: "",
                      lastName: "",
                      phone: "",
                      email: "",
                      relationship: "",
                    })
                  }}
                  className="rounded bg-indigo-50 px-4 py-1 text-sm text-indigo-700"
                >
                  + Add another contact
                </button>
              </div>
            )
          }}
        </FieldArray>
      </SectionCard>

      {/* ===== Documents ===== */}
      <SectionCard
        title="Documents"
        editable={editable}
        submitted={onBoardingStatus !== "unsubmitted"}
        initialValues={filesVals}
        onSubmit={saveDocs}
        display={v => (
          <ul className="space-y-1 text-slate-700">
            {v.files.map((f: EmployeeFile, idx: number) => (
              <li key={idx}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      >
        <FieldArray name="files">
          {arrayHelpers => {
            const { form } = arrayHelpers
            const files: EmployeeFile[] = form.values.files
            return (
              <div className="space-y-4">
                <input
                  type="file"
                  onChange={e => {
                    const file = e.currentTarget.files?.[0]
                    if (file) {
                      /* TODO: upload to storage, get URL from server */
                      arrayHelpers.push({
                        name: file.name,
                        url: URL.createObjectURL(file),
                      })
                    }
                  }}
                />
                <ul className="space-y-1">
                  {files.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={() => arrayHelpers.remove(idx)}
                        className="text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          }}
        </FieldArray>
      </SectionCard>
    </main>
  )
}

export default Info
