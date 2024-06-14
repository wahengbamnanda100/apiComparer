"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAndCompare = exports.getCompareMd = exports.compareMd = exports.createCompareMd = exports.uploadYaml = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
const yaml_1 = __importDefault(require("yaml"));
// import bonsole from "bonsole";
const js_yaml_1 = __importDefault(require("js-yaml"));
const comparer_model_1 = require("./comparer.model");
const helper_1 = require("../../utils/helper");
// import { dereferenceYAML } from "../../utils/helper";
// import * as OpenApi from "openapi-diff";
("openapi-diff");
// import { ParamsWithId } from "../../interfaces/ParamWithId";
// import { ObjectId } from "mongodb";
dotenv_1.default.config();
const openai = new openai_1.default({
    apiKey: process.env["OPENAI_API_KEY"],
});
async function uploadYaml(req, res, next) {
    try {
        const files = [];
        if (!req.files || !Array.isArray(req.files) || req.files.length < 2) {
            // console.log(req.files);
            return res.json({ message: "Please upload two or more YAML files." });
        }
        for (const file of req.files) {
            if (!file.originalname.match(/\.(yaml|yml)$/)) {
                console.log("Please upload YAML files only.");
                return res.json({ message: "Please upload YAML files only." });
            }
        }
        await Promise.all(req.files.map(async (file, index) => {
            try {
                const fileBuffer = await fs_1.default.promises.readFile(file.path);
                const oas3DerefPromise = (0, helper_1.dereferenceYAML)(fileBuffer);
                const oas3Deref = await oas3DerefPromise;
                // const apiDereferencePromise = dereferenceYAML(yamlData.apiYaml);
                const yamlConfig = `YAML configuration ${index + 1} - ${oas3Deref.toString()}\n\n`;
                files.push(yamlConfig);
            }
            catch (err) {
                console.error(err);
                return res.json({ message: err.message });
            }
        }));
        const prompt = "You are an expert developer who can understand any complex API specifications and compare them in detail.\
    Please provide an in-depth comparison of these APIs, focusing on the endpoints, parameters, request and response bodies,\
    authentication methods, and overall structure. Identify which endpoints align the best or closest, including any partial matches.\
    Return only the snippets of the endpoints from both YAML files with all details that align the best, and nothing else.\
    Here are the APIs in YAML format - \n" + files.join("");
        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
        });
        const initialComparison = chatCompletion.choices[0].message.content;
        const promptGenerateCompare = "You are an expert developer who can understand any complex API specifications.\
      Based on the initial comparison, please provide a detailed analysis of the payloads, including all levels of the payload.\
      Compare request and response structures, data types, field names, and nested objects.\
      Identify similarities, highlight differences, and suggest all possible mappings.\
      Here is the initial comparison of the YAML API specifications - \n" +
            initialComparison;
        const chatCompletionCompare = await openai.chat.completions.create({
            messages: [{ role: "user", content: promptGenerateCompare }],
            model: "gpt-4-turbo-preview",
        });
        const markdownContent1 = chatCompletion.choices[0].message.content;
        const markdownContent = chatCompletionCompare.choices[0].message.content;
        markdownContent1 &&
            (await fs_1.default.promises.writeFile("yaml_comare_pre.md", markdownContent1));
        markdownContent &&
            (await fs_1.default.promises.writeFile("yaml_comare.md", markdownContent));
        // console.log({ markdownContent });
        if (!markdownContent) {
            return res.status(400).json({ message: "Error generating response." });
        }
        const result = {
            uid: "testUId_upload",
            compare_md: markdownContent,
        };
        const insertResult = await comparer_model_1.CompareApi.insertOne(result);
        if (!insertResult.acknowledged)
            throw new Error("Error inserting compare");
        res.status(200);
        res.setHeader("Content-disposition", "attachment; filename=comparison_report.md");
        res.setHeader("Content-Type", "text/markdown");
        res.send(markdownContent);
        // res.json({
        // 	message: "YAML compared and response generated!",
        // });
        // next()
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(400).json({ message: error.message });
        next(error);
    }
}
exports.uploadYaml = uploadYaml;
async function createCompareMd(req, res, next) {
    try {
        const files = [];
        const yamlData = req.body;
        const uid = req.body.uid;
        console.log("uid", uid);
        //* Check if UID already exists in MongoDB
        // const existingCompare = await CompareApi.findOne({ uid });
        // if (existingCompare) {
        // 	return res.status(200).json({ message: "UID already exists." });
        // }
        try {
            const orgDereferencePromise = (0, helper_1.dereferenceYAML)(yamlData.orgYaml);
            const apiDereferencePromise = (0, helper_1.dereferenceYAML)(yamlData.apiYaml);
            const [orgDereferencedYAML, apiDereferencedYAML] = await Promise.all([
                orgDereferencePromise,
                apiDereferencePromise,
            ]);
            const orgYamlString = js_yaml_1.default.dump(orgDereferencedYAML);
            const apiYamlString = js_yaml_1.default.dump(apiDereferencedYAML);
            const orgYamlConfig = `YAML configuration ${1} - ${orgYamlString}\n\n`;
            const apiYamlConfig = `YAML configuration ${2} - ${apiYamlString}\n\n`;
            files.push(orgYamlConfig);
            files.push(apiYamlConfig);
            // bonsole(`files1 : ${files[0]}`, 5000);
            // bonsole(`files2 : ${files[1]}`, 5000);
        }
        catch (error) {
            console.error(error);
            return res.status(404).json({ message: error.message });
        }
        // console.log("Files Config : ", files);
        const prompt = "You are an expert developer who can understand any complex API specifications and compare them in detail. " +
            "Please provide an in-depth comparison of these APIs, focusing on the endpoints, parameters, request and response bodies, schemas, " +
            "authentication methods, and overall structure. Identify which endpoints align the best or closest, including any partial matches. " +
            "Identify all the &ref pointers and their corresponding endpoints." +
            "Return only the snippets of the endpoints from both YAML files with all details that align the best, and nothing else. " +
            "Here are the APIs in YAML format - \n" +
            files.join("");
        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
        });
        const initialComparison = chatCompletion.choices[0].message.content;
        // bonsole(`Initial data : ${initialComparison}`, 5000);
        const promptGenerateCompare = "You are an expert developer who can understand any complex API specifications.\
		  Based on the initial comparison, please provide a detailed analysis of the payloads, including all levels of the payload.\
		  Compare request and response structures, data types, field names, and nested objects.\
		  Identify similarities, highlight differences, and suggest all possible mappings.\
		  Here is the initial comparison of the YAML API specifications - \n" +
            initialComparison;
        const chatCompletionCompare = await openai.chat.completions.create({
            messages: [{ role: "user", content: promptGenerateCompare }],
            model: "gpt-4-1106-preview",
        });
        const markdownContent1 = chatCompletion.choices[0].message.content;
        const markdownContent = chatCompletionCompare.choices[0].message.content;
        markdownContent1 &&
            (await fs_1.default.promises.writeFile("yaml_comare_pre.md", markdownContent1));
        markdownContent &&
            (await fs_1.default.promises.writeFile("yaml_comare.md", markdownContent));
        // console.log({ markdownContent });
        if (!markdownContent) {
            return res.status(400).json({ message: "Error generating response." });
        }
        // console.log(markdownContent);
        const result = {
            uid: uid,
            compare_md: markdownContent,
        };
        const insertResult = await comparer_model_1.CompareApi.insertOne(result);
        if (!insertResult.acknowledged)
            throw new Error("Error inserting compare data");
        res.status(200);
        res.json({
            message: "YAML compared and response generated!",
        });
        // next()
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(400).json({ message: error.message });
        next(error);
    }
}
exports.createCompareMd = createCompareMd;
async function compareMd(req, res, next) {
    try {
        const filePath = path_1.default.join(__dirname, "../../../yaml_comare.md");
        const fileContent = await fs_1.default.promises.readFile(filePath, "utf8");
        // Set the appropriate content type for the response
        res.setHeader("Content-Type", "text/markdown");
        // Send the file content as the response
        res.send(fileContent);
        // next();
    }
    catch (err) {
        next(err);
    }
}
exports.compareMd = compareMd;
async function getCompareMd(req, res, next) {
    try {
        const result = await comparer_model_1.CompareApi.findOne({ uid: req.params.uid });
        if (!result) {
            res.status(404);
            throw new Error(`Compare with uid "${req.params.uid}" not found`);
        }
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
exports.getCompareMd = getCompareMd;
//!_________________
const readYamlFiles = async (filePaths) => {
    const fileContents = await Promise.all(filePaths.map((filePath) => fs_1.default.promises.readFile(filePath, "utf8")));
    return fileContents.map((content) => yaml_1.default.parse(content));
};
// Function to generate the comparison prompt
const generateComparisonPrompt = (oas1, oas2) => {
    const oas1String = oas1.map((oas) => yaml_1.default.stringify(oas)).join("\n\n---\n\n");
    const oas2String = oas2.map((oas) => yaml_1.default.stringify(oas)).join("\n\n---\n\n");
    return `
I have two sets of OpenAPI Specification (OAS3) YAML files. I need to compare these files by dereferencing all the $ref pointers and finding possible mappings between their endpoints, parameters, and schemas. Here are the contents of the two sets of files:

OAS3 YAML 1:
${oas1String}

OAS3 YAML 2:
${oas2String}

Please dereference all $ref pointers in both sets of files, compare the resulting structures, and provide a detailed report in markdown format that highlights the similarities, differences, and possible mappings between endpoints, parameters, and schemas.
  `;
};
async function uploadAndCompare(req, res
// next: NextFunction
) {
    try {
        const files = req.files;
        if (!files || files.length !== 2) {
            return res.status(400).send("Please provide exactly two YAML files.");
        }
        const oasFiles1 = files.slice(0, files.length / 2).map((file) => file.path);
        const oasFiles2 = files.slice(files.length / 2).map((file) => file.path);
        const oas1 = await readYamlFiles(oasFiles1);
        const oas2 = await readYamlFiles(oasFiles2);
        console.log("fiels 1 ", oas1);
        // await Promise.all(oasFiles1.map((filePath) => fs.remove(filePath)));
        // await Promise.all(oasFiles2.map((filePath) => fs.remove(filePath)));
        const prompt = generateComparisonPrompt(oas1, oas2);
        const chatCompletionCompare = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert in OpenAPI Specification (OAS3) and YAML.",
                },
                { role: "user", content: prompt },
            ],
            model: "gpt-4-turbo-preview",
            max_tokens: 3000, // Adjust as needed
        });
        const markdownReport = chatCompletionCompare.choices[0].message?.content || "";
        res.setHeader("Content-disposition", "attachment; filename=comparison_report.md");
        res.setHeader("Content-Type", "text/markdown");
        res.send(markdownReport);
        // next();
    }
    catch (error) {
        console.log("compare error", error);
        // next(error);
        res.status(500).send("An error occurred while processing the request.");
    }
}
exports.uploadAndCompare = uploadAndCompare;
// 	const prompt =
// 		"You are an expert developer who can understand any complex API specifications and compare them in detail .\
// Give in depth comparison of these APIs and find which endpoints align the best or closest. \
// Make absolutely sure to return only the snippets of the endpoints from both yaml files with all its details which aligns the best and nothing else\
// here are the APIs in yaml format - \n " + files.join("");
// 	const chatCompletion = await openai.chat.completions.create({
// 		messages: [{ role: "user", content: prompt }],
// 		model: "gpt-4-1106-preview",
// 	});
// 	const prompt_generate_compare =
// 		"You are an expert developer who can understand any complex API specifications. \
//   Compare the payload in detail,\
//   go into all levels of the payload to do a deep comparision.\
//   Identify the all the similarities, highlight the differences and give all possible mappings for each level.\
//   Here is the yaml API specifications - \n " +
// 		chatCompletion.choices[0].message.content;
//# sourceMappingURL=comparer.handler.js.map