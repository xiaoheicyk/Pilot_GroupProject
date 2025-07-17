import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import axios from "axios"
import api from "../../api" // your configured axios instance
import { Field, FieldArray, ErrorMessage } from "formik"
import SectionCard from "../../components/SectionCard"
import { useAppSelector } from "../../app/hooks"
import {
  selectLoginStatus,
  selectUser,
  selectRole,
} from "../../features/auth/authSlice"

/* ------------------------------------------------------------------ */
/* Types aligned to backend schema                                     */
/* ------------------------------------------------------------------ */
type EmergencyContact = {
  firstName: string
  middleName: string
  lastName: string
  phone: string
  email: string
  relation: string
}

type Address = {
  street1: string
  street2: string
  city: string
  state: string
  zip: string
}

type WorkAuth = {
  visa: string
  proof: string // file URL / path
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

type DriverLicense = {
  number: string
  exp: string // YYYY-MM-DD
  copy: string // file URL / path
}

type Reference = {
  firstName: string
  middleName: string
  lastName: string
  phone: string
  email: string
  relation: string
}

export type EmployeeInfo = {
  firstName: string
  lastName: string
  middleName: string
  picture: string
  address: Address
  cellPhone: string
  workPhone: string
  email: string
  ssn: string
  dob: string // YYYY-MM-DD
  gender: "male" | "female" | null
  citizen: boolean
  workAuth: WorkAuth
  dl: DriverLicense
  reference: Reference
  emergencyContacts: EmergencyContact[]
  onBoardingStatus: "pending" | "rejected" | "approved"
}

/* local synthetic status so UI can allow entry before submit */
type LocalOnboarding = EmployeeInfo["onBoardingStatus"] | "unsubmitted"

/* ------------------------------------------------------------------ */
/* Empty shell (for new users)                                        */
/* ------------------------------------------------------------------ */
const EMPTY_INFO: EmployeeInfo = {
  firstName: "",
  lastName: "",
  middleName: "",
  picture: "",
  address: { street1: "", street2: "", city: "", state: "", zip: "" },
  cellPhone: "",
  workPhone: "",
  email: "",
  ssn: "",
  dob: "",
  gender: null,
  citizen: false,
  workAuth: { visa: "", proof: "", startDate: "", endDate: "" },
  dl: { number: "", exp: "", copy: "" },
  reference: {
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    relation: "",
  },
  emergencyContacts: [],
  onBoardingStatus: "pending", // won't be used for new -> we track localStatus
}

/* ------------------------------------------------------------------ */
/* Server shape                                                        */
/* ------------------------------------------------------------------ */
type ServerEmployee = {
  _id: string
  userId: string
  firstName?: string
  lastName?: string
  middleName?: string
  picture?: string
  address?: Partial<Address>
  cellPhone?: string
  workPhone?: string
  car?: { make?: string; model?: string; color?: string }
  email?: string
  ssn?: string
  dob?: string // ISO
  gender?: "male" | "female" | null
  citizen?: boolean
  workAuth?: Partial<WorkAuth>
  dl?: Partial<DriverLicense>
  reference?: Partial<Reference>
  emergencyContacts?: Partial<EmergencyContact>[]
  house?: unknown
  onBoardingStatus?: "pending" | "rejected" | "approved"
}

/* ------------------------------------------------------------------ */
/* API endpoints                                                       */
/* ------------------------------------------------------------------ */
// IMPORTANT: backend controller name suggests GET /employee/:userId
// Adjust as needed in your Express router.
const employeeUrl = "/employee/profile"
const onboardingSubmitUrl = "/employee/onboarding"

/* ------------------------------------------------------------------ */
/* Normalizers                                                         */
/* ------------------------------------------------------------------ */
const isoToYmd = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
}

