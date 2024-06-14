"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dereferenceOAS3Mod = exports.dereferenceOAS3 = exports.compareSwaggerFiles = exports.dereferenceYAML = exports.extractExceptionErrors = exports.jsonRefResolver = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const json_schema_ref_parser_1 = __importDefault(require("@apidevtools/json-schema-ref-parser"));
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const swagger_diff_1 = __importDefault(require("swagger-diff"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const yaml_1 = __importDefault(require("yaml"));
const util_1 = __importDefault(require("util"));
// import bonsole from "bonsole";
// import { open } from "fs/promises";
// import { promisify } from "util";
async function jsonRefResolver(mySchema) {
    try {
        const schema = await json_schema_ref_parser_1.default.dereference(mySchema);
        return schema;
    }
    catch (err) {
        return extractExceptionErrors(err);
    }
}
exports.jsonRefResolver = jsonRefResolver;
function extractExceptionErrors(err) {
    const { name, message } = err;
    return {
        status: false,
        data: name,
        code: 400,
        message,
        messageCode: 0,
    };
}
exports.extractExceptionErrors = extractExceptionErrors;
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
async function dereferenceYAML(yamlData) {
    try {
        // Parse YAML content into a JavaScript object
        const yamlObject = js_yaml_1.default.load(yamlData);
        // Dereference the JavaScript object
        const dereferencedObject = await jsonRefResolver(yamlObject);
        // console.log("yaml def", dereferencedObject.components);
        // Convert the dereferenced object back to YAML format
        // const dereferencedYAML = YAML.dump(dereferencedObject);
        // bonsole(dereferencedYAML, 5000);
        return dereferencedObject;
    }
    catch (error) {
        console.error("Error:", error.message);
        throw error; // Forward the error to the caller
    }
}
exports.dereferenceYAML = dereferenceYAML;
const compareSwaggerFiles = async (oldFilePath, newFilePath) => {
    // Read the old and new Swagger files
    // const oldSwagger = fs.readFileSync(oldFilePath, "utf8");
    // const newSwagger = fs.readFileSync(newFilePath, "utf8");
    // Parse the JSON strings to objects
    const oldSwaggerObj = await swagger_parser_1.default.parse(oldFilePath);
    const newSwaggerObj = await swagger_parser_1.default.parse(newFilePath);
    // Perform the diffing
    return (0, swagger_diff_1.default)(oldSwaggerObj, newSwaggerObj);
};
exports.compareSwaggerFiles = compareSwaggerFiles;
async function dereferenceOAS3(filePath) {
    try {
        // Read the YAML content from the file
        const openAPIObject = await swagger_parser_1.default.parse(filePath);
        // Dereference the OpenAPI object
        const dereferencedObject = await swagger_parser_1.default.dereference(openAPIObject);
        // Convert the dereferenced object back to YAML format
        const dereferencedYAML = js_yaml_1.default.stringify(dereferencedObject);
        return dereferencedYAML;
    }
    catch (error) {
        console.error("Error in OAS3 def:", error);
        throw error; // Forward the error to the caller
    }
}
exports.dereferenceOAS3 = dereferenceOAS3;
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
const writeFileAsync = util_1.default.promisify(fs_1.default.writeFile);
async function dereferenceOAS3Mod(yamlData) {
    const folderPath = path_1.default.join(__dirname, "yaml-data");
    const fileName = `yaml-${Date.now()}.yaml`;
    const filePath = path_1.default.join(folderPath, fileName);
    try {
        // Create the "yaml-data" folder if it doesn't exist
        if (!fs_1.default.existsSync(folderPath)) {
            fs_1.default.mkdirSync(folderPath);
        }
        // Write the YAML data to a new file
        await writeFileAsync(filePath, yamlData);
        console.log(`YAML data written to ${filePath}`);
        // Parse the YAML content from the file
        const openAPIObject = await swagger_parser_1.default.parse(filePath);
        console.log("YAML data parsed successfully");
        // Dereference the OpenAPI object
        const dereferencedObject = await swagger_parser_1.default.dereference(openAPIObject);
        console.log("OpenAPI data dereferenced successfully");
        // Convert the dereferenced object back to YAML format
        const dereferencedYAML = yaml_1.default.stringify(dereferencedObject);
        console.log("Dereferenced object converted to YAML format", dereferencedYAML);
        // Optional: Log the YAML string if needed
        // console.log(dereferencedYAML);
        return dereferencedYAML;
    }
    catch (error) {
        console.error("Error in dereferencing OAS3:", error);
        throw error; // Forward the error to the caller
    }
    finally {
        // Clean up: Remove the temporary YAML file
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            console.log(`Temporary YAML file ${filePath} deleted`);
        }
    }
}
exports.dereferenceOAS3Mod = dereferenceOAS3Mod;
//# sourceMappingURL=helper.js.map