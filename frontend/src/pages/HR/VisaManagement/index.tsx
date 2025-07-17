import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { differenceInDays } from "date-fns"
import api from "../../../api"

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

// Map backend status to frontend status
const mapBackendStatus = (status: string): VisaStatus => {
  switch (status) {
    case "pending": return "PENDING"
    case "approval": return "APPROVED"
    case "rejected": return "REJECTED"
    default: return "NOT_UPLOADED"
  }
}

// Map frontend document type to backend document type
const mapDocTypeToBackend = (docType: DocumentType): string => {
  switch (docType) {
    case "OPT_RECEIPT": return "receipt"
    case "OPT_EAD": return "ead"
    case "I_983": return "i983"
    case "I_20": return "i20"
    default: return "receipt"
  }
}

// 确定员工的下一步操作和可执行的操作
const determineNextStepAndAction = (documents: Document[]): { nextStep: string; action: "REVIEW" | "NOTIFY" | "NONE" } => {
  // 文档顺序: OPT_RECEIPT -> OPT_EAD -> I_983 -> I_20
  const documentOrder = ["OPT_RECEIPT", "OPT_EAD", "I_983", "I_20"];
  
  // 获取每种类型的文档
  const docMap = documents.reduce((acc, doc) => {
    acc[doc.type] = doc;
    return acc;
  }, {} as Record<string, Document>);
  
  // 检查是否有任何文档被拒绝
  const rejectedDoc = documents.find(doc => doc.status === "REJECTED");
  if (rejectedDoc) {
    return {
      nextStep: `${formatDocumentType(rejectedDoc.type)} was rejected. Employee needs to re-upload.`,
      action: "NOTIFY"
    };
  }
  
  // 按顺序检查文档状态
  for (const docType of documentOrder) {
    const doc = docMap[docType];
    
    // 如果文档不存在或未上传
    if (!doc || doc.status === "NOT_UPLOADED") {
      return {
        nextStep: `Waiting for ${formatDocumentType(docType)} upload`,
        action: "NOTIFY"
      };
    }
    
    // 如果文档待审核
    if (doc.status === "PENDING") {
      return {
        nextStep: `${formatDocumentType(docType)} needs review`,
        action: "REVIEW"
      };
    }
    
    // 如果文档已批准，继续检查下一个文档
  }
  
  // 如果所有文档都已批准
  return {
    nextStep: "All documents approved",
    action: "NONE"
  };
};

// 格式化文档类型显示
const formatDocumentType = (type: string): string => {
  switch (type) {
    case "OPT_RECEIPT":
      return "OPT Receipt";
    case "OPT_EAD":
      return "OPT EAD";
    case "I_983":
      return "I-983";
    case "I_20":
      return "I-20";
    default:
      return type;
  }
};

// 确定员工的下一步操作和可执行的操作
const getCurrentReviewDocType = (documents: Document[]): DocumentType | null => {
  // 按顺序检查文档状态
  if (documents[0].status === "PENDING" && documents[0].url) return "OPT_RECEIPT";
  if (documents[0].status === "APPROVED" && documents[1].status === "PENDING" && documents[1].url) return "OPT_EAD";
  if (documents[1].status === "APPROVED" && documents[2].status === "PENDING" && documents[2].url) return "I_983";
  if (documents[2].status === "APPROVED" && documents[3].status === "PENDING" && documents[3].url) return "I_20";
  return null;
}

