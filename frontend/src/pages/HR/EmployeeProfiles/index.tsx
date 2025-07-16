import { useState, useEffect } from "react"
import { Link } from "react-router"
import { Search } from "lucide-react"
import { mockEmployees, Employee } from "./mockData"


const EmployeeProfiles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(mockEmployees);
  
  // 按姓氏字母顺序排序
  const sortedEmployees = [...filteredEmployees].sort((a, b) => 
    a.lastName.localeCompare(b.lastName)
  );

  // 搜索功能
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(mockEmployees);
      return;
    }
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = mockEmployees.filter(employee => 
      employee.firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
      employee.lastName.toLowerCase().includes(lowerCaseSearchTerm) ||
      employee.preferredName.toLowerCase().includes(lowerCaseSearchTerm)
    );
    
    setFilteredEmployees(filtered);
  }, [searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Employee Profiles</h1>
      
      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* 员工数量统计 */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <p className="text-gray-700">
          Total Employees: <span className="font-semibold">{sortedEmployees.length}</span>
        </p>
      </div>
      
      {/* 搜索结果提示 */}
      {searchTerm && (
        <div className="mb-4">
          {sortedEmployees.length === 0 && (
            <p className="text-gray-600">No employees found matching "{searchTerm}"</p>
          )}
          {sortedEmployees.length === 1 && (
            <p className="text-gray-600">1 employee found matching "{searchTerm}"</p>
          )}
          {sortedEmployees.length > 1 && (
            <p className="text-gray-600">{sortedEmployees.length} employees found matching "{searchTerm}"</p>
          )}
        </div>
      )}
      
      {/* 员工列表 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SSN
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Work Authorization
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEmployees.map((employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    to={`/hr/employee-profiles/${employee.id}`} 
                    target="_blank"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {employee.firstName} {employee.middleName && `${employee.middleName} `}{employee.lastName}
                    {employee.preferredName && employee.preferredName !== employee.firstName && (
                      <span className="text-gray-500 ml-1">({employee.preferredName})</span>
                    )}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.ssn}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.visaTitle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.cellPhone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 无结果时显示 */}
        {sortedEmployees.length === 0 && (
          <div className="px-6 py-4 text-center text-gray-500">
            No employees found.
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfiles;
