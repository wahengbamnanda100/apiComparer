/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import YAML from "yaml";
// import bonsole from "bonsole";
import yaml from "js-yaml";

import { Compare, CompareApi, CompareYamlType } from "./comparer.model";
import {
	// dereferenceOAS3,
	// dereferenceOAS3Mod,
	dereferenceYAML,
} from "../../utils/helper";

// import { dereferenceYAML } from "../../utils/helper";
// import * as OpenApi from "openapi-diff";
("openapi-diff");
// import { ParamsWithId } from "../../interfaces/ParamWithId";
// import { ObjectId } from "mongodb";

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env["OPENAI_API_KEY"],
});

export async function uploadYaml(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const files: string[] = [];

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
		await Promise.all(
			req.files.map(async (file: any, index: number) => {
				try {
					const fileBuffer = await fs.promises.readFile(file.path);

					const oas3DerefPromise = dereferenceYAML(fileBuffer);

					const oas3Deref = await oas3DerefPromise;

					// const apiDereferencePromise = dereferenceYAML(yamlData.apiYaml);

					const yamlConfig = `YAML configuration ${
						index + 1
					} - ${oas3Deref.toString()}\n\n`;
					files.push(yamlConfig);
				} catch (err: any) {
					console.error(err);
					return res.json({ message: err.message });
				}
			})
		);

		const prompt =
			"You are an expert developer who can understand any complex API specifications and compare them in detail.\
    Please provide an in-depth comparison of these APIs, focusing on the endpoints, parameters, request and response bodies,\
    authentication methods, and overall structure. Identify which endpoints align the best or closest, including any partial matches.\
    Return only the snippets of the endpoints from both YAML files with all details that align the best, and nothing else.\
    Here are the APIs in YAML format - \n" + files.join("");

		const chatCompletion = await openai.chat.completions.create({
			messages: [{ role: "user", content: prompt }],
			model: "gpt-4-turbo-preview",
		});

		const initialComparison = chatCompletion.choices[0].message.content;

		const promptGenerateCompare =
			"You are an expert developer who can understand any complex API specifications.\
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
			(await fs.promises.writeFile("yaml_comare_pre.md", markdownContent1));

		markdownContent &&
			(await fs.promises.writeFile("yaml_comare.md", markdownContent));
		// console.log({ markdownContent });

		if (!markdownContent) {
			return res.status(400).json({ message: "Error generating response." });
		}

		const result: Compare = {
			uid: "testUId_upload",
			compare_md: markdownContent,
		};

		const insertResult = await CompareApi.insertOne(result);

		if (!insertResult.acknowledged) throw new Error("Error inserting compare");

		res.status(200);

		res.setHeader(
			"Content-disposition",
			"attachment; filename=comparison_report.md"
		);
		res.setHeader("Content-Type", "text/markdown");
		res.send(markdownContent);

		// res.json({
		// 	message: "YAML compared and response generated!",
		// });

		// next()
	} catch (error: any) {
		console.error(`Error: ${error.message}`);
		res.status(400).json({ message: error.message });
		next(error);
	}
}

