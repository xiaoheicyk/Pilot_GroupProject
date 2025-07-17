import { useState, useEffect, type ChangeEvent } from "react"
import { ShieldCheck, Upload, FileWarning } from "lucide-react"
import { useAppSelector } from "../../app/hooks"
import { selectLoginStatus, selectUser } from "../../features/auth/authSlice"
import { useNavigate } from "react-router"
import axios from "axios"
import api from "../../api"

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type DocKey = "OPT_RECEIPT" | "OPT_EAD" | "I_983" | "I_20"
type Status = "NOT_UPLOADED" | "PENDING" | "APPROVED" | "REJECTED"

type DocState = {
  file?: File // local, just-selected file (optimistic)
  url?: string // server file URL
  status: Status
  feedback?: string // future: HR comments (not in current schema)
}

type VisaWorkflow = {
  visaType: "OPT" | "H1B" | "L1" | "Other"
  docs: Record<DocKey, DocState>
}

/* ---------------------- backend response shapes ------------------- */
type ServerOptDoc = {
  url?: string
  status?: string // unsubmitted | pending | rejected | approval
}

type ServerOpt = {
  _id: string
  employee: string
  receipt?: ServerOptDoc
  ead?: ServerOptDoc
  i983?: ServerOptDoc
  i20?: ServerOptDoc
  createdAt?: string
  updatedAt?: string
}

/* Minimal employee profile shape just to detect visa type */
type ServerEmployeeLite = {
  workAuth?: { visa?: string }
}

/* ------------------------------------------------------------------ */
/* Endpoint paths (adjust!)                                           */
/* ------------------------------------------------------------------ */
const OPT_STATUS_URL = "/employee/opt" // GET -> getOptStatus
const OPT_UPLOAD_URL = "/employee/opt" // POST -> uploadOptDocument
const EMPLOYEE_PROFILE_URL = "/employee/profile"

/* ------------------------------------------------------------------ */
/* Backend type param map                                             */
/* ------------------------------------------------------------------ */
const backendType: Record<DocKey, "receipt" | "ead" | "i983" | "i20"> = {
  OPT_RECEIPT: "receipt",
  OPT_EAD: "ead",
  I_983: "i983",
  I_20: "i20",
}

/* ------------------------------------------------------------------ */
/* Status normalization                                               */
/* ------------------------------------------------------------------ */
const normStatus = (s?: string): Status => {
  switch ((s ?? "").toLowerCase()) {
    case "pending":
      return "PENDING"
    case "rejected":
      return "REJECTED"
    case "approval": // backend enum spelling
    case "approved": // just in case
      return "APPROVED"
    default:
      return "NOT_UPLOADED"
  }
}

/* ------------------------------------------------------------------ */
/* OPT -> VisaWorkflow normalization                                 */
/* ------------------------------------------------------------------ */
const emptyDocs: VisaWorkflow["docs"] = {
  OPT_RECEIPT: { status: "NOT_UPLOADED" },
  OPT_EAD: { status: "NOT_UPLOADED" },
  I_983: { status: "NOT_UPLOADED" },
  I_20: { status: "NOT_UPLOADED" },
}

function optToWorkflow(
  opt: ServerOpt | null | undefined,
  visaType: VisaWorkflow["visaType"],
): VisaWorkflow {
  if (!opt) {
    return { visaType, docs: { ...emptyDocs } }
  }
  const wf: VisaWorkflow = { visaType, docs: { ...emptyDocs } }

  if (opt.receipt) {
    wf.docs.OPT_RECEIPT = {
      status: normStatus(opt.receipt.status),
      url: opt.receipt.url,
    }
  }
  if (opt.ead) {
    wf.docs.OPT_EAD = {
      status: normStatus(opt.ead.status),
      url: opt.ead.url,
    }
  }
  if (opt.i983) {
    wf.docs.I_983 = {
      status: normStatus(opt.i983.status),
      url: opt.i983.url,
    }
  }
  if (opt.i20) {
    wf.docs.I_20 = {
      status: normStatus(opt.i20.status),
      url: opt.i20.url,
    }
  }

  return wf
}

/* ------------------------------------------------------------------ */
/* Helpers: sequential gating                                         */
/* ------------------------------------------------------------------ */
const canUploadNext = (docs: VisaWorkflow["docs"], key: DocKey) => {
  const order: DocKey[] = ["OPT_RECEIPT", "OPT_EAD", "I_983", "I_20"]
  const idx = order.indexOf(key)
  if (idx === 0) return true
  const prev = docs[order[idx - 1]]
  return prev.status === "APPROVED"
}

/* ------------------------------------------------------------------ */
/* API calls                                                          */
/* ------------------------------------------------------------------ */

