export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    //params: req.params,
    //query: req.query,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  req.validated = result.data;
  next();
};
const formatIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatIssues(result.error.issues),
    });
  }

  req.body = result.data;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatIssues(result.error.issues),
    });
  }

  req.validatedQuery = result.data;
  next();
};