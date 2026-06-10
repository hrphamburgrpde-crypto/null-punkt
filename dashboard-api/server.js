require("dotenv").config();
const membersRoute = require("./routes/members");
app.use("/api/members", membersRoute);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const teamRoute = require("./routes/team");
const careerRoute = require("./routes/career");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/team", teamRoute);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB verbunden"))
.catch(console.error);

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "Null Punkt Team API"
    });
});

app.listen(3000, () => {
    console.log("✅ API läuft auf Port 3000");
});