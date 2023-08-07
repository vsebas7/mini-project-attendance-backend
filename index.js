import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import errorHandler from "./src/middleware/error.handler.js";

dotenv.config();

const app = express();

app.use(bodyParser.json())
app.use(cors({ exposedHeaders : "Authorization" }))

import AuthRouters from "./src/controllers/authentication/routers.js"
import AttendanceRouters from "./src/controllers/attendance/routers.js"

app.use("/api/auth/", AuthRouters)
app.use("/api/attendance/", AttendanceRouters)

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));