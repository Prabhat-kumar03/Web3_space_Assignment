
import React from "react";
import Navbar from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route exact path="/login" element={<Login/>}></Route>
        <Route exact path="/signup" element={<SignUp/>}></Route>
        <Route exact path="/dashboard" element={<Dashboard/>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;



// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Home from './components/Home';
// import Navbar from './components/Navbar';
// import SignUp from './components/SignUp';
// import Login from './components/Login';
// import ProtectedRoute from './components/ProtectedRoute';
// import Dashboard from './pages/Dashboard';
// import Profile from './pages/Profile';
// import DashboardLayout from './components/DashboardLayout';

// function App() {
//   return (
//     <Router>
//       <Navbar />
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<SignUp />} />

//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute>
//               <DashboardLayout>
//                 <Dashboard />
//               </DashboardLayout>
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/profile"
//           element={
//             <ProtectedRoute>
//               <DashboardLayout>
//                 <Profile />
//               </DashboardLayout>
//             </ProtectedRoute>
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;





