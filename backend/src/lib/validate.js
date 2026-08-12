const { ZodError } = require("zod");
const { AppError } = require("./errors");

function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Merge only the parts the schema actually defined so chained
      // validators (params-only + body) don't clobber each other.
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        return next(
          new AppError("Validation failed", 422, "VALIDATION_ERROR", details),
        );
      }
      next(err);
    }
  };
}

module.exports = { validate };
