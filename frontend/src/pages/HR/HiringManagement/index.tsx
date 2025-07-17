import React, { useState, useEffect } from "react";
import { Search, Plus, Check, X, RefreshCw, Mail } from "lucide-react";
import api from "../../../api";
import { format, isAfter } from "date-fns";

// 定义注册令牌类型
type RegistrationToken = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  expiresAt: string;
  used: boolean;
  expired: boolean;
  createdAt: string;
};

// 定义入职申请类型
type OnboardingApplication = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  onBoardingStatus: "pending" | "approved" | "rejected";
};

const HiringManagement: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<"tokens" | "applications">("tokens");
  const [applicationTab, setApplicationTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [tokens, setTokens] = useState<RegistrationToken[]>([]);
  const [applications, setApplications] = useState<OnboardingApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newToken, setNewToken] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  // 审核状态
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<OnboardingApplication | null>(null);
  const [feedback, setFeedback] = useState("");

  // 获取令牌列表
  const fetchTokens = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/hr/token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTokens(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  };

  // 获取入职申请
  const fetchApplications = async (status: "pending" | "approved" | "rejected") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/hr/onboarding?status=${status}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setApplications(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    if (activeTab === "tokens") {
      fetchTokens();
    } else {
      fetchApplications(applicationTab);
    }
  }, [activeTab, applicationTab]);

  // 生成注册令牌
  const handleGenerateToken = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await api.post(
        `/hr/token`,
        newToken,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // 重置表单并刷新令牌列表
      setNewToken({ firstName: "", lastName: "", email: "" });
      setShowTokenModal(false);
      fetchTokens();
      setError(null);
    } catch (err: any) {
      console.error("Generate token error:", err);
      setError(err.response?.data?.error || "Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  // 审核入职申请
  const handleReviewApplication = async (action: "approve" | "reject") => {
    if (!currentApplication) return;
    
    // 拒绝时需要提供反馈
    if (action === "reject" && !feedback.trim()) {
      setError("Feedback is required when rejecting an application");
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await api.post(
        `/hr/onboarding`,
        {
          employeeId: currentApplication._id,
          action,
          feedback: action === "reject" ? feedback : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // 重置状态并刷新应用列表
      setShowReviewModal(false);
      setCurrentApplication(null);
      setFeedback("");
      fetchApplications(applicationTab);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to review application");
    } finally {
      setLoading(false);
    }
  };

  // 获取令牌状态标签
  const getTokenStatusTag = (token: RegistrationToken) => {
    if (token.used) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Used
        </span>
      );
    } else if (token.expired) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Expired
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Valid
        </span>
      );
    }
  };

  // 过滤搜索结果
  const filteredTokens = tokens.filter(token => 
    token.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(app => 
    app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hiring Management</h1>
        <div className="flex space-x-2">
          {activeTab === "tokens" && (
            <button
              onClick={() => setShowTokenModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus size={18} className="mr-1" />
              Generate Token
            </button>
          )}
          <button
            onClick={() => activeTab === "tokens" ? fetchTokens() : fetchApplications(applicationTab)}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            <RefreshCw size={18} className="mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
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
            onClick={() => {
              setActiveTab("applications");
              fetchApplications("pending");
            }}
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

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      ) : (
        <>
          {/* Registration Tokens Tab */}
          {activeTab === "tokens" && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTokens.length > 0 ? (
                    filteredTokens.map((token) => (
                      <tr key={token._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {token.firstName} {token.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{token.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {token.createdAt ? format(new Date(token.createdAt), "MMM dd, yyyy HH:mm") : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {token.expiresAt ? format(new Date(token.expiresAt), "MMM dd, yyyy HH:mm") : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTokenStatusTag(token)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No registration tokens found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Onboarding Applications Tab */}
          {activeTab === "applications" && (
            <>
              {/* Application Status Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => {
                      setApplicationTab("pending");
                      fetchApplications("pending");
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      applicationTab === "pending"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => {
                      setApplicationTab("approved");
                      fetchApplications("approved");
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      applicationTab === "approved"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => {
                      setApplicationTab("rejected");
                      fetchApplications("rejected");
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      applicationTab === "rejected"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Rejected
                  </button>
                </nav>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.length > 0 ? (
                      filteredApplications.map((app) => (
                        <tr key={app._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {app.firstName} {app.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{app.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              app.onBoardingStatus === "pending" 
                                ? "bg-yellow-100 text-yellow-800"
                                : app.onBoardingStatus === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {app.onBoardingStatus.charAt(0).toUpperCase() + app.onBoardingStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {app.onBoardingStatus === "pending" && (
                              <button
                                onClick={() => {
                                  setCurrentApplication(app);
                                  setShowReviewModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Review
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          No {applicationTab} applications found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Generate Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Generate Registration Token</h2>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={newToken.firstName}
                  onChange={(e) => setNewToken({...newToken, firstName: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter first name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newToken.lastName}
                  onChange={(e) => setNewToken({...newToken, lastName: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter last name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newToken.email}
                  onChange={(e) => setNewToken({...newToken, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateToken}
                disabled={!newToken.firstName || !newToken.lastName || !newToken.email}
                className={`px-4 py-2 ${
                  newToken.firstName && newToken.lastName && newToken.email
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-indigo-300 cursor-not-allowed"
                } text-white rounded-md flex items-center`}
              >
                <Mail size={18} className="mr-1" />
                Generate & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Application Modal */}
      {showReviewModal && currentApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Review Onboarding Application</h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setCurrentApplication(null);
                  setFeedback("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">
                {currentApplication.firstName} {currentApplication.lastName}
              </h3>
              <p className="text-gray-600 mb-4">{currentApplication.email}</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback (required for rejection)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="Enter feedback for the applicant..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setCurrentApplication(null);
                  setFeedback("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewApplication("approve")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Check size={18} className="mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleReviewApplication("reject")}
                disabled={!feedback.trim()}
                className={`px-4 py-2 ${
                  feedback.trim() ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
                } text-white rounded-md flex items-center`}
              >
                <X size={18} className="mr-1" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiringManagement;
