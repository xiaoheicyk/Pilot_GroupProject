import { useState, useEffect } from "react"
import type { ChangeEvent } from "react"
import { ShieldCheck, Upload, FileWarning } from "lucide-react"
import { useAppSelector } from "../../app/hooks"
import {
  selectLoginStatus,
  selectOnBoardingStatus,
} from "../../features/auth/authSlice"
import { useNavigate } from "react-router"

type DocKey = "OPT_RECEIPT" | "OPT_EAD" | "I_983" | "I_20"

type Status = "NOT_UPLOADED" | "PENDING" | "APPROVED" | "REJECTED"

type DocState = {
  file?: File // uploaded file (local preview)
  url?: string // approved download link
  status: Status
  feedback?: string // HR feedback when REJECTED
}

type VisaWorkflow = {
  visaType: "OPT" | "H1B" | "L1" | "Other"
  docs: Record<DocKey, DocState>
}

/* TODO: fake store – replace with Redux / React-Query fetch */
const initial: VisaWorkflow = {
  visaType: "OPT",
  docs: {
    OPT_RECEIPT: { status: "PENDING" },
    OPT_EAD: { status: "NOT_UPLOADED" },
    I_983: { status: "NOT_UPLOADED" },
    I_20: { status: "NOT_UPLOADED" },
  },
}

/* utility: is the “next” button enabled? */
const canUploadNext = (docs: VisaWorkflow["docs"], key: DocKey) => {
  /* prerequisite chain */
  const order: DocKey[] = ["OPT_RECEIPT", "OPT_EAD", "I_983", "I_20"]
  const idx = order.indexOf(key)
  if (idx === 0) return true // first doc always allowed
  const prev = docs[order[idx - 1]]
  return prev.status === "APPROVED"
}

const VisaStatusPage = () => {
  const loginStatus = useAppSelector(selectLoginStatus)
  const onBoardingStatus = useAppSelector(selectOnBoardingStatus)
  const navigate = useNavigate()
  const [flow, setFlow] = useState(initial)

  useEffect(() => {
    if (loginStatus) {
      // 暂时注释掉 onBoardingStatus 检查，以便于开发和测试
      // if (onBoardingStatus !== "approved") {
      //   void navigate("/info")
      // }
    } else {
      void navigate("/login")
    }
  }, [loginStatus, onBoardingStatus, navigate])

  if (flow.visaType !== "OPT")
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="rounded bg-slate-50 p-4 text-slate-700">
          Your current work authorization does not require OPT tracking.
        </p>
      </main>
    )

  /* helper to update a single document state */
  const updateDoc = (key: DocKey, patch: Partial<DocState>) => {
    setFlow(f => ({
      ...f,
      docs: { ...f.docs, [key]: { ...f.docs[key], ...patch } },
    }))
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
        onUpload={file => {
          updateDoc("OPT_RECEIPT", { file, status: "PENDING" })
        }}
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
        onUpload={file => {
          updateDoc("OPT_EAD", { file, status: "PENDING" })
        }}
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
        onUpload={file => {
          updateDoc("I_983", { file, status: "PENDING" })
        }}
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
        onUpload={file => {
          updateDoc("I_20", { file, status: "PENDING" })
        }}
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

type StepProps = {
  title: string
  docKey: DocKey
  doc: DocState
  uploadAllowed?: boolean
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

      {/* message / downloads / feedback */}
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

      {/* upload */}
      {uploadAllowed && doc.status !== "APPROVED" && (
        <div className="mt-4 flex items-center gap-4">
          <label
            htmlFor={title}
            className="inline-flex cursor-pointer items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            <Upload size={16} />
            {doc.status === "NOT_UPLOADED" ? "Upload" : "Replace"}
            <input
              id={title}
              type="file"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          {doc.file && <span className="text-sm">{doc.file.name}</span>}
        </div>
      )}
    </section>
  )
}

/* simple alert wrapper */
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
