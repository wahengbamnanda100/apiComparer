import { NextFunction, Request, Response } from "express";

// import ErrorResponse from "./interfaces/ErrorResponse";
import RequestValidator from "./interfaces/RequestValidator";
import { ZodError } from "zod";

export function notFound(req: Request, res: Response, next: NextFunction) {
	res.status(404);
	const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
	next(error);
}

export function errorHandler(
	err: Error,
	req: Request,
	res: Response
	// next: NextFunction,
) {
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
	res.status(statusCode);
	res.json({
		message: err.message,
		stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
	});
}

export function validateRequest(validator: RequestValidator) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (validator.params) {
				req.params = await validator.params.parseAsync(req.params);
			}
			if (validator.body) {
				if (Array.isArray(validator.body)) {
					req.body = await Promise.all(
						validator.body.map((schema) => schema.parseAsync(req.body))
					);
				} else {
					req.body = await validator.body.parseAsync(req.body);
				}
			}
			if (validator.query) {
				req.query = await validator.query.parseAsync(req.query);
			}
			next();
		} catch (err) {
			if (err instanceof ZodError) {
				res.status(422);
			}
			next(err);
		}
	};
}
