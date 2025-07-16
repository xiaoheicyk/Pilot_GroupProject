import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router"
import NavBar from "./components/NavBar"
import HRNavBar from "./components/HRNavBar"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Info from "./pages/Info"
import Visa from "./pages/Visa"
import Housing from "./pages/Housing"
import HRHome from "./pages/HR/Home"
import EmployeeProfiles from "./pages/HR/EmployeeProfiles"
import EmployeeDetail from "./pages/HR/EmployeeProfiles/EmployeeDetail"
import VisaManagement from "./pages/HR/VisaManagement"
// import HiringManagement from "./pages/HR/HiringManagement"
import HousingManagement from "./pages/HR/HousingManagement"

const EmployeeLayout = () => {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  )
}

const HRLayout = () => {
  return (
    <>
      <HRNavBar />
      <Outlet />
    </>
  )
}

const App = () => {
  return (
    <div className="flex flex-col min-h-screen min-w-fit bg-slate-200">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Employee Routes */}
          <Route element={<EmployeeLayout />}>
            <Route path="/info" element={<Info />} />
            <Route path="/visa" element={<Visa />} />
            <Route path="/housing" element={<Housing />} />
          </Route>
          
          {/* HR Routes */}
          <Route element={<HRLayout />}>
            <Route path="/hr" element={<HRHome />} />
            <Route path="/hr/employee-profiles" element={<EmployeeProfiles />} />
            <Route path="/hr/employee-profiles/:id" element={<EmployeeDetail />} />
            <Route path="/hr/visa-management" element={<VisaManagement />} />
            {/* <Route path="/hr/hiring" element={<HiringManagement />} /> */}
            <Route path="/hr/housing-management" element={<HousingManagement />} />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App