export async function createCompareMd(
	req: Request<{}, {}, CompareYamlType>,
	res: Response,
	next: NextFunction
) {
	try {
		const files: string[] = [];

		const yamlData = req.body;

		const uid = req.body.uid;

		console.log("uid", uid);

		//* Check if UID already exists in MongoDB
		// const existingCompare = await CompareApi.findOne({ uid });
		// if (existingCompare) {
		// 	return res.status(200).json({ message: "UID already exists." });
		// }

		try {
			const orgDereferencePromise = dereferenceYAML(yamlData.orgYaml);
			const apiDereferencePromise = dereferenceYAML(yamlData.apiYaml);
			const [orgDereferencedYAML, apiDereferencedYAML] = await Promise.all([
				orgDereferencePromise,
				apiDereferencePromise,
			]);
			const orgYamlString = yaml.dump(orgDereferencedYAML);
			const apiYamlString = yaml.dump(apiDereferencedYAML);

			const orgYamlConfig = `YAML configuration ${1} - ${orgYamlString}\n\n`;
			const apiYamlConfig = `YAML configuration ${2} - ${apiYamlString}\n\n`;

			files.push(orgYamlConfig);
			files.push(apiYamlConfig);
			// bonsole(`files1 : ${files[0]}`, 5000);
			// bonsole(`files2 : ${files[1]}`, 5000);
		} catch (error: any) {
			console.error(error);
			return res.status(404).json({ message: error.message });
		}

		// console.log("Files Config : ", files);

		const prompt =
			"You are an expert developer who can understand any complex API specifications and compare them in detail. " +
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

		const promptGenerateCompare =
			"You are an expert developer who can understand any complex API specifications.\
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
			(await fs.promises.writeFile("yaml_comare_pre.md", markdownContent1));

		markdownContent &&
			(await fs.promises.writeFile("yaml_comare.md", markdownContent));
		// console.log({ markdownContent });

		if (!markdownContent) {
			return res.status(400).json({ message: "Error generating response." });
		}

		// console.log(markdownContent);

		const result: Compare = {
			uid: uid,
			compare_md: markdownContent,
		};

		const insertResult = await CompareApi.insertOne(result);

		if (!insertResult.acknowledged)
			throw new Error("Error inserting compare data");

		res.status(200);

		res.json({
			message: "YAML compared and response generated!",
		});

		// next()
	} catch (error: any) {
		console.error(`Error: ${error.message}`);
		res.status(400).json({ message: error.message });
		next(error);
	}
}

export async function compareMd(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const filePath = path.join(__dirname, "../../../yaml_comare.md");
		const fileContent = await fs.promises.readFile(filePath, "utf8");

		// Set the appropriate content type for the response
		res.setHeader("Content-Type", "text/markdown");

		// Send the file content as the response
		res.send(fileContent);

		// next();
	} catch (err) {
		next(err);
	}
}

export async function getCompareMd(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const result = await CompareApi.findOne({ uid: req.params.uid });
		if (!result) {
			res.status(404);
			throw new Error(`Compare with uid "${req.params.uid}" not found`);
		}
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

//!_________________

const readYamlFiles = async (filePaths: string[]): Promise<any[]> => {
	const fileContents = await Promise.all(
		filePaths.map((filePath) => fs.promises.readFile(filePath, "utf8"))
	);
	return fileContents.map((content) => YAML.parse(content));
};
// Function to generate the comparison prompt
const generateComparisonPrompt = (oas1: any[], oas2: any[]) => {
	const oas1String = oas1.map((oas) => YAML.stringify(oas)).join("\n\n---\n\n");
	const oas2String = oas2.map((oas) => YAML.stringify(oas)).join("\n\n---\n\n");
	return `
I have two sets of OpenAPI Specification (OAS3) YAML files. I need to compare these files by dereferencing all the $ref pointers and finding possible mappings between their endpoints, parameters, and schemas. Here are the contents of the two sets of files:

OAS3 YAML 1:
${oas1String}

OAS3 YAML 2:
${oas2String}

Please dereference all $ref pointers in both sets of files, compare the resulting structures, and provide a detailed report in markdown format that highlights the similarities, differences, and possible mappings between endpoints, parameters, and schemas.
  `;
};

export async function uploadAndCompare(
	req: Request,
	res: Response
	// next: NextFunction
) {
	try {
		const files = req.files as Express.Multer.File[];

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
					content:
						"You are an expert in OpenAPI Specification (OAS3) and YAML.",
				},
				{ role: "user", content: prompt },
			],
			model: "gpt-4-turbo-preview",
			max_tokens: 3000, // Adjust as needed
		});

		const markdownReport =
			chatCompletionCompare.choices[0].message?.content || "";

		res.setHeader(
			"Content-disposition",
			"attachment; filename=comparison_report.md"
		);
		res.setHeader("Content-Type", "text/markdown");
		res.send(markdownReport);

		// next();
	} catch (error) {
		console.log("compare error", error);
		// next(error);
		res.status(500).send("An error occurred while processing the request.");
	}
}

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
