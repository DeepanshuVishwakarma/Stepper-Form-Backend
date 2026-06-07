const AppError = require("../utils/errors/error");
const { status_code } = require("../utils/statics/statics");
const { FormTemplateRepository } = require("../repository");

const formTemplateRepository = new FormTemplateRepository();

function requireNonEmptyString(value, fieldLabel) {
  if (value === undefined || value === null) {
    return `${fieldLabel} is required`;
  }
  if (typeof value !== "string") {
    return `${fieldLabel} must be a non-empty string`;
  }
  if (value.trim() === "") {
    return `${fieldLabel} cannot be empty or whitespace only`;
  }
  return null;
}

exports.listTemplates = async (req, res, next) => {
  try {
    const templates = await formTemplateRepository.findAll();

    const formatted = templates.map((t) => ({
      templateId: t._id,
      title: t.title,
      version: t.version,
      totalSteps: t.steps.length,
      createdAt: t.createdAt,
    }));

    return res.status(status_code.SUCCESS).json({ templates: formatted });
  } catch (err) {
    return next(err);
  }
};

exports.getTemplate = async (req, res, next) => {
  try {
    const { templateId: rawTemplateId } = req.params;
    const templateId =
      typeof rawTemplateId === "string" ? rawTemplateId.trim() : rawTemplateId;

    const templateIdError = requireNonEmptyString(templateId, "templateId");
    if (templateIdError) {
      return next(new AppError(templateIdError, status_code.BAD_REQUEST));
    }

    const template = await formTemplateRepository.findById(templateId);
    if (!template) {
      return next(
        new AppError("Form template not found", status_code.NOT_FOUND),
      );
    }

    if (!template.isActive) {
      return next(
        new AppError(
          "This form template is no longer active",
          status_code.BAD_REQUEST,
        ),
      );
    }

    return res.status(status_code.SUCCESS).json({ template });
  } catch (err) {
    return next(err);
  }
};
