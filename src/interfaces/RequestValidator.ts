import { AnyZodObject } from "zod";

export default interface RequestValidator {
	body?: AnyZodObject | AnyZodObject[];
	params?: AnyZodObject;
	query?: AnyZodObject;
}
