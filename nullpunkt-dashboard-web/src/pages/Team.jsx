export default function Team() {
const [members, setMembers] = useState([]);
import { useEffect, useState } from "react";
  useEffect(() => {

  fetch(
    "http://localhost:3000/api/team/1511348767733842021"
  )
    .then(res => res.json())
    .then(data => {

      if (data.success) {
        setMembers(data.members);
      }

    });

}, []);

  return (
    <>
      <h1>👥 Teamverwaltung</h1>

      <p
        style={{
          color: "#9ca3af",
          marginBottom: "25px"
        }}
      >
        Verwalte dein Team direkt über das Dashboard.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "15px",
          marginBottom: "25px"
        }}
      >
        <StatCard title="42" subtitle="Teammitglieder" />
        <StatCard title="3" subtitle="Manager" />
        <StatCard title="12" subtitle="Aktionen heute" />
      </div>

      <button
        style={{
          background: "#2563eb",
          border: "none",
          color: "white",
          padding: "12px 20px",
          borderRadius: "10px",
          cursor: "pointer",
          marginBottom: "25px"
        }}
      >
        ➕ Teammitglied hinzufügen
      </button>

      <input
        placeholder="Teammitglied suchen..."
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          background: "#111827",
          color: "white",
          marginBottom: "25px"
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
          gap: "20px"
        }}
      >
        {members.map(member => (
          <div
            key={member.id}
            style={{
              background: "#111827",
              borderRadius: "16px",
              padding: "20px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px"
              }}
            >
              <img
                src={member.avatar}
                alt={member.username}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%"
                }}
              />

              <div>
                <h3>{member.username}</h3>

                <span
                  style={{
                    background:
                      member.roles?.[0]?.name || "Keine Rolle" === "Manager"
                        ? "#f59e0b"
                        : member.roles?.[0]?.name || "Keine Rolle" === "Moderator"
                        ? "#2563eb"
                        : "#10b981",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "12px"
                  }}
                >
                  {member.role}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "15px",
                color: "#9ca3af"
              }}
            >
              Teamwarns: {member.warns}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: "10px",
                marginTop: "20px"
              }}
            >
              <button style={greenBtn}>⬆️ Uprank</button>

              <button style={orangeBtn}>⬇️ Downrank</button>

              <button style={yellowBtn}>⚠️ Warn</button>

              <button style={redBtn}>🚫 Entfernen</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StatCard({ title, subtitle }) {
  return (
    <div
      style={{
        background: "#111827",
        padding: "20px",
        borderRadius: "15px",
        textAlign: "center"
      }}
    >
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

const greenBtn = {
  background: "#10b981",
  border: "none",
  padding: "10px",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer"
};

const orangeBtn = {
  background: "#f97316",
  border: "none",
  padding: "10px",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer"
};

const yellowBtn = {
  background: "#eab308",
  border: "none",
  padding: "10px",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer"
};

const redBtn = {
  background: "#ef4444",
  border: "none",
  padding: "10px",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer"
};