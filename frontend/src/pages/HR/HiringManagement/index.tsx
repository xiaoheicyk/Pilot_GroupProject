import { useState } from "react"

type Token = {
  id: string
  email: string
  status: "unused" | "used" | "expired"
  createdAt: string
  expiresAt: string
}

type Application = {
  id: string
  applicantName: string
  email: string
  submittedAt: string
  status: "pending" | "approved" | "rejected"
}

const HiringManagement = () => {
  const [activeTab, setActiveTab] = useState<"tokens" | "applications">("tokens")
  const [email, setEmail] = useState("")
  
  // Mock data - would be replaced with actual API calls
  const tokens: Token[] = [
    {
      id: "1",
      email: "candidate1@example.com",
      status: "unused",
      createdAt: "2025-07-10",
      expiresAt: "2025-07-24"
    },
    {
      id: "2",
      email: "candidate2@example.com",
      status: "used",
      createdAt: "2025-07-05",
      expiresAt: "2025-07-19"
    },
    {
      id: "3",
      email: "candidate3@example.com",
      status: "expired",
      createdAt: "2025-06-15",
      expiresAt: "2025-06-29"
    }
  ]
  
  const applications: Application[] = [
    {
      id: "1",
      applicantName: "John Smith",
      email: "john.smith@example.com",
      submittedAt: "2025-07-12",
      status: "pending"
    },
    {
      id: "2",
      applicantName: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      submittedAt: "2025-07-10",
      status: "pending"
    }
  ]
  
  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault()
    // This would call an API to generate a token and send an email
    console.log("Generating token for:", email)
    alert(`Token generated for ${email}`)
    setEmail("")
  }
  
  const handleApproveApplication = (id: string) => {
    console.log("Approving application:", id)
  }
  
  const handleRejectApplication = (id: string) => {
    console.log("Rejecting application:", id)
  }
  
  const getTokenStatusClass = (status: string) => {
    switch (status) {
      case "unused":
        return "bg-green-100 text-green-800"
      case "used":
        return "bg-blue-100 text-blue-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  const getApplicationStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-indigo-700 mb-4">Hiring Management</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("tokens")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tokens"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Registration Tokens
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "applications"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Onboarding Applications
            </button>
          </nav>
        </div>
        
        {/* Token Generation Tab */}
        {activeTab === "tokens" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Generate Registration Token</h2>
              <form onSubmit={handleGenerateToken} className="flex items-end gap-4">
                <div className="flex-1">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="candidate@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Generate & Send
                </button>
              </form>
            </div>
            
            <h2 className="text-lg font-semibold mb-4">Token History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokens.map((token) => (
                    <tr key={token.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {token.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTokenStatusClass(token.status)}`}>
                          {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {token.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {token.expiresAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={token.status !== "unused"}
                        >
                          Resend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Pending Applications</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {application.applicantName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.submittedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getApplicationStatusClass(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 mr-3"
                          onClick={() => handleApproveApplication(application.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleRejectApplication(application.id)}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HiringManagement
