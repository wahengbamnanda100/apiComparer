/* eslint-disable @typescript-eslint/no-explicit-any */
import $RefParser from "@apidevtools/json-schema-ref-parser";
import SwaggerParser from "@apidevtools/swagger-parser";
import fs from "fs";
import path from "path";
import swaggerDiff from "swagger-diff";
import YAML from "js-yaml";
import yaml from "yaml";
import util from "util";
// import bonsole from "bonsole";
// import { open } from "fs/promises";
// import { promisify } from "util";

export async function jsonRefResolver(mySchema: string | Buffer): Promise<any> {
	try {
		const schema = await $RefParser.dereference(mySchema);
		return schema;
	} catch (err) {
		return extractExceptionErrors(err);
	}
}

export function extractExceptionErrors(err: any): {
	status: boolean;
	data: string;
	code: number;
	message: string;
	messageCode: number;
} {
	const { name, message } = err;
	return {
		status: false,
		data: name,
		code: 400,
		message,
		messageCode: 0,
	};
}

// export async function dereferenceYAML(filePath) {
// 	try {
// 		// Read YAML file asynchronously
// 		const yamlContent = await fs.promises.readFile(filePath);

// 		// Parse YAML content into a JavaScript object
// 		const yamlObject = YAML.load(yamlContent);

// 		// Dereference the JavaScript object
// 		const dereferencedObject = await jsonRefResolver(yamlObject);

// 		// Convert the dereferenced object back to YAML format
// 		const dereferencedYAML = YAML.dump(dereferencedObject);

// 		return dereferencedYAML;
// 	} catch (error: any) {
// 		console.error("Error:", error.message);
// 		throw error; // Forward the error to the caller
// 	}
// }

export async function dereferenceYAML(yamlData: any): Promise<any> {
	try {
		// Parse YAML content into a JavaScript object
		const yamlObject = YAML.load(yamlData);

		// Dereference the JavaScript object
		const dereferencedObject = await jsonRefResolver(yamlObject);

		// console.log("yaml def", dereferencedObject.components);

		// Convert the dereferenced object back to YAML format
		// const dereferencedYAML = YAML.dump(dereferencedObject);

		// bonsole(dereferencedYAML, 5000);

		return dereferencedObject;
	} catch (error: any) {
		console.error("Error:", error.message);
		throw error; // Forward the error to the caller
	}
}

export const compareSwaggerFiles = async (oldFilePath, newFilePath) => {
	// Read the old and new Swagger files
	// const oldSwagger = fs.readFileSync(oldFilePath, "utf8");
	// const newSwagger = fs.readFileSync(newFilePath, "utf8");

	// Parse the JSON strings to objects
	const oldSwaggerObj = await SwaggerParser.parse(oldFilePath);
	const newSwaggerObj = await SwaggerParser.parse(newFilePath);

	// Perform the diffing
	return swaggerDiff(oldSwaggerObj, newSwaggerObj);
};

export async function dereferenceOAS3(filePath: string): Promise<string> {
	try {
		// Read the YAML content from the file
		const openAPIObject = await SwaggerParser.parse(filePath);

		// Dereference the OpenAPI object
		const dereferencedObject = await SwaggerParser.dereference(openAPIObject);

		// Convert the dereferenced object back to YAML format
		const dereferencedYAML = YAML.stringify(dereferencedObject);

		return dereferencedYAML;
	} catch (error: any) {
		console.error("Error in OAS3 def:", error);
		throw error; // Forward the error to the caller
	}
}

// const writeFileAsync = promisify(fs.writeFile);

// export async function dereferenceOAS3Mod(yamlData: string): Promise<string> {
// 	try {
// 		// Create the "yaml-data" folder if it doesn't exist
// 		const folderPath = path.join(__dirname, "yaml-data");
// 		if (!fs.existsSync(folderPath)) {
// 			fs.mkdirSync(folderPath);
// 		}

// 		// Generate a unique file name for the YAML data
// 		const fileName = `yaml-${Date.now()}.yaml`;
// 		const filePath = path.join(folderPath, fileName);

// 		// Write the YAML data to a new file
// 		await writeFileAsync(filePath, yamlData);

// 		// Parse the YAML content from the file
// 		const openAPIObject = await SwaggerParser.parse(filePath);

// 		// Dereference the OpenAPI object
// 		const dereferencedObject = await SwaggerParser.dereference(openAPIObject);

// 		// Convert the dereferenced object back to YAML format
// 		const dereferencedYAML = yaml.stringify(dereferencedObject);

// 		// Remove the temporary YAML file
// 		fs.unlinkSync(filePath);

// 		return dereferencedYAML;
// 	} catch (error: any) {
// 		console.error("Error in OAS3 def:", error);
// 		throw error; // Forward the error to the caller
// 	}
// }

const writeFileAsync = util.promisify(fs.writeFile);

export async function dereferenceOAS3Mod(yamlData: string): Promise<string> {
	const folderPath = path.join(__dirname, "yaml-data");
	const fileName = `yaml-${Date.now()}.yaml`;
	const filePath = path.join(folderPath, fileName);

	try {
		// Create the "yaml-data" folder if it doesn't exist
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath);
		}

		// Write the YAML data to a new file
		await writeFileAsync(filePath, yamlData);
		console.log(`YAML data written to ${filePath}`);

		// Parse the YAML content from the file
		const openAPIObject = await SwaggerParser.parse(filePath);
		console.log("YAML data parsed successfully");

		// Dereference the OpenAPI object

		const dereferencedObject = await SwaggerParser.dereference(openAPIObject);
		console.log("OpenAPI data dereferenced successfully");

		// Convert the dereferenced object back to YAML format
		const dereferencedYAML = yaml.stringify(dereferencedObject);
		console.log(
			"Dereferenced object converted to YAML format",
			dereferencedYAML
		);

		// Optional: Log the YAML string if needed
		// console.log(dereferencedYAML);

		return dereferencedYAML;
	} catch (error: any) {
		console.error("Error in dereferencing OAS3:", error);
		throw error; // Forward the error to the caller
	} finally {
		// Clean up: Remove the temporary YAML file
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			console.log(`Temporary YAML file ${filePath} deleted`);
		}
	}
}
