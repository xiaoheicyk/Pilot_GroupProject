import { useAppSelector } from "../../../app/hooks"
import { selectUser } from "../../../features/auth/authSlice"

const HRHome = () => {
  const user = useAppSelector(selectUser)

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-indigo-700 mb-4">HR Dashboard</h1>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Welcome, {user.username}</h2>
          <p className="text-gray-600">
            This is the HR management portal where you can manage employee profiles, visa statuses, hiring, and housing.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-700">Employee Profiles</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage employee information</p>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-700">Visa Status Management</h3>
            <p className="text-sm text-gray-600 mt-1">Track and update employee visa statuses</p>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-700">Hiring Management</h3>
            <p className="text-sm text-gray-600 mt-1">Generate registration tokens and manage onboarding</p>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-700">Housing Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage employee housing and facilities</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HRHome
