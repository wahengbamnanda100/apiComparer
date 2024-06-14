"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/ban-types */
const express_1 = __importDefault(require("express"));
const comparer_routes_1 = __importDefault(require("../api/comparer/comparer.routes"));
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.json({
        message: "API - 👋🌎🌍🌏",
    });
});
router.get("/test", (req, res) => {
    res.json({
        message: "API - 👋🌎🌍🌏🚀⚡⚡🏅🚨",
    });
});
router.use("/", comparer_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map