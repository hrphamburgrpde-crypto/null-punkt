import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Logs from "./pages/Logs";
import Warnings from "./pages/Warnings";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          display: "flex",
          background: "#0b1020",
          color: "white",
          minHeight: "100vh"
        }}
      >
        <Sidebar />

        <div
          style={{
            flex: 1,
            padding: "30px"
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/team" element={<Team />} />
            <Route path="/warnings" element={<Warnings />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}