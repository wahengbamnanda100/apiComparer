"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const express_1 = require("express");
const CompareHanlders = __importStar(require("./comparer.handler"));
const multer_1 = __importDefault(require("multer"));
const middleware_1 = require("../../middleware");
const ParamWithId_1 = require("../../interfaces/ParamWithId");
const comparer_model_1 = require("./comparer.model");
// import { AnyZodObject } from "zod";
// import { validateRequest } from "../../middleware";
// import { Compare } from "./comparer.model";
// import {Upload} from "../../interfaces/Upload";
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: "uploads/" });
router.post("/upload", upload.array("files"), CompareHanlders.uploadYaml);
router.post("/compare", (0, middleware_1.validateRequest)({ body: comparer_model_1.CompareYaml }), CompareHanlders.createCompareMd);
router.post("/compare-oas3", upload.array("files"), CompareHanlders.uploadAndCompare);
router.get("/compare/:uid", (0, middleware_1.validateRequest)({ params: ParamWithId_1.ParamsWithId }), CompareHanlders.getCompareMd);
exports.default = router;
//# sourceMappingURL=comparer.routes.js.map