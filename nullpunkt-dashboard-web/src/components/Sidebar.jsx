import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div
      style={{
        width: "280px",
        background: "#111827",
        padding: "25px",
        minHeight: "100vh"
      }}
    >
      <h1>Null Punkt</h1>

      <MenuItem to="/" text="🏠 Übersicht" />
      <MenuItem to="/team" text="👥 Team" />
      <MenuItem to="/warnings" text="⚠️ Teamwarns" />
      <MenuItem to="/logs" text="📋 Logs" />
      <MenuItem to="/settings" text="⚙️ Einstellungen" />
    </div>
  );
}

function MenuItem({ to, text }) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        marginTop: "10px",
        background: "#1f2937",
        padding: "12px",
        borderRadius: "10px",
        textDecoration: "none",
        color: "white"
      }}
    >
      {text}
    </Link>
  );
}