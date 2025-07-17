import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Plus, MessageCircle } from "lucide-react"
import { useAppSelector } from "../../app/hooks"
import { selectLoginStatus, selectUser } from "../../features/auth/authSlice"
import { useNavigate } from "react-router"
import axios from "axios"
import api from "../../api"

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
  ts: string // ISO
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
/* Backend response shapes                                            */
/* ------------------------------------------------------------------ */
/** Report from server (no populate) */
type ServerReport = {
  _id: string
  title?: string
  description?: string
  timestamp?: string
  status?: string // 'open'|'in progress'|'close'
  comments?: ServerReportComment[]
}
/** Report returned in createReport/addComment wrapper {message,report} */
type ServerReportWrapper = {
  message?: string
  report: ServerReport
}
/** Report comment in embedded array */
type ServerReportComment = {
  _id?: string
  user?: string | { username?: string; role?: string; _id?: string }
  content?: string
  timestamp?: string
}

/** Comment list from getComments */
type ServerCommentList = ServerReportComment[]

/** House from server (see controller) */
type ServerHouse = {
  // we don't know exact shape; pick common fields & index fallback
  _id?: string
  address?: string // controller likely serializes address string
  street1?: string
  street2?: string
  city?: string
  state?: string
  zip?: string
  employeeId?: {
    firstName?: string
    lastName?: string
    cellPhone?: string
    _id?: string
  }[]
  // allow any
  [k: string]: unknown
}

/* ------------------------------------------------------------------ */
/* API endpoints                                                      */
/* ------------------------------------------------------------------ */
/* Update to match your Express router if different */
const API_HOUSE_ME = (id: string) => `/housing/${id}` // GET -> getMyHouse
const API_REPORTS_MY = "/report/maintenance" // GET -> getMyReports
const API_REPORTS_CREATE = "/report/employee/maintenance" // POST -> createReport
const API_REPORTS_COMMENT = "/housing/reports/comment" // POST -> addComment (expects body.reportId & body.content)
const API_REPORTS_COMMENTS = (id: string) => `/housing/reports/${id}/comments` // GET -> getComments

/* ------------------------------------------------------------------ */
/* Normalizers                                                        */
/* ------------------------------------------------------------------ */
const toStatus = (s?: string): Status => {
  const u = (s ?? "").toLowerCase()
  switch (u) {
    case "in progress":
    case "in_progress":
    case "inprogress":
      return "IN_PROGRESS"
    case "close":
    case "closed":
      return "CLOSED"
    case "open":
    default:
      return "OPEN"
  }
}

const fmt = (iso?: string, pattern = "yyyy-MM-dd HH:mm") => {
  if (!iso) return ""
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "" : format(d, pattern)
}

/* Extract username from comment.user (string id or populated object). */
const userLabel = (u: ServerReportComment["user"]): string => {
  if (!u) return "User"
  if (typeof u === "string") return "User"
  return u.username ?? "User"
}

const normComment = (c: ServerReportComment): Comment => ({
  id: c._id ?? crypto.randomUUID(),
  body: c.content ?? "",
  author: userLabel(c.user),
  ts: c.timestamp ?? "",
})

const normReport = (r: ServerReport, fallbackAuthor: string): Report => ({
  id: r._id,
  title: r.title ?? "",
  description: r.description ?? "",
  author: fallbackAuthor, // server doesn't populate; we show current user
  ts: r.timestamp ?? "",
  status: toStatus(r.status),
  comments: (r.comments ?? []).map(normComment),
})

/* House: build printable address string gracefully. */
const normHouse = (h: ServerHouse): House => {
  const line =
    h.address ??
    [h.street1, h.street2, h.city, h.state, h.zip].filter(Boolean).join(", ")

  const roommates: Roommate[] = Array.isArray(h.employeeId)
    ? h.employeeId.map(e => ({
        name: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(),
        phone: e.cellPhone ?? "",
      }))
    : []

  return {
    address: line || "—",
    roommates,
  }
}

/* ------------------------------------------------------------------ */
/* API helpers                                                        */
/* ------------------------------------------------------------------ */
async function fetchHouse(id: string): Promise<House> {
  const res = await api.get<ServerHouse>(API_HOUSE_ME(id))
  return normHouse(res.data)
}

