import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { mockEmployees } from "../../HR/EmployeeProfiles/mockData"
import { differenceInDays } from "date-fns"

// Define visa status types
type VisaStatus = "NOT_UPLOADED" | "PENDING" | "APPROVED" | "REJECTED"

// Define document types
type DocumentType = "OPT_RECEIPT" | "OPT_EAD" | "I_983" | "I_20"

// Define document structure
type Document = {
  type: DocumentType
  status: VisaStatus
  url?: string
  feedback?: string
  submittedAt?: string
}

// Extend employee type with visa-related information
type EmployeeWithVisa = {
  id: string
  firstName: string
  lastName: string
  preferredName: string
  workAuthorization: {
    title: string
    startDate: string
    endDate: string
  }
  documents: Document[]
  email: string
}

// Create mock data - in a real application, this would come from an API
const mockEmployeesWithVisa: EmployeeWithVisa[] = mockEmployees.map(emp => ({
  ...emp,
  workAuthorization: {
    title: emp.visaTitle || "F1",
    startDate: emp.visaStart || "2023-01-01",
    endDate: emp.visaEnd || "2025-12-31"
  },
  documents: [
    {
      type: "OPT_RECEIPT",
      status: ["APPROVED", "PENDING", "REJECTED", "NOT_UPLOADED"][Math.floor(Math.random() * 4)],
      url: emp.files?.find(f => f.name.includes("OPT"))?.url,
      submittedAt: emp.id === "emp001" ? "2025-06-01" : undefined,
      feedback: emp.id === "emp003" ? "Please resubmit with clearer scan" : undefined
    },
    {
      type: "OPT_EAD",
      status: emp.id === "emp001" ? "PENDING" : "NOT_UPLOADED",
      url: emp.id === "emp001" ? "/docs/opt-ead.pdf" : undefined,
      submittedAt: emp.id === "emp001" ? "2025-07-10" : undefined
    },
    {
      type: "I_983",
      status: "NOT_UPLOADED"
    },
    {
      type: "I_20",
      status: emp.files?.find(f => f.name.includes("I-20")) ? "APPROVED" : "NOT_UPLOADED",
      url: emp.files?.find(f => f.name.includes("I-20"))?.url
    }
  ]
}))

// Get the next step for an employee based on document status
const getNextStep = (employee: EmployeeWithVisa): string => {
  // Check documents in order
  const docOrder: DocumentType[] = ["OPT_RECEIPT", "OPT_EAD", "I_983", "I_20"]
  
  for (const docType of docOrder) {
    const doc = employee.documents.find(d => d.type === docType)
    if (!doc) continue
    
    switch (doc.status) {
      case "NOT_UPLOADED":
        return `Upload ${formatDocName(docType)}`
      case "PENDING":
        return `Waiting for HR to approve ${formatDocName(docType)}`
      case "REJECTED":
        return `Resubmit ${formatDocName(docType)} with corrections`
      // If approved, check next document
    }
  }
  
  return "All documents approved"
}

// Format document name for display
const formatDocName = (docType: DocumentType): string => {
  switch (docType) {
    case "OPT_RECEIPT": return "OPT Receipt"
    case "OPT_EAD": return "OPT EAD"
    case "I_983": return "I-983 Form"
    case "I_20": return "I-20"
    default: return docType
  }
}

// Get the current document that needs action
const getCurrentActionDoc = (employee: EmployeeWithVisa): Document | undefined => {
  const docOrder: DocumentType[] = ["OPT_RECEIPT", "OPT_EAD", "I_983", "I_20"]
  
  for (const docType of docOrder) {
    const doc = employee.documents.find(d => d.type === docType)
    if (!doc) continue
    
    if (doc.status === "PENDING" || doc.status === "REJECTED") {
      return doc
    }
    
    if (doc.status === "NOT_UPLOADED") {
      return doc
    }
  }
  
  return undefined
}

