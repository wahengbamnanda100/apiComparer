import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import bodyParser from "body-parser";

import * as middlewares from "./middleware";
// import uploadRoutes from "./routes/yaml-routes";
import api from "./api";

dotenv.config();

const app = express();
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;
app.use(bodyParser.json({ limit: "50mb" }));
app.use(morgan("dev"));
app.use(helmet());
app.use(
	cors({
		origin: "*", // Allow all origins. Replace '*' with specific origins if needed.
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		// allowedHeaders: ["Content-Type", "Authorization"],
	})
);
app.use(express.json());

app.get("/", (req, res) => {
	res.send("Hello this is a comparer api");
});

// app.use("/", uploadRoutes);
app.use("/api/v1", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

app.listen(port, () => {
	return console.log(`Server listening at port:${port} 🥳`);
});