function serverToClient(e: ServerEmployee): EmployeeInfo {
  return {
    firstName: e.firstName ?? "",
    lastName: e.lastName ?? "",
    middleName: e.middleName ?? "",
    picture: e.picture ?? "",
    address: {
      street1: e.address?.street1 ?? "",
      street2: e.address?.street2 ?? "",
      city: e.address?.city ?? "",
      state: e.address?.state ?? "",
      zip: e.address?.zip ?? "",
    },
    cellPhone: e.cellPhone ?? "",
    workPhone: e.workPhone ?? "",
    email: e.email ?? "",
    ssn: e.ssn ?? "",
    dob: isoToYmd(e.dob),
    gender: e.gender ?? null,
    citizen: e.citizen ?? false,
    workAuth: {
      visa: e.workAuth?.visa ?? "",
      proof: e.workAuth?.proof ?? "",
      startDate: isoToYmd(e.workAuth?.startDate),
      endDate: isoToYmd(e.workAuth?.endDate),
    },
    dl: {
      number: e.dl?.number ?? "",
      exp: isoToYmd(e.dl?.exp),
      copy: e.dl?.copy ?? "",
    },
    reference: {
      firstName: e.reference?.firstName ?? "",
      middleName: e.reference?.middleName ?? "",
      lastName: e.reference?.lastName ?? "",
      phone: e.reference?.phone ?? "",
      email: e.reference?.email ?? "",
      relation: e.reference?.relation ?? "",
    },
    emergencyContacts: (e.emergencyContacts ?? []).map(c => ({
      firstName: c.firstName ?? "",
      middleName: c.middleName ?? "",
      lastName: c.lastName ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      relation: c.relation ?? "",
    })),
    onBoardingStatus: e.onBoardingStatus ?? "pending",
  }
}

/* Convert client form data to server payload for POST /employee/onboarding */
function clientToServer(info: EmployeeInfo): Partial<ServerEmployee> {
  return {
    firstName: info.firstName,
    lastName: info.lastName,
    middleName: info.middleName,
    picture: info.picture,
    address: { ...info.address },
    cellPhone: info.cellPhone,
    workPhone: info.workPhone,
    email: info.email,
    ssn: info.ssn,
    dob: info.dob ? new Date(info.dob).toISOString() : undefined,
    gender: info.gender,
    citizen: info.citizen,
    workAuth: {
      visa: info.workAuth.visa,
      proof: info.workAuth.proof,
      startDate: info.workAuth.startDate
        ? new Date(info.workAuth.startDate).toISOString()
        : undefined,
      endDate: info.workAuth.endDate
        ? new Date(info.workAuth.endDate).toISOString()
        : undefined,
    },
    dl: {
      number: info.dl.number,
      exp: info.dl.exp ? new Date(info.dl.exp).toISOString() : undefined,
      copy: info.dl.copy,
    },
    reference: { ...info.reference },
    emergencyContacts: info.emergencyContacts.map(c => ({ ...c })),
    // onBoardingStatus not sent; server sets "pending"
  }
}

