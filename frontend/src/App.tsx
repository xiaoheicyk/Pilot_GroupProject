import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router"
import NavBar from "./components/NavBar"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Info from "./pages/Info"
import Visa from "./pages/Visa"
import Housing from "./pages/Housing"

const Layout = () => {
  return (
    <>
      <NavBar />
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
          <Route element={<Layout />}>
            <Route path="/info" element={<Info />} />
            <Route path="/visa" element={<Visa />} />
            <Route path="/housing" element={<Housing />} />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App