const VisaManagement = () => {
  const [activeTab, setActiveTab] = useState<"in-progress" | "all">("in-progress")
  const [searchTerm, setSearchTerm] = useState("")
  const [employees, setEmployees] = useState<EmployeeWithVisa[]>(mockEmployeesWithVisa)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<{doc: Document, employee: EmployeeWithVisa} | null>(null)
  const [feedback, setFeedback] = useState("")

  // Filter employees in progress (at least one document not approved)
  const inProgressEmployees = employees.filter(emp => 
    emp.documents.some(doc => doc.status !== "APPROVED")
  )

  // Filter employees based on search term
  const filteredEmployees = activeTab === "in-progress" 
    ? inProgressEmployees.filter(emp => 
        searchTerm === "" || 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.preferredName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : employees.filter(emp => 
        searchTerm === "" || 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.preferredName.toLowerCase().includes(searchTerm.toLowerCase())
      )

  // Handle document approval/rejection
  const handleDocumentAction = (action: "APPROVED" | "REJECTED") => {
    if (!currentDocument) return

    const updatedEmployees = employees.map(emp => {
      if (emp.id === currentDocument.employee.id) {
        const updatedDocs = emp.documents.map(doc => {
          if (doc.type === currentDocument.doc.type) {
            return {
              ...doc,
              status: action,
              feedback: action === "REJECTED" ? feedback : undefined
            }
          }
          return doc
        })
        return { ...emp, documents: updatedDocs }
      }
      return emp
    })

    setEmployees(updatedEmployees)
    setShowDocumentModal(false)
    setCurrentDocument(null)
    setFeedback("")
  }

  // Handle sending notification to employee
  const handleSendNotification = (employee: EmployeeWithVisa) => {
    // In a real application, this would call an API to send an email
    alert(`Notification sent to ${employee.email}`)
  }

  // Open document preview modal
  const openDocumentPreview = (doc: Document, employee: EmployeeWithVisa) => {
    setCurrentDocument({ doc, employee })
    setShowDocumentModal(true)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Visa Status Management</h1>
      
      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("in-progress")}
              className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === "in-progress"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`ml-8 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === "all"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All
            </button>
          </nav>
        </div>
      </div>
      
      {/* In Progress tab content */}
      {activeTab === "in-progress" && (
        <>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employees found matching your search criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Authorization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Steps</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => {
                    const nextStep = getNextStep(employee)
                    const currentDoc = getCurrentActionDoc(employee)
                    const daysRemaining = differenceInDays(new Date(employee.workAuthorization.endDate), new Date())
                    
                    return (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                          <div className="text-sm text-gray-500">{employee.preferredName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.workAuthorization.title}</div>
                          <div className="text-sm text-gray-500">
                            {employee.workAuthorization.startDate} to {employee.workAuthorization.endDate}
                          </div>
                          <div className="text-sm font-medium text-indigo-600">
                            {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Expired"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {nextStep}
                          {currentDoc?.status === "REJECTED" && currentDoc.feedback && (
                            <div className="mt-1 text-red-500">
                              Feedback: {currentDoc.feedback}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentDoc?.status === "PENDING" && (
                            <div>
                              <button
                                onClick={() => openDocumentPreview(currentDoc, employee)}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm mr-2"
                              >
                                View Document
                              </button>
                              <div className="mt-2 flex space-x-2">
                                <button
                                  onClick={() => {
                                    setCurrentDocument({ doc: currentDoc, employee })
                                    handleDocumentAction("APPROVED")
                                  }}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setCurrentDocument({ doc: currentDoc, employee })
                                    setShowDocumentModal(true)
                                  }}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                          {currentDoc?.status === "NOT_UPLOADED" && (
                            <button
                              onClick={() => handleSendNotification(employee)}
                              className="px-3 py-1 bg-amber-100 text-amber-700 rounded-md text-sm"
                            >
                              Send Notification
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* All tab content */}
      {activeTab === "all" && (
        <>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employees found matching your search criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Authorization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => {
                    const daysRemaining = differenceInDays(new Date(employee.workAuthorization.endDate), new Date())
                    const approvedDocs = employee.documents.filter(doc => doc.status === "APPROVED")
                    
                    return (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                          <div className="text-sm text-gray-500">{employee.preferredName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.workAuthorization.title}</div>
                          <div className="text-sm text-gray-500">
                            {employee.workAuthorization.startDate} to {employee.workAuthorization.endDate}
                          </div>
                          <div className="text-sm font-medium text-indigo-600">
                            {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Expired"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {approvedDocs.length === 0 ? (
                            <span className="text-sm text-gray-500">No approved documents</span>
                          ) : (
                            <div className="space-y-2">
                              {approvedDocs.map((doc) => (
                                <div key={doc.type} className="flex items-center">
                                  <span className="text-sm text-gray-900 mr-2">{formatDocName(doc.type)}</span>
                                  <button
                                    onClick={() => openDocumentPreview(doc, employee)}
                                    className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs mr-2"
                                  >
                                    View
                                  </button>
                                  <a
                                    href={doc.url}
                                    download
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                                  >
                                    Download
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Document preview and feedback modal */}
      {showDocumentModal && currentDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {formatDocName(currentDocument.doc.type)} - {currentDocument.employee.firstName} {currentDocument.employee.lastName}
            </h2>
            
            {/* Document preview */}
            <div className="border rounded-lg p-4 mb-4 h-96 flex items-center justify-center bg-gray-100">
              {currentDocument.doc.url ? (
                <iframe src={currentDocument.doc.url} className="w-full h-full" title="Document Preview" />
              ) : (
                <div className="text-gray-500">No document preview available</div>
              )}
            </div>
            
            {/* Feedback form */}
            {currentDocument.doc.status === "PENDING" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback (required for rejection)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full border rounded-md p-2 h-24"
                  placeholder="Enter feedback for the employee..."
                />
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDocumentModal(false)
                  setCurrentDocument(null)
                  setFeedback("")
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md"
              >
                Close
              </button>
              
              {currentDocument.doc.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleDocumentAction("APPROVED")}
                    className="px-4 py-2 bg-green-600 text-white rounded-md"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDocumentAction("REJECTED")}
                    disabled={!feedback.trim()}
                    className={`px-4 py-2 ${
                      feedback.trim() ? "bg-red-600 text-white" : "bg-red-300 text-white cursor-not-allowed"
                    } rounded-md`}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisaManagement
