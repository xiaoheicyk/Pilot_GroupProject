import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Plus, MessageCircle } from "lucide-react"
import { v4 as uuid } from "uuid"
import { useAppSelector } from "../../app/hooks"
import {
  selectLoginStatus,
  selectOnBoardingStatus,
} from "../../features/auth/authSlice"
import { useNavigate } from "react-router"

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
  ts: string
  status: Status
  comments: Comment[]
}

const currentUser = "John Doe"

const mockHouse = {
  address: "123 Main St, Apt 4B, Seattle, WA 98101",
  roommates: [
    { name: "Alice Smith", phone: "555-111-2222" },
    { name: "Bob Chen", phone: "555-333-4444" },
    { name: "John Doe", phone: "555-123-4567" },
  ],
}

const initialReports: Report[] = [
  {
    id: "r1",
    title: "Leaky faucet",
    description: "Kitchen sink keeps dripping.",
    author: "John Doe",
    ts: "2025-07-14T18:00:00Z",
    status: "IN_PROGRESS",
    comments: [
      {
        id: "c1",
        body: "Plumber scheduled for tomorrow.",
        author: "HR",
        ts: "2025-07-15T13:00:00Z",
      },
    ],
  },
]

const HousingPage = () => {
  const loginStatus = useAppSelector(selectLoginStatus)
  const onBoardingStatus = useAppSelector(selectOnBoardingStatus)
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [selected, setSelected] = useState<Report | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newBody, setNewBody] = useState("")

  useEffect(() => {
    if (loginStatus) {
      if (onBoardingStatus !== "approved") {
        void navigate("/info")
      }
    } else {
      void navigate("/login")
    }
  }, [loginStatus, onBoardingStatus, navigate])

  /* derived list: only current user’s reports */
  const myReports = useMemo(
    () => reports.filter(r => r.author === currentUser),
    [reports],
  )

  /* add report */
  const handleCreate = () => {
    if (!newTitle.trim() || !newBody.trim()) return
    setReports(r => [
      ...r,
      {
        id: uuid(),
        title: newTitle,
        description: newBody,
        author: currentUser,
        ts: new Date().toISOString(),
        status: "OPEN",
        comments: [],
      },
    ])
    setNewTitle("")
    setNewBody("")
  }

  /* add comment */
  const handleComment = (reportId: string, text: string) => {
    if (!text.trim()) return
    setReports(r =>
      r.map(rep =>
        rep.id === reportId
          ? {
              ...rep,
              comments: [
                ...rep.comments,
                {
                  id: uuid(),
                  body: text,
                  author: currentUser,
                  ts: new Date().toISOString(),
                },
              ],
            }
          : rep,
      ),
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-6">
      {/* ---------- House details ---------- */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-800">House Details</h2>
        <p className="mt-2 text-slate-700">{mockHouse.address}</p>

        <h3 className="mt-4 font-medium text-slate-800">Roommates</h3>
        <ul className="mt-1 space-y-1">
          {mockHouse.roommates.map(rm => (
            <li key={rm.phone} className="text-sm text-slate-700">
              {rm.name} · {rm.phone}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Create facility report ---------- */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
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
            onClick={handleCreate}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Submit
          </button>
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
                  <p className="text-xs text-slate-500">
                    {format(r.ts, "yyyy-MM-dd HH:mm")}
                  </p>
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
          onComment={text => {
            handleComment(selected.id, text)
          }}
        />
      )}
    </main>
  )
}

export default HousingPage

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
              By {report.author} · {format(report.ts, "yyyy-MM-dd HH:mm")}
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
                      {c.author} · {format(c.ts, "yyyy-MM-dd HH:mm")}
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
