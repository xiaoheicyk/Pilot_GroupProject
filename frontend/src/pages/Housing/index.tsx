import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Plus, MessageCircle } from "lucide-react"
import { useAppSelector } from "../../app/hooks"
import {
  selectLoginStatus,
  selectOnBoardingStatus,
  selectUser,
} from "../../features/auth/authSlice"
import { useNavigate } from "react-router"
import axios from "axios"
import api from "../../api" // <-- your configured axios instance

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Status = "OPEN" | "IN_PROGRESS" | "CLOSED"

type Comment = {
  id: string
  body: string
  author: string
  ts: string // ISO
}

type Report = {
  id: string
  title: string
  description: string
  author: string
  ts: string // ISO created
  status: Status
  comments: Comment[]
}

type Roommate = {
  name: string
  phone: string
}
type House = {
  address: string
  roommates: Roommate[]
}

/* ------------------------------------------------------------------ */
/* Backend response shapes (adjust to match actual API)               */
/* ------------------------------------------------------------------ */
type ServerReport = {
  id: string
  title: string
  description: string
  author: string
  createdAt: string
  status: string
  comments?: ServerComment[]
}
type ServerComment = {
  id: string
  body: string
  author: string
  createdAt: string
}
type ServerHouse = {
  address: string
  roommates: { name: string; phone: string }[]
}

/* ------------------------------------------------------------------ */
/* Normalizers                                                        */
/* ------------------------------------------------------------------ */
const toStatus = (s: string): Status => {
  const u = s?.toUpperCase()
  return u === "IN_PROGRESS" || u === "CLOSED" ? (u as Status) : "OPEN"
}

const normalizeComment = (c: ServerComment): Comment => ({
  id: c.id,
  body: c.body,
  author: c.author,
  ts: c.createdAt,
})

const normalizeReport = (r: ServerReport): Report => ({
  id: r.id,
  title: r.title,
  description: r.description,
  author: r.author,
  ts: r.createdAt,
  status: toStatus(r.status),
  comments: (r.comments ?? []).map(normalizeComment),
})

const normalizeHouse = (h: ServerHouse): House => ({
  address: h.address,
  roommates: h.roommates.map(r => ({ name: r.name, phone: r.phone })),
})

/* ------------------------------------------------------------------ */
/* API helpers                                                        */
/* ------------------------------------------------------------------ */
/** Fetch the logged-in user's housing details. */
async function fetchHouse(): Promise<House> {
  const res = await api.get<ServerHouse>("/housing/me")
  return normalizeHouse(res.data)
}

/** Fetch facility reports created by the logged-in user. */
async function fetchMyReports(): Promise<Report[]> {
  const res = await api.get<ServerReport[]>("/housing/reports/me")
  return res.data.map(normalizeReport)
}

/** Create a new facility report. */
async function createReport(payload: {
  title: string
  description: string
}): Promise<Report> {
  const res = await api.post<ServerReport>("/housing/reports", payload)
  return normalizeReport(res.data)
}

/** Post a comment on a report. */
async function createComment(reportId: string, body: string): Promise<Comment> {
  const res = await api.post<ServerComment>(
    `/housing/reports/${reportId}/comments`,
    { body },
  )
  return normalizeComment(res.data)
}

