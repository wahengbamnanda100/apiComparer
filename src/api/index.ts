/* eslint-disable @typescript-eslint/ban-types */
import express from "express";

import MessageResponse from "../interfaces/MessageResponse";
import comparer from "../api/comparer/comparer.routes";

const router = express.Router();

router.get<{}, MessageResponse>("/", (req, res) => {
	res.json({
		message: "API - 👋🌎🌍🌏",
	});
});

router.get<{}, MessageResponse>("/test", (req, res) => {
	res.json({
		message: "API - 👋🌎🌍🌏🚀⚡⚡🏅🚨",
	});
});

router.use("/", comparer);

export default router;