/* ------------------------------------------------------------------ */
/* API calls                                                           */
/* ------------------------------------------------------------------ */
/* submitOnboarding: server uses req.user.id; no need to send userId */
async function submitOnboarding(
  info: EmployeeInfo,
  token: string,
): Promise<void> {
  api.defaults.headers.Authorization = `Bearer ${token}`
  await api.post(onboardingSubmitUrl, clientToServer(info))
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
const Info = () => {
  const navigate = useNavigate()

  const loginStatus = useAppSelector(selectLoginStatus)
  const authUser = useAppSelector(selectUser) // full auth state (id, token, email...)
  const role = useAppSelector(selectRole)

  const [info, setInfo] = useState<EmployeeInfo>(EMPTY_INFO)
  const [loading, setLoading] = useState(true)
  const [fetchErr, setFetchErr] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState<LocalOnboarding>("unsubmitted")
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)

  /* Gate by auth & role */
  useEffect(() => {
    if (!loginStatus) {
      void navigate("/login")
    } else if (role === "HR") {
      void navigate("/hr")
    }
  }, [loginStatus, navigate, role])

  /* Load profile (if exists) */
  useEffect(() => {
    if (!loginStatus || !authUser.id) return

    void (async () => {
      setLoading(true)
      setFetchErr(null)
      try {
        api.defaults.headers.Authorization = `Bearer ${authUser.token}`
        const res = await api.get<ServerEmployee>(employeeUrl)
        if (res.status === 200) {
          const data = serverToClient(res.data)
          setInfo(data)
          setLocalStatus(data.onBoardingStatus)
        } else if (res.status === 404) {
          setInfo(EMPTY_INFO)
          setLocalStatus("unsubmitted")
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // No profile yet => treat as unsubmitted
          setInfo(EMPTY_INFO)
          setLocalStatus("unsubmitted")
        } else {
          const msg = extractErrMsg(err, "Failed to load employee info.")
          setFetchErr(msg)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [loginStatus, authUser.id, authUser.token])

  /* HR rejection message */
  useEffect(() => {
    if (localStatus === "rejected") {
      // backend does not return feedback yet; placeholder
      setFeedback("Your onboarding submission requires updates. See HR notes.")
    } else {
      setFeedback(null)
    }
  }, [localStatus])

  /* Section "Save" handlers: update local form data only */
  const saveName = (v: any) => {
    setInfo(i => ({
      ...i,
      firstName: v.firstName,
      middleName: v.middleName,
      lastName: v.lastName,
      email: v.email,
      ssn: v.ssn,
      dob: v.dob,
      gender: v.gender,
    }))
  }

  const saveAddress = (v: any) => {
    setInfo(i => ({
      ...i,
      address: {
        street1: v.street1,
        street2: v.street2,
        city: v.city,
        state: v.state,
        zip: v.zip,
      },
    }))
  }

  const saveContact = (v: any) => {
    setInfo(i => ({
      ...i,
      cellPhone: v.cellPhone,
      workPhone: v.workPhone,
    }))
  }

  const saveEmployment = (v: any) => {
    setInfo(i => ({
      ...i,
      workAuth: {
        ...i.workAuth,
        visa: v.visa,
        startDate: v.startDate,
        endDate: v.endDate,
      },
    }))
  }

  const saveEmergency = (v: any) => {
    setInfo(i => ({
      ...i,
      emergencyContacts: v.emergencyContacts,
    }))
  }

  const saveDocs = (v: any) => {
    setInfo(i => ({
      ...i,
      workAuth: { ...i.workAuth, proof: v.proof },
      dl: { ...i.dl, copy: v.dlCopy },
    }))
  }

  /* Final onboarding submit */
  const handleSubmitOnboarding = async () => {
    setSubmitting(true)
    setSubmitErr(null)
    setSubmitMsg(null)
    try {
      console.log(info)
      await submitOnboarding(info, authUser.token)
      setLocalStatus("pending")
      setSubmitMsg("Onboarding submitted.")
    } catch (err: unknown) {
      const msg = extractErrMsg(err, "Submit failed.")
      setSubmitErr(msg)
    } finally {
      setSubmitting(false)
    }
  }

  /* Field helper */
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

  /* Loading / error states */
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

  /* Initial values per section */
  const nameVals = {
    firstName: info.firstName,
    middleName: info.middleName,
    lastName: info.lastName,
    email: info.email,
    ssn: info.ssn,
    dob: info.dob,
    gender: info.gender ?? "n/a",
  }
  const addrVals = { ...info.address }
  const contactVals = {
    cellPhone: info.cellPhone,
    workPhone: info.workPhone,
  }
  const employmentVals = {
    visa: info.workAuth.visa,
    startDate: info.workAuth.startDate,
    endDate: info.workAuth.endDate,
  }
  const emergencyVals = { emergencyContacts: info.emergencyContacts }
  const docsVals = {
    proof: info.workAuth.proof,
    dlCopy: info.dl.copy,
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6">
      {/* ----- Onboarding banner ----- */}
      {(localStatus === "pending" || localStatus === "rejected") && (
        <SectionCard
          title="Onboarding Status"
          editable={false}
          submitted
          initialValues={{}}
          onSubmit={() => undefined}
          display={() => (
            <p
              className={
                localStatus === "pending"
                  ? "text-sm text-amber-700"
                  : "text-sm text-red-700"
              }
            >
              {localStatus === "pending" &&
                "Your information is under reviewing."}
              {localStatus === "rejected" && feedback}
            </p>
          )}
        >
          <></>
        </SectionCard>
      )}

      {/* ----- Submit all (only when unsubmitted) ----- */}
      {(localStatus === "unsubmitted" || localStatus === "rejected") && (
        <div className="rounded-lg bg-white p-6 shadow">
          <button
            type="button"
            onClick={() => {
              void handleSubmitOnboarding()
            }}
            disabled={submitting}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Onboarding Info"}
          </button>
          {submitMsg && (
            <p className="mt-2 text-sm text-emerald-600">{submitMsg}</p>
          )}
          {submitErr && (
            <p className="mt-2 text-sm text-red-600">{submitErr}</p>
          )}
        </div>
      )}

      {/* ----- Name & Identity ----- */}
      <SectionCard
        title="Name & Identity"
        editable={true}
        submitted={localStatus !== "unsubmitted"}
        initialValues={nameVals}
        onSubmit={saveName}
        display={v => (
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-700">
            <li>
              <span className="font-medium">Legal name:</span> {v.firstName}{" "}
              {v.middleName} {v.lastName}
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

      {/* ----- Address ----- */}
      <SectionCard
        title="Address"
        editable={true}
        submitted={localStatus !== "unsubmitted"}
        initialValues={addrVals}
        onSubmit={saveAddress}
        display={v => (
          <p className="text-slate-700">
            {v.street1} {v.street2 && `${v.street2},`} {v.city}, {v.state}{" "}
            {v.zip}
          </p>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="street1" label="Street 1" />
          <L name="street2" label="Street 2" />
          <L name="city" label="City" />
          <L name="state" label="State" />
          <L name="zip" label="ZIP" />
        </div>
      </SectionCard>

      {/* ----- Contact Info ----- */}
      <SectionCard
        title="Contact Info"
        editable={true}
        submitted={localStatus !== "unsubmitted"}
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

      {/* ----- Employment / Work Authorization ----- */}
      <SectionCard
        title="Work Authorization"
        editable={true}
        submitted={localStatus !== "unsubmitted"}
        initialValues={employmentVals}
        onSubmit={saveEmployment}
        display={v => (
          <ul className="text-slate-700">
            <li>
              <span className="font-medium">Visa:</span> {v.visa}
            </li>
            <li>
              <span className="font-medium">Start:</span> {v.startDate}
            </li>
            <li>
              <span className="font-medium">End:</span> {v.endDate}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="visa" label="Visa type" />
          <L name="startDate" label="Start date" type="date" />
          <L name="endDate" label="End date" type="date" />
        </div>
      </SectionCard>

      {/* ----- Emergency Contacts ----- */}
      <SectionCard
        title="Emergency Contact(s)"
        editable={true}
        submitted={localStatus !== "unsubmitted"}
        initialValues={emergencyVals}
        onSubmit={saveEmergency}
        display={v => (
          <ul className="space-y-2 text-slate-700">
            {v.emergencyContacts.map((c: EmergencyContact, idx: number) => (
              <li key={idx}>
                <span className="font-medium">
                  {c.firstName} {c.lastName}:
                </span>{" "}
                {c.phone} · {c.email} · {c.relation}
              </li>
            ))}
          </ul>
        )}
      >
        <FieldArray name="emergencyContacts">
          {arrayHelpers => {
            const { form } = arrayHelpers
            const contacts: EmergencyContact[] = form.values.emergencyContacts
            return (
              <div className="space-y-6">
                {contacts.map((_, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-4">
                    <L
                      name={`emergencyContacts.${idx}.firstName`}
                      label="First name"
                    />
                    <L
                      name={`emergencyContacts.${idx}.middleName`}
                      label="Middle"
                    />
                    <L
                      name={`emergencyContacts.${idx}.lastName`}
                      label="Last name"
                    />
                    <L name={`emergencyContacts.${idx}.phone`} label="Phone" />
                    <L name={`emergencyContacts.${idx}.email`} label="Email" />
                    <L
                      name={`emergencyContacts.${idx}.relation`}
                      label="Relation"
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
                      relation: "",
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

      {/* ----- Documents (Work Auth proof + Driver License copy) ----- */}
      <SectionCard
        title="Documents"
        editable={true}
        submitted={localStatus !== "unsubmitted"}
        initialValues={docsVals}
        onSubmit={saveDocs}
        display={v => (
          <ul className="space-y-1 text-slate-700">
            <li>
              Work Auth Proof:&nbsp;
              {v.proof ? (
                <a
                  href={v.proof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View
                </a>
              ) : (
                "—"
              )}
            </li>
            <li>
              Driver License Copy:&nbsp;
              {v.dlCopy ? (
                <a
                  href={v.dlCopy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View
                </a>
              ) : (
                "—"
              )}
            </li>
          </ul>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">
              Work Auth Proof
            </label>
            <input
              type="file"
              onChange={e => {
                const file = e.currentTarget.files?.[0]
                if (file) {
                  // TODO: upload to storage & replace with server URL
                  setInfo(i => ({
                    ...i,
                    workAuth: {
                      ...i.workAuth,
                      proof: URL.createObjectURL(file),
                    },
                  }))
                }
              }}
              className="mt-1 block w-full text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">
              Driver License Copy
            </label>
            <input
              type="file"
              onChange={e => {
                const file = e.currentTarget.files?.[0]
                if (file) {
                  setInfo(i => ({
                    ...i,
                    dl: { ...i.dl, copy: URL.createObjectURL(file) },
                  }))
                }
              }}
              className="mt-1 block w-full text-sm"
            />
          </div>
        </div>
      </SectionCard>
    </main>
  )
}

export default Info

/* ------------------------------------------------------------------ */
/* Error message helper                                                */
/* ------------------------------------------------------------------ */
function extractErrMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; error?: string }
      | undefined
    return data?.message ?? data?.error ?? err.message ?? fallback
  }
  return fallback
}
