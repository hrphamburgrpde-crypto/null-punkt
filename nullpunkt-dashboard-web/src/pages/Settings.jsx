import { useEffect, useState } from "react";
import api from "../api";

export default function Settings() {

  const [data, setData] = useState(null);

  useEffect(() => {

    api
      .get("/api/team/1511098816605061362")
      .then(res => {
        setData(res.data);
      })
      .catch(console.error);

  }, []);

  return (
    <>
      <h1>Einstellungen</h1>

      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </>
  );
}