/* ------------------------------------------------------------------ */
/* Format helper (ensures a Date object is passed to date-fns)        */
/* ------------------------------------------------------------------ */
const fmt = (iso: string, pattern = "yyyy-MM-dd HH:mm") => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : format(d, pattern)
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
const Housing = () => {
  const loginStatus = useAppSelector(selectLoginStatus)
  const onBoardingStatus = useAppSelector(selectOnBoardingStatus)
  const user = useAppSelector(selectUser) // { username, ... }
  const navigate = useNavigate()

  /* house */
  const [house, setHouse] = useState<House | null>(null)
  const [houseErr, setHouseErr] = useState<string | null>(null)
  const [houseLoading, setHouseLoading] = useState(true)

  /* reports */
  const [reports, setReports] = useState<Report[]>([])
  const [reportsErr, setReportsErr] = useState<string | null>(null)
  const [reportsLoading, setReportsLoading] = useState(true)

  /* selected report for drawer */
  const [selected, setSelected] = useState<Report | null>(null)

  /* new report form */
  const [newTitle, setNewTitle] = useState("")
  const [newBody, setNewBody] = useState("")
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState<string | null>(null)

  /* gating */
  useEffect(() => {
    if (!loginStatus) {
      void navigate("/login")
      return
    }
    if (onBoardingStatus !== "approved") {
      void navigate("/info")
    }
  }, [loginStatus, onBoardingStatus, navigate])

  /* load house */
  useEffect(() => {
    if (!loginStatus || onBoardingStatus !== "approved") return
    void (async () => {
      setHouseLoading(true)
      setHouseErr(null)
      try {
        const h = await fetchHouse()
        setHouse(h)
      } catch (err: unknown) {
        setHouseErr(extractErrMsg(err, "Failed to load housing details."))
      } finally {
        setHouseLoading(false)
      }
    })()
  }, [loginStatus, onBoardingStatus])

  /* load my reports */
  useEffect(() => {
    if (!loginStatus || onBoardingStatus !== "approved") return
    void (async () => {
      setReportsLoading(true)
      setReportsErr(null)
      try {
        const rs = await fetchMyReports()
        setReports(rs)
      } catch (err: unknown) {
        setReportsErr(extractErrMsg(err, "Failed to load reports."))
      } finally {
        setReportsLoading(false)
      }
    })()
  }, [loginStatus, onBoardingStatus])

  /* derived list: only mine (API already filters, but keep client guard) */
  const myReports = useMemo(
    () => reports.filter(r => r.author === user.username),
    [reports, user.username],
  )

  /* create report (calls backend then updates local list) */
  const handleCreate = async () => {
    if (!newTitle.trim() || !newBody.trim()) return
    setCreating(true)
    setCreateErr(null)
    try {
      const newRep = await createReport({
        title: newTitle.trim(),
        description: newBody.trim(),
      })
      setReports(r => [newRep, ...r])
      setNewTitle("")
      setNewBody("")
      setSelected(newRep) // open drawer to continue conversation
    } catch (err: unknown) {
      setCreateErr(extractErrMsg(err, "Failed to create report."))
    } finally {
      setCreating(false)
    }
  }

  /* add comment (backend → update local copy) */
  const handleComment = async (reportId: string, text: string) => {
    if (!text.trim()) return
    try {
      const c = await createComment(reportId, text.trim())
      setReports(rs =>
        rs.map(rep =>
          rep.id === reportId
            ? { ...rep, comments: [...rep.comments, c] }
            : rep,
        ),
      )
      // also update drawer if open
      setSelected(sel =>
        sel && sel.id === reportId
          ? { ...sel, comments: [...sel.comments, c] }
          : sel,
      )
    } catch (err: unknown) {
      // optional: toast error
      // eslint-disable-next-line no-console
      console.error("Failed to add comment", err)
      alert(extractErrMsg(err, "Failed to add comment."))
    }
  }

  /* Loading UI */
  if (houseLoading || reportsLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <p className="text-sm text-slate-600">Loading…</p>
      </main>
    )
  }

  /* Aggregate error UI */
  if (houseErr || reportsErr) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6 space-y-4">
        {houseErr && <p className="text-sm text-red-600">{houseErr}</p>}
        {reportsErr && <p className="text-sm text-red-600">{reportsErr}</p>}
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-6">
      {/* ---------- House details ---------- */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-800">House Details</h2>
        <p className="mt-2 text-slate-700">
          {house?.address ?? "No housing assigned."}
        </p>

        <h3 className="mt-4 font-medium text-slate-800">Roommates</h3>
        {house && house.roommates.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {house.roommates.map(rm => (
              <li key={rm.phone} className="text-sm text-slate-700">
                {rm.name} · {rm.phone}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-500">No roommates listed.</p>
        )}
      </section>

      {/* ---------- Create facility report ---------- */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Plus size={18} />
          New Facility Report
        </h2>

        <div className="mt-4 space-y-3">
          <input
            value={newTitle}
            onChange={e => {
              setNewTitle(e.target.value)
            }}
            placeholder="Title"
            className="w-full rounded border border-slate-300 p-2"
          />
          <textarea
            value={newBody}
            onChange={e => {
              setNewBody(e.target.value)
            }}
            placeholder="Description"
            rows={4}
            className="w-full rounded border border-slate-300 p-2"
          />
          <button
            onClick={() => void handleCreate()}
            disabled={creating}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Submitting…" : "Submit"}
          </button>
          {createErr && <p className="text-sm text-red-600">{createErr}</p>}
        </div>
      </section>

      {/* ---------- My reports list ---------- */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-800">My Reports</h2>

        {myReports.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No reports yet.</p>
        ) : (
          <ul className="mt-4 divide-y">
            {myReports.map(r => (
              <li
                key={r.id}
                className="flex cursor-pointer justify-between py-3 hover:bg-slate-50"
                onClick={() => {
                  setSelected(r)
                }}
              >
                <span>
                  <p className="font-medium text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-500">{fmt(r.ts)}</p>
                </span>
                <StatusChip status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Report drawer ---------- */}
      {selected && (
        <ReportDrawer
          report={selected}
          onClose={() => {
            setSelected(null)
          }}
          onComment={text => void handleComment(selected.id, text)}
        />
      )}
    </main>
  )
}

export default Housing

/* ------------------------------------------------------------------ */
/* StatusChip                                                          */
/* ------------------------------------------------------------------ */
const StatusChip = ({ status }: { status: Status }) => {
  const cls: Record<Status, string> = {
    OPEN: "bg-amber-100 text-amber-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    CLOSED: "bg-emerald-100 text-emerald-800",
  }
  return (
    <span className={`${cls[status]} rounded px-2 py-0.5 text-xs font-medium`}>
      {status.replace("_", " ")}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* ReportDrawer                                                        */
/* ------------------------------------------------------------------ */
type DrawerProps = {
  report: Report
  onClose: () => void
  onComment: (text: string) => void
}

const ReportDrawer = ({ report, onClose, onComment }: DrawerProps) => {
  const [text, setText] = useState("")

  return (
    <div className="fixed inset-0 z-10 flex">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel */}
      <aside className="relative ml-auto h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
        <header className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">{report.title}</h3>
          <button
            onClick={onClose}
            className="rounded bg-slate-100 px-2 py-1 text-sm"
          >
            Close
          </button>
        </header>

        <div className="space-y-6 p-4">
          {/* description */}
          <section>
            <h4 className="font-medium text-slate-700">Description</h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {report.description}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              By {report.author} · {fmt(report.ts)}
            </p>
            <StatusChip status={report.status} />
          </section>

          {/* comments */}
          <section>
            <h4 className="mb-2 flex items-center gap-1 font-medium text-slate-700">
              <MessageCircle size={16} /> Comments
            </h4>

            {report.comments.length === 0 ? (
              <p className="text-sm text-slate-600">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {report.comments.map(c => (
                  <li key={c.id} className="rounded bg-slate-50 p-3">
                    <p className="whitespace-pre-wrap text-sm text-slate-800">
                      {c.body}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {c.author} · {fmt(c.ts)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* add comment */}
            <textarea
              value={text}
              onChange={e => {
                setText(e.target.value)
              }}
              rows={3}
              placeholder="Add a comment"
              className="mt-4 w-full rounded border border-slate-300 p-2"
            />
            <button
              onClick={() => {
                onComment(text)
                setText("")
              }}
              className="mt-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Post comment
            </button>
          </section>
        </div>
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Error extraction helper                                            */
/* ------------------------------------------------------------------ */
function extractErrMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? fallback
  }
  return fallback
}