/** Fetch minimal profile to detect whether user is OPT. */
async function fetchVisaType(token: string): Promise<VisaWorkflow["visaType"]> {
  try {
    api.defaults.headers.Authorization = `Bearer ${token}`
    const res = await api.get<ServerEmployeeLite>(EMPLOYEE_PROFILE_URL)
    const v = res.data.workAuth?.visa ?? ""
    return v.toUpperCase().includes("OPT") ? "OPT" : "Other"
  } catch {
    // if profile fetch fails, fall back (no block)
    return "Other"
  }
}

/** Fetch user's OPT record. Returns null if not yet created. */
async function fetchOptStatus(): Promise<ServerOpt | null> {
  const res = await api.get<ServerOpt | { message?: string }>(OPT_STATUS_URL)
  const data = res.data as any
  // When no OPT record, controller returns { message: 'No OPT uploaded yet' }
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    !("receipt" in data) &&
    !("ead" in data)
  ) {
    return null
  }
  return data as ServerOpt
}

/** Upload doc -> backend creates/updates OPT; returns updated OPT record. */
async function uploadOptDoc(key: DocKey, file: File): Promise<ServerOpt> {
  const form = new FormData()
  form.append("type", backendType[key]) // required by controller
  form.append("file", file)
  const res = await api.post<{ message: string; data: ServerOpt }>(
    OPT_UPLOAD_URL,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  )
  return res.data.data
}

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */
const VisaStatusPage = () => {
  const loginStatus = useAppSelector(selectLoginStatus)
  const user = useAppSelector(selectUser) // { id, ... }
  const navigate = useNavigate()

  const [visaType, setVisaType] = useState<VisaWorkflow["visaType"]>("Other")
  const [flow, setFlow] = useState<VisaWorkflow>(() => ({
    visaType: "Other",
    docs: { ...emptyDocs },
  }))
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<DocKey | null>(null)

  /* Route guard: must be logged in */
  useEffect(() => {
    if (!loginStatus) {
      void navigate("/login")
    }
  }, [loginStatus, navigate])

  /* Load profile visa + OPT status */
  useEffect(() => {
    if (!loginStatus || !user.id) return

    void (async () => {
      setLoading(true)
      setErrMsg(null)
      try {
        const [vt, opt] = await Promise.all([
          fetchVisaType(user.token),
          fetchOptStatus(),
        ])
        setVisaType(vt)
        setFlow(optToWorkflow(opt, vt))
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setErrMsg(
            (
              err.response?.data as
                | { message?: string; error?: string }
                | undefined
            )?.message ?? err.message,
          )
        } else {
          setErrMsg("Failed to load visa status.")
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [loginStatus, user.id])

  /* Optimistic local patch */
  const updateDocLocal = (key: DocKey, patch: Partial<DocState>) => {
    setFlow(f => ({
      ...f,
      docs: { ...f.docs, [key]: { ...f.docs[key], ...patch } },
    }))
  }

  /* Upload handler */
  const handleUpload = async (key: DocKey, file: File) => {
    updateDocLocal(key, { file, status: "PENDING" })
    setUploadingKey(key)
    try {
      const opt = await uploadOptDoc(key, file)
      setFlow(f => optToWorkflow(opt, f.visaType))
    } catch (err: unknown) {
      let msg = "Upload failed."
      if (axios.isAxiosError(err)) {
        msg =
          (
            err.response?.data as
              | { message?: string; error?: string }
              | undefined
          )?.message ?? err.message
      }
      updateDocLocal(key, { status: "REJECTED", feedback: msg })
    } finally {
      setUploadingKey(null)
    }
  }

  /* Gated non-OPT UI */
  if (!loading && visaType !== "OPT") {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="rounded bg-slate-50 p-4 text-slate-700">
          Your current work authorization does not require OPT tracking.
        </p>
      </main>
    )
  }

  /* Loading / error UI */
  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-slate-600">
          {errMsg ? errMsg : "Loading visa status…"}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-800">
        Visa Status Management
      </h1>

      <DocumentStep
        title="1. OPT Receipt"
        docKey="OPT_RECEIPT"
        doc={flow.docs.OPT_RECEIPT}
        uploadAllowed
        uploading={uploadingKey === "OPT_RECEIPT"}
        onUpload={file => void handleUpload("OPT_RECEIPT", file)}
        messages={{
          PENDING: "Waiting for HR to approve your OPT Receipt",
          APPROVED: "Please upload a copy of your OPT EAD",
          REJECTED: "HR feedback:",
        }}
      />

      <DocumentStep
        title="2. OPT EAD"
        docKey="OPT_EAD"
        doc={flow.docs.OPT_EAD}
        uploadAllowed={canUploadNext(flow.docs, "OPT_EAD")}
        uploading={uploadingKey === "OPT_EAD"}
        onUpload={file => void handleUpload("OPT_EAD", file)}
        messages={{
          PENDING: "Waiting for HR to approve your OPT EAD",
          APPROVED: "Please download and fill out the I-983 form",
          REJECTED: "HR feedback:",
        }}
      />

      <DocumentStep
        title="3. I-983 (Training Plan)"
        docKey="I_983"
        doc={flow.docs.I_983}
        uploadAllowed={canUploadNext(flow.docs, "I_983")}
        uploading={uploadingKey === "I_983"}
        onUpload={file => void handleUpload("I_983", file)}
        extraDownloads={
          <div className="flex gap-2 text-sm">
            <a
              href="/templates/I-983-empty.pdf"
              className="text-indigo-600 hover:underline"
            >
              Empty template
            </a>
            |
            <a
              href="/templates/I-983-sample.pdf"
              className="text-indigo-600 hover:underline"
            >
              Sample template
            </a>
          </div>
        }
        messages={{
          PENDING: "Waiting for HR to approve and sign your I-983",
          APPROVED:
            "Please send the signed I-983 and supporting docs to your school, then upload the new I-20",
          REJECTED: "HR feedback:",
        }}
      />

      <DocumentStep
        title="4. I-20 (STEM OPT)"
        docKey="I_20"
        doc={flow.docs.I_20}
        uploadAllowed={canUploadNext(flow.docs, "I_20")}
        uploading={uploadingKey === "I_20"}
        onUpload={file => void handleUpload("I_20", file)}
        messages={{
          PENDING: "Waiting for HR to approve your I-20",
          APPROVED: "All documents have been approved",
          REJECTED: "HR feedback:",
        }}
      />
    </main>
  )
}

export default VisaStatusPage

/* ------------------------------------------------------------------ */
/* DocumentStep                                                        */
/* ------------------------------------------------------------------ */
type StepProps = {
  title: string
  docKey: DocKey
  doc: DocState
  uploadAllowed?: boolean
  uploading?: boolean
  onUpload: (file: File) => void
  extraDownloads?: React.ReactNode
  messages: {
    PENDING: string
    APPROVED: string
    REJECTED: string
  }
}

const DocumentStep = ({
  title,
  doc,
  uploadAllowed = false,
  uploading = false,
  onUpload,
  extraDownloads,
  messages,
}: StepProps) => {
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.currentTarget.files?.[0]
    if (f) onUpload(f)
  }

  const statusStyle: Record<Status, string> = {
    NOT_UPLOADED: "bg-slate-100 text-slate-600",
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-red-100 text-red-800",
  }

  return (
    <section className="w-full rounded-lg bg-white p-6 shadow">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle[doc.status]}`}
        >
          {doc.status.replace("_", " ")}
        </span>
      </header>

      <div className="space-y-4">
        {doc.url && (
          <p className="text-sm">
            Current file:{" "}
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              View
            </a>
          </p>
        )}

        {doc.status === "PENDING" && (
          <Alert
            icon={<ShieldCheck size={16} />}
            className="bg-amber-50 text-amber-700"
          >
            {messages.PENDING}
          </Alert>
        )}

        {doc.status === "APPROVED" && (
          <Alert
            icon={<ShieldCheck size={16} />}
            className="bg-emerald-50 text-emerald-700"
          >
            {messages.APPROVED}
          </Alert>
        )}

        {doc.status === "REJECTED" && (
          <Alert
            icon={<FileWarning size={16} />}
            className="bg-red-50 text-red-700"
          >
            <p className="font-medium">{messages.REJECTED}</p>
            <p>{doc.feedback ?? "See HR remarks."}</p>
          </Alert>
        )}

        {extraDownloads}
      </div>

      {uploadAllowed && doc.status !== "APPROVED" && (
        <div className="mt-4 flex items-center gap-4">
          <label
            htmlFor={title}
            className={`inline-flex cursor-pointer items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white shadow ${
              uploading
                ? "bg-indigo-300 cursor-progress"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            <Upload size={16} />
            {uploading
              ? "Uploading..."
              : doc.status === "NOT_UPLOADED"
                ? "Upload"
                : "Replace"}
            <input
              id={title}
              type="file"
              onChange={handleFile}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {doc.file && !uploading && (
            <span className="text-sm">{doc.file.name}</span>
          )}
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Simple alert wrapper                                                */
/* ------------------------------------------------------------------ */
const Alert = ({
  children,
  icon,
  className,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  className: string
}) => (
  <div className={`flex items-start gap-2 rounded p-3 text-sm ${className}`}>
    {icon}
    <div>{children}</div>
  </div>
)
