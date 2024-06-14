/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";

import * as CompareHanlders from "./comparer.handler";
import multer from "multer";
import { validateRequest } from "../../middleware";
import { ParamsWithId } from "../../interfaces/ParamWithId";
import { CompareYaml } from "./comparer.model";
// import { AnyZodObject } from "zod";
// import { validateRequest } from "../../middleware";
// import { Compare } from "./comparer.model";
// import {Upload} from "../../interfaces/Upload";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.array("files"), CompareHanlders.uploadYaml);

router.post(
	"/compare",
	validateRequest({ body: CompareYaml }),
	CompareHanlders.createCompareMd
);

router.post(
	"/compare-oas3",
	upload.array("files"),
	CompareHanlders.uploadAndCompare
);

router.get(
	"/compare/:uid",
	validateRequest({ params: ParamsWithId }),
	CompareHanlders.getCompareMd
);

export default router;
