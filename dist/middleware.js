"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.errorHandler = exports.notFound = void 0;
const zod_1 = require("zod");
function notFound(req, res, next) {
    res.status(404);
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
    next(error);
}
exports.notFound = notFound;
function errorHandler(err, req, res
// next: NextFunction,
) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
    });
}
exports.errorHandler = errorHandler;
function validateRequest(validator) {
    return async (req, res, next) => {
        try {
            if (validator.params) {
                req.params = await validator.params.parseAsync(req.params);
            }
            if (validator.body) {
                if (Array.isArray(validator.body)) {
                    req.body = await Promise.all(validator.body.map((schema) => schema.parseAsync(req.body)));
                }
                else {
                    req.body = await validator.body.parseAsync(req.body);
                }
            }
            if (validator.query) {
                req.query = await validator.query.parseAsync(req.query);
            }
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(422);
            }
            next(err);
        }
    };
}
exports.validateRequest = validateRequest;
//# sourceMappingURL=middleware.js.map