async function fetchMyReports(currentUsername: string): Promise<Report[]> {
  const res = await api.get<ServerReport[]>(API_REPORTS_MY)
  return res.data.map(r => normReport(r, currentUsername))
}

async function createReport(
  payload: {
    title: string
    description: string
  },
  currentUsername: string,
): Promise<Report> {
  const res = await api.post<ServerReportWrapper>(API_REPORTS_CREATE, payload)
  return normReport(res.data.report, currentUsername)
}

/* addComment controller expects body: {reportId, content} and returns {message, report} */
async function postComment(
  reportId: string,
  content: string,
  currentUsername: string,
): Promise<Report> {
  const res = await api.post<ServerReportWrapper>(API_REPORTS_COMMENT, {
    reportId,
    content,
  })
  return normReport(res.data.report, currentUsername)
}

/* getComments gives latest full comment list (populated) */
async function fetchComments(reportId: string): Promise<Comment[]> {
  const res = await api.get<ServerCommentList>(API_REPORTS_COMMENTS(reportId))
  return res.data.map(normComment)
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
const Housing = () => {
  const loginStatus = useAppSelector(selectLoginStatus)
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
  }, [loginStatus, navigate])

  /* load house */
  useEffect(() => {
    if (!loginStatus) return
    void (async () => {
      setHouseLoading(true)
      setHouseErr(null)
      try {
        const h = await fetchHouse(user.id)
        setHouse(h)
      } catch (err: unknown) {
        setHouseErr(extractErrMsg(err, "Failed to load housing details."))
      } finally {
        setHouseLoading(false)
      }
    })()
  }, [loginStatus, user.id])

  /* load my reports */
  useEffect(() => {
    if (!loginStatus) return
    void (async () => {
      setReportsLoading(true)
      setReportsErr(null)
      try {
        const rs = await fetchMyReports(user.username)
        setReports(rs)
      } catch (err: unknown) {
        setReportsErr(extractErrMsg(err, "Failed to load reports."))
      } finally {
        setReportsLoading(false)
      }
    })()
  }, [loginStatus, user.username])

  /* derived list: only mine (API already filters, but keep guard) */
  const myReports = useMemo(
    () => reports.filter(r => r.author === user.username),
    [reports, user.username],
  )

  /* create report */
  const handleCreate = async () => {
    if (!newTitle.trim() || !newBody.trim()) return
    setCreating(true)
    setCreateErr(null)
    try {
      const newRep = await createReport(
        {
          title: newTitle.trim(),
          description: newBody.trim(),
        },
        user.username,
      )
      setReports(r => [newRep, ...r])
      setNewTitle("")
      setNewBody("")
      setSelected(newRep)
    } catch (err: unknown) {
      setCreateErr(extractErrMsg(err, "Failed to create report."))
    } finally {
      setCreating(false)
    }
  }

  /* add comment */
  const handleComment = async (reportId: string, text: string) => {
    if (!text.trim()) return
    try {
      const updated = await postComment(reportId, text.trim(), user.username)
      // update global reports list
      setReports(rs => rs.map(r => (r.id === reportId ? updated : r)))
      // update drawer
      setSelected(sel => (sel && sel.id === reportId ? updated : sel))
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("Failed to add comment", err)
      alert(extractErrMsg(err, "Failed to add comment."))
    }
  }

  /* When drawer opens, fetch fresh comments (populated) */
  useEffect(() => {
    if (!selected) return
    void (async () => {
      try {
        const cmts = await fetchComments(selected.id)
        setSelected(sel => (sel ? { ...sel, comments: cmts } : sel))
        // also mirror into top-level reports
        setReports(rs =>
          rs.map(r => (r.id === selected.id ? { ...r, comments: cmts } : r)),
        )
      } catch (err) {
        // ignore comment refresh errors
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]) // purposely depend on id only

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
          {house?.address ?? "No house assigned."}
        </p>

        <h3 className="mt-4 font-medium text-slate-800">Roommates</h3>
        {house && house.roommates.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {house.roommates.map(rm => (
              <li
                key={`${rm.name}-${rm.phone}`}
                className="text-sm text-slate-700"
              >
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
            onClick={() => {
              void handleCreate()
            }}
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
    const data = err.response?.data as
      | { message?: string; error?: string }
      | undefined
    return data?.message ?? data?.error ?? err.message ?? fallback
  }
  return fallback
}
