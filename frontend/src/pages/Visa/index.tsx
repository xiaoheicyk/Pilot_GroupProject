import { useState, useEffect, type ChangeEvent } from "react"
import { ShieldCheck, Upload, FileWarning } from "lucide-react"
import { useAppSelector } from "../../app/hooks"
import {
  selectLoginStatus,
  selectOnBoardingStatus,
  selectUser, // available if your backend needs a userId in the URL
} from "../../features/auth/authSlice"
import { useNavigate } from "react-router"
import axios from "axios"
import api from "../../api" // your pre-configured axios instance

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type DocKey = "OPT_RECEIPT" | "OPT_EAD" | "I_983" | "I_20"
type Status = "NOT_UPLOADED" | "PENDING" | "APPROVED" | "REJECTED"

type DocState = {
  file?: File // file just uploaded locally (preview only; not from server)
  url?: string // download link when approved by HR
  status: Status
  feedback?: string // HR rejection message
}

type VisaWorkflow = {
  visaType: "OPT" | "H1B" | "L1" | "Other"
  docs: Record<DocKey, DocState>
}

/* ---------------------- server response types --------------------- */
/* Adjust to match your actual backend payload */
type ServerDoc = {
  status: string
  url?: string
  feedback?: string
}
type ServerWorkflow = {
  visaType: string
  docs: Partial<Record<string, ServerDoc>> // server keys (slugs) mapped below
}

/* ------------------------------------------------------------------ */
/* Mapping between API slugs and our DocKey enum                      */
/* ------------------------------------------------------------------ */
const docSlug: Record<DocKey, string> = {
  OPT_RECEIPT: "opt-receipt",
  OPT_EAD: "opt-ead",
  I_983: "i-983",
  I_20: "i-20",
}
const slugToKey: Record<string, DocKey> = {
  "opt-receipt": "OPT_RECEIPT",
  "opt-ead": "OPT_EAD",
  "i-983": "I_983",
  "i-20": "I_20",
}

/* Normalize server status into our Status union */
const toStatus = (s?: string): Status => {
  switch ((s ?? "").toUpperCase()) {
    case "PENDING":
      return "PENDING"
    case "APPROVED":
      return "APPROVED"
    case "REJECTED":
      return "REJECTED"
    case "NOT_UPLOADED":
    case "":
    default:
      return "NOT_UPLOADED"
  }
}

/* Convert raw server workflow payload to our local shape */
const normalizeWorkflow = (sw: ServerWorkflow): VisaWorkflow => {
  const base: VisaWorkflow = {
    visaType:
      (sw.visaType?.toUpperCase() as VisaWorkflow["visaType"]) || "Other",
    docs: {
      OPT_RECEIPT: { status: "NOT_UPLOADED" },
      OPT_EAD: { status: "NOT_UPLOADED" },
      I_983: { status: "NOT_UPLOADED" },
      I_20: { status: "NOT_UPLOADED" },
    },
  }
  if (sw.docs) {
    for (const [slug, sd] of Object.entries(sw.docs)) {
      const key = slugToKey[slug]
      if (!key) continue
      base.docs[key] = {
        status: toStatus(sd?.status),
        url: sd?.url,
        feedback: sd?.feedback,
      }
    }
  }
  return base
}

/* ------------------------------------------------------------------ */
/* API calls                                                          */
/* Update endpoints to match your backend                             */
/* ------------------------------------------------------------------ */

/** Fetch current user's visa workflow (user derived from auth token). */
async function fetchVisaWorkflow(): Promise<VisaWorkflow> {
  const res = await api.get<ServerWorkflow>("/visa")
  return normalizeWorkflow(res.data)
}

/** Upload a document; backend returns updated workflow (or doc). */
async function uploadVisaDoc(key: DocKey, file: File): Promise<VisaWorkflow> {
  const form = new FormData()
  form.append("file", file)
  const res = await api.post<ServerWorkflow>(`/visa/${docSlug[key]}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return normalizeWorkflow(res.data)
}

/* ------------------------------------------------------------------ */
/* Determine if a doc is uploadable based on prerequisite approvals   */
/* ------------------------------------------------------------------ */
const canUploadNext = (docs: VisaWorkflow["docs"], key: DocKey) => {
  const order: DocKey[] = ["OPT_RECEIPT", "OPT_EAD", "I_983", "I_20"]
  const idx = order.indexOf(key)
  if (idx === 0) return true // first doc has no dependency
  const prev = docs[order[idx - 1]]
  return prev.status === "APPROVED"
}

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */
const VisaStatusPage = () => {
  const loginStatus = useAppSelector(selectLoginStatus)
  const onBoardingStatus = useAppSelector(selectOnBoardingStatus)
  const user = useAppSelector(selectUser) // if your backend needs userId in URL
  const navigate = useNavigate()

  const [flow, setFlow] = useState<VisaWorkflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<DocKey | null>(null)

  /* Route guard: must be logged in; must have approved onboarding */
  useEffect(() => {
    if (!loginStatus) {
      void navigate("/login")
      return
    }
    if (onBoardingStatus !== "approved") {
      void navigate("/info")
    }
  }, [loginStatus, onBoardingStatus, navigate])

  /* Load workflow once gating conditions are satisfied */
  useEffect(() => {
    if (!loginStatus || onBoardingStatus !== "approved") return
    void (async () => {
      setLoading(true)
      setErrMsg(null)
      try {
        const wf = await fetchVisaWorkflow()
        setFlow(wf)
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setErrMsg(
            (err.response?.data as { message?: string } | undefined)?.message ??
              err.message,
          )
        } else {
          setErrMsg("Failed to load visa status.")
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [loginStatus, onBoardingStatus])

  /* Local optimistic update for a specific doc */
  const updateDocLocal = (key: DocKey, patch: Partial<DocState>) => {
    setFlow(f =>
      f
        ? {
            ...f,
            docs: { ...f.docs, [key]: { ...f.docs[key], ...patch } },
          }
        : f,
    )
  }

  /* Upload handler: optimistic pending -> request -> apply server state or fallback error */
  const handleUpload = async (key: DocKey, file: File) => {
    updateDocLocal(key, { file, status: "PENDING" })
    setUploadingKey(key)
    try {
      const wf = await uploadVisaDoc(key, file)
      setFlow(wf)
    } catch (err: unknown) {
      let msg = "Upload failed."
      if (axios.isAxiosError(err)) {
        msg =
          (err.response?.data as { message?: string } | undefined)?.message ??
          err.message
      }
      updateDocLocal(key, { status: "REJECTED", feedback: msg })
    } finally {
      setUploadingKey(null)
    }
  }

  /* Non-OPT case (after data load) */
  if (!loading && flow && flow.visaType !== "OPT") {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="rounded bg-slate-50 p-4 text-slate-700">
          Your current work authorization does not require OPT tracking.
        </p>
      </main>
    )
  }

  /* Loading / error UI */
  if (loading || !flow) {
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
/* DocumentStep: single document row/card                              */
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

      {/* status text / downloads / feedback */}
      <div className="space-y-4">
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
            <p>{doc.feedback || "See HR remarks."}</p>
          </Alert>
        )}

        {extraDownloads}
      </div>

      {/* upload control */}
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

/* Simple alert wrapper */
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