const VisaManagement = () => {
  const [activeTab, setActiveTab] = useState<"in-progress" | "all">("in-progress")
  const [searchTerm, setSearchTerm] = useState("")
  const [employees, setEmployees] = useState<EmployeeWithVisa[]>([])
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<{doc: Document, employee: EmployeeWithVisa} | null>(null)
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch employees with visa information
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        // 获取JWT令牌
        const token = localStorage.getItem('token')
        
        if (!token) {
          console.error("No JWT token found in localStorage")
          setError("Authentication error. Please log in again.")
          setLoading(false)
          return
        }
        
        console.log("Fetching employees with token:", token.substring(0, 15) + "...")
        
        // 获取所有员工
        const response = await api.get('/hr/employees', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log("Employees response:", response.data)
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error("Invalid response format:", response.data)
          setError("Invalid data received from server")
          setLoading(false)
          return
        }
        
        // 转换数据格式
        const employeesWithVisa: EmployeeWithVisa[] = []
        
        for (const emp of response.data) {
          try {
            // 获取员工详细信息
            console.log(`Fetching details for employee ${emp.id}`)
            const detailResponse = await api.get(`/hr/employees/${emp.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            const employee = detailResponse.data
            console.log(`Employee details for ${emp.id}:`, employee)
            
            // 构建签证文档数据
            let documents: Document[] = [
              {
                type: "OPT_RECEIPT",
                status: "NOT_UPLOADED"
              },
              {
                type: "OPT_EAD",
                status: "NOT_UPLOADED"
              },
              {
                type: "I_983",
                status: "NOT_UPLOADED"
              },
              {
                type: "I_20",
                status: "NOT_UPLOADED"
              }
            ]
            
            // 尝试获取OPT数据
            try {
              // 添加API调用来获取OPT数据
              console.log(`Fetching OPT data for employee ${emp.id}`)
              
              // 创建一个新的API端点来获取员工的OPT数据
              const optResponse = await api.get(`/hr/opt/${emp.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              
              const optData = optResponse.data
              console.log(`OPT data for employee ${emp.id}:`, optData)
              
              if (optData) {
                // 更新文档状态
                if (optData.receipt) {
                  documents[0].url = optData.receipt.url || ""
                  documents[0].status = mapBackendStatus(optData.receipt.status)
                }
                
                if (optData.ead) {
                  documents[1].url = optData.ead.url || ""
                  documents[1].status = mapBackendStatus(optData.ead.status)
                }
                
                if (optData.i983) {
                  documents[2].url = optData.i983.url || ""
                  documents[2].status = mapBackendStatus(optData.i983.status)
                }
                
                if (optData.i20) {
                  documents[3].url = optData.i20.url || ""
                  documents[3].status = mapBackendStatus(optData.i20.status)
                }
              }
            } catch (optErr) {
              console.error(`Error fetching OPT data for employee ${emp.id}:`, optErr)
              // 如果OPT API调用失败，我们将回退到使用文件来判断文档状态
              console.log("Falling back to file-based document status")
              
              // 如果员工有文件，更新文档状态
              if (employee.files && employee.files.length > 0) {
                console.log(`Employee ${emp.id} has ${employee.files.length} files`)
                
                // 查找OPT Receipt
                const optReceipt = employee.files.find((f: any) => f.name && f.name.includes("OPT Receipt"))
                if (optReceipt) {
                  documents[0].url = optReceipt.url
                  documents[0].status = "PENDING" // 假设上传后状态为待审批
                }
                
                // 查找OPT EAD
                const optEad = employee.files.find((f: any) => f.name && f.name.includes("OPT EAD"))
                if (optEad) {
                  documents[1].url = optEad.url
                  documents[1].status = "PENDING"
                }
                
                // 查找I-983
                const i983 = employee.files.find((f: any) => f.name && f.name.includes("I-983"))
                if (i983) {
                  documents[2].url = i983.url
                  documents[2].status = "PENDING"
                }
                
                // 查找I-20
                const i20 = employee.files.find((f: any) => f.name && f.name.includes("I-20"))
                if (i20) {
                  documents[3].url = i20.url
                  documents[3].status = "PENDING"
                }
              }
            }
            
            employeesWithVisa.push({
              id: employee._id || emp.id,
              firstName: employee.firstName || "",
              lastName: employee.lastName || "",
              preferredName: employee.preferredName || "",
              workAuthorization: {
                title: employee.visaTitle || employee.workAuth?.visa || "F1",
                startDate: employee.visaStart || employee.workAuth?.startDate || "",
                endDate: employee.visaEnd || employee.workAuth?.endDate || ""
              },
              documents,
              email: employee.email || ""
            })
          } catch (err: any) {
            console.error(`Error fetching details for employee ${emp.id}:`, err)
            // 继续处理其他员工，不中断整个流程
          }
        }
        
        console.log(`Successfully processed ${employeesWithVisa.length} employees`)
        setEmployees(employeesWithVisa)
        setLoading(false)
      } catch (err: any) {
        console.error("Error fetching employees:", err)
        setError(`Failed to load employees: ${err.message || "Unknown error"}`)
        setLoading(false)
      }
    }
    
    fetchEmployees()
  }, [])

  // 处理查看文档按钮点击
  const handleViewDocument = (employee: EmployeeWithVisa) => {
    // 找到当前需要审核的文档
    const pendingDocuments = employee.documents.filter(doc => doc.status === "PENDING");
    
    // 按照顺序找到第一个待审核的文档
    // 顺序: OPT_RECEIPT -> OPT_EAD -> I_983 -> I_20
    const documentOrder = ["OPT_RECEIPT", "OPT_EAD", "I_983", "I_20"];
    
    let documentToReview = null;
    
    // 按照顺序查找第一个待审核的文档
    for (const docType of documentOrder) {
      const doc = pendingDocuments.find(d => d.type === docType);
      if (doc) {
        documentToReview = doc;
        break;
      }
    }
    
    // 如果没有找到待审核的文档，则显示错误
    if (!documentToReview) {
      console.error("No pending document found for review");
      alert("No pending document found for review");
      return;
    }
    
    // 设置当前文档和打开模态框
    setCurrentDocument({
      doc: documentToReview,
      employee
    });
    setShowDocumentModal(true);
  };

  // 处理文档审批
  const handleDocumentAction = async (action: "APPROVED" | "REJECTED") => {
    if (!currentDocument) return
    
    // 如果是拒绝操作，但没有提供反馈，则不允许操作
    if (action === "REJECTED" && !feedback.trim()) {
      alert("Please provide feedback for rejection")
      return
    }
    
    try {
      // 获取JWT令牌
      const token = localStorage.getItem('token')
      
      // 映射前端文档类型到后端文档类型
      const backendDocType = mapDocTypeToBackend(currentDocument.doc.type)
      
      // 映射前端操作到后端操作
      const backendAction = action === "APPROVED" ? "approve" : "reject"
      
      console.log(`Sending ${backendAction} action for document ${backendDocType} of employee ${currentDocument.employee.id}`)
      
      // 调用后端API
      await api.post('/hr/visa', {
        employeeId: currentDocument.employee.id,
        type: backendDocType,
        action: backendAction,
        feedback: action === "REJECTED" ? feedback : "" // 只有拒绝时才发送反馈
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log(`Successfully ${backendAction}d document ${backendDocType}`)
      
      // 更新本地状态
      const updatedEmployees = employees.map(emp => {
        if (emp.id === currentDocument.employee.id) {
          const updatedDocuments = emp.documents.map(doc => {
            if (doc.type === currentDocument.doc.type) {
              return {
                ...doc,
                status: action,
                feedback: action === "REJECTED" ? feedback : undefined
              }
            }
            return doc
          })
          
          return {
            ...emp,
            documents: updatedDocuments
          }
        }
        return emp
      })
      
      setEmployees(updatedEmployees)
      setShowDocumentModal(false)
      setCurrentDocument(null)
      setFeedback("")
    } catch (err: any) {
      console.error("Error updating document status:", err)
      alert(`Failed to update document status: ${err.message || "Unknown error"}`)
    }
  }

  // 处理发送通知
  const handleSendNotification = (employee: EmployeeWithVisa) => {
    // 在实际应用中，这里会调用发送通知的API
    // 目前只是显示一个提示
    alert(`Notification sent to ${employee.email}`)
  }

  // 渲染表格行
  const renderTableRow = (employee: EmployeeWithVisa) => {
    // 确定下一步操作和可执行的操作
    const { nextStep, action } = determineNextStepAndAction(employee.documents);
    
    // 计算剩余天数
    const calculateRemainingDays = () => {
      if (!employee.workAuthorization.endDate) return "";
      
      const endDate = new Date(employee.workAuthorization.endDate);
      const today = new Date();
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return "Expired";
      }
      
      return `${diffDays} days remaining`;
    }
    
    const remainingDays = calculateRemainingDays();
    const isExpired = remainingDays === "Expired";
    
    return (
      <tr key={employee.id} className="border-b border-gray-200">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
          <div className="text-sm text-gray-500">{employee.preferredName}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{employee.workAuthorization.title}</div>
          <div className="text-sm text-gray-500">
            {employee.workAuthorization.startDate} to {employee.workAuthorization.endDate}
          </div>
          <div className={`text-sm font-medium ${isExpired ? "text-red-600" : "text-blue-600"}`}>
            {remainingDays}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {nextStep}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {action === "REVIEW" && (
            <button
              onClick={() => handleViewDocument(employee)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Review Document
            </button>
          )}
          {action === "NOTIFY" && (
            <button
              onClick={() => handleSendNotification(employee)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
            >
              Send Notification
            </button>
          )}
        </td>
      </tr>
    );
  };

  // Filter employees based on search term and active tab
  const filteredEmployees = employees.filter(emp => {
    // Search filter
    const searchMatch = 
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.workAuthorization.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Tab filter
    const tabMatch = 
      activeTab === "all" || 
      (activeTab === "in-progress" && emp.documents.some(doc => 
        doc.status === "PENDING" || doc.status === "REJECTED" || doc.status === "NOT_UPLOADED"
      ))
    
    return searchMatch && tabMatch
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Visa Status Management</h1>
      
      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading employees...</div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && (
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
                      {filteredEmployees.map(renderTableRow)}
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
                      {filteredEmployees.map(renderTableRow)}
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
                  {currentDocument.doc.type} - {currentDocument.employee.firstName} {currentDocument.employee.lastName}
                </h2>
                
                {/* Document preview */}
                <div className="mb-4">
                  {currentDocument.doc.url ? (
                    <iframe
                      src={currentDocument.doc.url}
                      className="w-full h-96 border border-gray-300 rounded"
                      title="Document Preview"
                    />
                  ) : (
                    <div className="w-full h-96 border border-gray-300 rounded flex items-center justify-center">
                      <p className="text-gray-500">No document available for preview</p>
                    </div>
                  )}
                </div>
                
                {/* Feedback input for rejection */}
                {currentDocument.doc.status === "PENDING" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback (required for rejection)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      rows={3}
                      placeholder="Enter feedback for the employee..."
                    />
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowDocumentModal(false)
                      setCurrentDocument(null)
                      setFeedback("")
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                  >
                    Close
                  </button>
                  
                  {currentDocument.doc.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleDocumentAction("APPROVED")}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDocumentAction("REJECTED")}
                        disabled={!feedback.trim()}
                        className={`px-4 py-2 ${
                          feedback.trim() ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-300 text-white cursor-not-allowed"
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
      )}
    </div>
  )
}

export default VisaManagement
