import { useEffect, useState } from "react";

export default function Career() {

  const [roles, setRoles] = useState([]);
  const [careers, setCareers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");

  const guildId = "1511348767733842021";

  async function loadCareers() {

    const res = await fetch(
      `http://localhost:3000/api/career/${guildId}`
    );

    const data = await res.json();

    if (data.success) {
      setCareers(data.careers);
    }
  }

  useEffect(() => {

    fetch(
      `http://localhost:3000/api/roles/${guildId}`
    )
      .then(res => res.json())
      .then(data => {

        if (data.success) {
          setRoles(data.roles);
        }

      });

    loadCareers();

  }, []);

  async function addCareer() {

    if (!selectedRole) {
      return alert("Bitte Rolle auswählen");
    }

    const role =
      roles.find(
        r => r.id === selectedRole
      );

    const res = await fetch(
      "http://localhost:3000/api/career/add",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          guildId,

          roleId: role.id,

          roleName: role.name
        })
      }
    );

    const data = await res.json();

    if (data.success) {

      setSelectedRole("");

      loadCareers();

      alert("Laufbahn gespeichert");
    }

  }

  return (
    <>
      <h1>📈 Laufbahnverwaltung</h1>

      <p
        style={{
          color: "#9ca3af",
          marginBottom: "20px"
        }}
      >
        Lege die Team Laufbahn fest.
      </p>

      <div
        style={{
          background: "#111827",
          padding: "20px",
          borderRadius: "15px",
          marginBottom: "25px"
        }}
      >
        <h2>➕ Laufbahn hinzufügen</h2>

        <select
          value={selectedRole}
          onChange={(e) =>
            setSelectedRole(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            marginTop: "15px",
            marginBottom: "15px"
          }}
        >
          <option value="">
            Rolle auswählen
          </option>

          {roles.map(role => (
            <option
              key={role.id}
              value={role.id}
            >
              {role.name}
            </option>
          ))}
        </select>

        <button
          onClick={addCareer}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          Speichern
        </button>
      </div>

      <div>
        <h2>📋 Aktuelle Laufbahn</h2>

        {careers.length === 0 ? (
          <div
            style={{
              background: "#111827",
              padding: "20px",
              borderRadius: "15px",
              marginTop: "15px"
            }}
          >
            Noch keine Laufbahn vorhanden.
          </div>
        ) : (
          careers.map((career, index) => (
            <div
              key={career._id}
              style={{
                background: "#111827",
                padding: "20px",
                borderRadius: "15px",
                marginTop: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <h3>
                  {index + 1}. {career.roleName}
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px"
                }}
              >
                <button style={blueBtn}>
                  ⬆️
                </button>

                <button style={orangeBtn}>
                  ⬇️
                </button>

                <button style={redBtn}>
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

const blueBtn = {
  background: "#2563eb",
  border: "none",
  color: "white",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer"
};

const orangeBtn = {
  background: "#f97316",
  border: "none",
  color: "white",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer"
};

const redBtn = {
  background: "#ef4444",
  border: "none",
  color: "white",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer"
};