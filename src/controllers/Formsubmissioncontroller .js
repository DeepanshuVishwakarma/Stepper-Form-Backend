const AppError = require("../utils/errors/error");
const { status_code } = require("../utils/statics/statics");
const {
  FormSubmissionRepository,
  FormTemplateRepository,
  UserRepository,
} = require("../repository");

const formSubmissionRepository = new FormSubmissionRepository();
const formTemplateRepository = new FormTemplateRepository();
const userRepository = new UserRepository();

// ─── Helpers ────────────────────────────────────────────────────────────────

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

/**
 * Validates a single field's value against its config.
 * Returns an error string or null if valid.
 */
function validateField(field, value) {
  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "");

  if (field.required && isEmpty) {
    return `${field.label} is required`;
  }

  // Skip further validation if value is empty and field is not required
  if (isEmpty) return null;

  const v = field.validations || {};

  if (field.type === "text") {
    const strVal = String(value);
    const numVal = Number(value);

    // minLength / maxLength for string content
    if (v.minLength !== undefined && strVal.length < v.minLength) {
      return `${field.label} must be at least ${v.minLength} characters`;
    }
    if (v.maxLength !== undefined && strVal.length > v.maxLength) {
      return `${field.label} must be at most ${v.maxLength} characters`;
    }

    // min / max for numeric content
    if (v.min !== undefined || v.max !== undefined) {
      if (isNaN(numVal)) {
        return `${field.label} must be a number`;
      }
      if (v.min !== undefined && numVal < v.min) {
        return `${field.label} must be at least ${v.min}`;
      }
      if (v.max !== undefined && numVal > v.max) {
        return `${field.label} must be at most ${v.max}`;
      }
    }
  }

  if (field.type === "select" || field.type === "radio") {
    const allowed = (field.options || []).map((o) => o.value);
    if (!allowed.includes(value)) {
      return `${field.label} has an invalid selection`;
    }
  }

  return null;
}

/**
 * Validates all fields in a step config against a provided answers map.
 * Returns an object of { fieldKey: errorString } for any invalid fields.
 */
function validateStepAnswers(stepConfig, answersMap) {
  const errors = {};
  for (const field of stepConfig.fields) {
    const value = answersMap[field.fieldKey];
    const error = validateField(field, value);
    if (error) {
      errors[field.fieldKey] = error;
    }
  }
  return errors;
}

/**
 * Builds a map of { fieldKey: value } from the submission's flat answers array
 * filtered to only the fields belonging to the given step.
 */
function buildAnswersMapForStep(answers, stepConfig) {
  const stepFieldKeys = new Set(stepConfig.fields.map((f) => f.fieldKey));
  const map = {};
  for (const answer of answers) {
    if (stepFieldKeys.has(answer.fieldKey)) {
      map[answer.fieldKey] = answer.value;
    }
  }
  return map;
}

/**
 * Merges incoming field answers into the submission's existing answers array.
 * Upserts by fieldKey.
 */
function mergeAnswers(existingAnswers, incomingFields) {
  const answersMap = {};
  for (const a of existingAnswers) {
    answersMap[a.fieldKey] = a.value;
  }
  for (const [key, val] of Object.entries(incomingFields)) {
    answersMap[key] = val;
  }
  return Object.entries(answersMap).map(([fieldKey, value]) => ({
    fieldKey,
    value,
  }));
}

/**
 * Formats a submission for list view — includes progress info.
 */
function formatSubmissionForList(submission) {
  const template = submission.template;
  const totalSteps = template?.steps?.length ?? 0;
  const completedSteps = submission.completedSteps?.length ?? 0;

  return {
    submissionId: submission._id,
    title: template?.title ?? "Unknown Form",
    status: submission.status,
    currentStep: submission.currentStep,
    progress: {
      completed: completedSteps,
      total: totalSteps,
    },
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    submittedAt: submission.submittedAt,
  };
}

// ─── Controllers ────────────────────────────────────────────────────────────

exports.listSubmissions = async (req, res, next) => {
  try {
    const { userId: rawUserId } = req.params;
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : rawUserId;

    const userIdError = requireNonEmptyString(userId, "userId");
    if (userIdError) {
      return next(new AppError(userIdError, status_code.BAD_REQUEST));
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return next(new AppError("User not found", status_code.NOT_FOUND));
    }

    const submissions = await formSubmissionRepository.findAllByUser(userId);
    const formatted = submissions.map(formatSubmissionForList);

    return res.status(status_code.SUCCESS).json({ submissions: formatted });
  } catch (err) {
    return next(err);
  }
};

exports.createSubmission = async (req, res, next) => {
  try {
    const { userId: rawUserId } = req.params;
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : rawUserId;

    const userIdError = requireNonEmptyString(userId, "userId");
    if (userIdError) {
      return next(new AppError(userIdError, status_code.BAD_REQUEST));
    }

    const { templateId: rawTemplateId } = req.body;
    const templateId =
      typeof rawTemplateId === "string" ? rawTemplateId.trim() : rawTemplateId;

    const templateIdError = requireNonEmptyString(templateId, "templateId");
    if (templateIdError) {
      return next(new AppError(templateIdError, status_code.BAD_REQUEST));
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return next(new AppError("User not found", status_code.NOT_FOUND));
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

    if (!template.steps || template.steps.length === 0) {
      return next(
        new AppError(
          "Form template has no steps configured",
          status_code.BAD_REQUEST,
        ),
      );
    }

    const submission = await formSubmissionRepository.create({
      user: userId,
      template: templateId,
      templateVersion: template.version,
      status: "draft",
      currentStep: 1,
      completedSteps: [],
      answers: [],
    });

    return res.status(status_code.CREATED).json({
      submissionId: submission._id,
      status: submission.status,
      currentStep: submission.currentStep,
      totalSteps: template.steps.length,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getSubmission = async (req, res, next) => {
  try {
    const { userId: rawUserId, submissionId: rawSubmissionId } = req.params;
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : rawUserId;
    const submissionId =
      typeof rawSubmissionId === "string"
        ? rawSubmissionId.trim()
        : rawSubmissionId;

    const userIdError = requireNonEmptyString(userId, "userId");
    if (userIdError) {
      return next(new AppError(userIdError, status_code.BAD_REQUEST));
    }

    const submissionIdError = requireNonEmptyString(
      submissionId,
      "submissionId",
    );
    if (submissionIdError) {
      return next(new AppError(submissionIdError, status_code.BAD_REQUEST));
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return next(new AppError("User not found", status_code.NOT_FOUND));
    }

    const submission = await formSubmissionRepository.findByIdAndUser(
      submissionId,
      userId,
    );
    if (!submission) {
      return next(new AppError("Submission not found", status_code.NOT_FOUND));
    }

    const template = submission.template;
    if (!template || !template.steps || template.steps.length === 0) {
      return next(
        new AppError(
          "Linked form template is broken or missing",
          status_code.INTERNAL_SERVER_ERROR,
        ),
      );
    }

    const totalSteps = template.steps.length;
    const completedSteps = submission.completedSteps ?? [];

    return res.status(status_code.SUCCESS).json({
      submission: {
        submissionId: submission._id,
        title: template.title,
        status: submission.status,
        currentStep: submission.currentStep,
        completedSteps,
        progress: {
          completed: completedSteps.length,
          total: totalSteps,
        },
        answers: submission.answers,
        steps: template.steps,
        submittedAt: submission.submittedAt,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.saveStep = async (req, res, next) => {
  try {
    const {
      userId: rawUserId,
      submissionId: rawSubmissionId,
      stepId: rawStepId,
    } = req.params;

    const userId = typeof rawUserId === "string" ? rawUserId.trim() : rawUserId;
    const submissionId =
      typeof rawSubmissionId === "string"
        ? rawSubmissionId.trim()
        : rawSubmissionId;
    const stepId = typeof rawStepId === "string" ? rawStepId.trim() : rawStepId;

    const userIdError = requireNonEmptyString(userId, "userId");
    if (userIdError) {
      return next(new AppError(userIdError, status_code.BAD_REQUEST));
    }

    const submissionIdError = requireNonEmptyString(
      submissionId,
      "submissionId",
    );
    if (submissionIdError) {
      return next(new AppError(submissionIdError, status_code.BAD_REQUEST));
    }

    const stepIdError = requireNonEmptyString(stepId, "stepId");
    if (stepIdError) {
      return next(new AppError(stepIdError, status_code.BAD_REQUEST));
    }

    const { fields } = req.body;
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      return next(
        new AppError(
          "fields must be a non-null object of fieldKey:value pairs",
          status_code.BAD_REQUEST,
        ),
      );
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return next(new AppError("User not found", status_code.NOT_FOUND));
    }

    const submission = await formSubmissionRepository.findByIdAndUser(
      submissionId,
      userId,
    );
    if (!submission) {
      return next(new AppError("Submission not found", status_code.NOT_FOUND));
    }

    if (submission.status === "completed") {
      return next(
        new AppError(
          "Cannot edit a completed submission",
          status_code.BAD_REQUEST,
        ),
      );
    }

    const template = submission.template;
    if (!template || !template.steps || template.steps.length === 0) {
      return next(
        new AppError(
          "Linked form template is broken or missing",
          status_code.INTERNAL_SERVER_ERROR,
        ),
      );
    }

    const stepConfig = template.steps.find((s) => s.stepId === stepId);
    if (!stepConfig) {
      return next(
        new AppError(
          "Step does not belong to this form template",
          status_code.BAD_REQUEST,
        ),
      );
    }

    // Only allow keys that exist in this step's fields
    const validFieldKeys = new Set(stepConfig.fields.map((f) => f.fieldKey));
    const unknownKeys = Object.keys(fields).filter(
      (k) => !validFieldKeys.has(k),
    );
    if (unknownKeys.length > 0) {
      return next(
        new AppError(
          `Unknown field keys for this step: ${unknownKeys.join(", ")}`,
          status_code.BAD_REQUEST,
        ),
      );
    }

    // Validate only the submitted fields (partial save is allowed)
    const fieldErrors = {};
    for (const field of stepConfig.fields) {
      if (!(field.fieldKey in fields)) continue; // not submitted, skip
      const error = validateField(field, fields[field.fieldKey]);
      if (error) {
        fieldErrors[field.fieldKey] = error;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(status_code.BAD_REQUEST).json({
        message: "Some fields have validation errors",
        errors: fieldErrors,
      });
    }

    // Merge answers and determine if this step is fully complete
    submission.answers = mergeAnswers(submission.answers, fields);

    const answersMapForStep = buildAnswersMapForStep(
      submission.answers,
      stepConfig,
    );
    const fullStepErrors = validateStepAnswers(stepConfig, answersMapForStep);
    const isStepComplete = Object.keys(fullStepErrors).length === 0;

    if (isStepComplete && !submission.completedSteps.includes(stepId)) {
      submission.completedSteps.push(stepId);
    } else if (!isStepComplete) {
      // Remove from completedSteps if it was previously marked done
      submission.completedSteps = submission.completedSteps.filter(
        (id) => id !== stepId,
      );
    }

    // Advance currentStep pointer if saving the current step and there's a next
    const sortedSteps = [...template.steps].sort((a, b) => a.order - b.order);
    const currentStepIndex = sortedSteps.findIndex((s) => s.stepId === stepId);
    if (
      isStepComplete &&
      currentStepIndex !== -1 &&
      submission.currentStep === stepConfig.order &&
      stepConfig.order < sortedSteps.length
    ) {
      submission.currentStep = stepConfig.order + 1;
    }

    await formSubmissionRepository.save(submission);

    return res.status(status_code.SUCCESS).json({
      message: "Step saved successfully",
      stepId,
      isStepComplete,
      completedSteps: submission.completedSteps,
      currentStep: submission.currentStep,
      progress: {
        completed: submission.completedSteps.length,
        total: template.steps.length,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.completeSubmission = async (req, res, next) => {
  try {
    const { userId: rawUserId, submissionId: rawSubmissionId } = req.params;
    console.log("completeSubmission" , rawUserId, rawSubmissionId);
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : rawUserId;
    const submissionId =
      typeof rawSubmissionId === "string"
        ? rawSubmissionId.trim()
        : rawSubmissionId;

    const userIdError = requireNonEmptyString(userId, "userId");
    if (userIdError) {
      return next(new AppError(userIdError, status_code.BAD_REQUEST));
    }

    const submissionIdError = requireNonEmptyString(
      submissionId,
      "submissionId",
    );
    if (submissionIdError) {
      return next(new AppError(submissionIdError, status_code.BAD_REQUEST));
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return next(new AppError("User not found", status_code.NOT_FOUND));
    }

    const submission = await formSubmissionRepository.findByIdAndUser(
      submissionId,
      userId,
    );
    if (!submission) {
      return next(new AppError("Submission not found", status_code.NOT_FOUND));
    }

    if (submission.status === "completed") {
      return next(
        new AppError(
          "Submission is already completed",
          status_code.BAD_REQUEST,
        ),
      );
    }

    const template = submission.template;
    if (!template || !template.steps || template.steps.length === 0) {
      return next(
        new AppError(
          "Linked form template is broken or missing",
          status_code.INTERNAL_SERVER_ERROR,
        ),
      );
    }

    // Validate all steps and all required fields
    const allErrors = {};
    for (const stepConfig of template.steps) {
      const answersMapForStep = buildAnswersMapForStep(
        submission.answers,
        stepConfig,
      );
      const stepErrors = validateStepAnswers(stepConfig, answersMapForStep);
      if (Object.keys(stepErrors).length > 0) {
        allErrors[stepConfig.stepId] = stepErrors;
      }
    }

    if (Object.keys(allErrors).length > 0) {
      return res.status(status_code.BAD_REQUEST).json({
        message:
          "Cannot complete submission. Some required fields are missing or invalid.",
        errors: allErrors,
      });
    }

    submission.status = "completed";
    submission.submittedAt = new Date();
    submission.completedSteps = template.steps.map((s) => s.stepId);

    await formSubmissionRepository.save(submission);

    return res.status(status_code.SUCCESS).json({
      message: "Submission completed successfully",
      submissionId: submission._id,
      status: submission.status,
      submittedAt: submission.submittedAt,
    });
  } catch (err) {
    return next(err);
  }
};

exports.deleteSubmission = async (req, res, next) => {
  try {
    const { userId: rawUserId, submissionId: rawSubmissionId } = req.params;
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : rawUserId;
    const submissionId =
      typeof rawSubmissionId === "string"
        ? rawSubmissionId.trim()
        : rawSubmissionId;

    const userIdError = requireNonEmptyString(userId, "userId");
    if (userIdError) {
      return next(new AppError(userIdError, status_code.BAD_REQUEST));
    }

    const submissionIdError = requireNonEmptyString(
      submissionId,
      "submissionId",
    );
    if (submissionIdError) {
      return next(new AppError(submissionIdError, status_code.BAD_REQUEST));
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return next(new AppError("User not found", status_code.NOT_FOUND));
    }

    const submission = await formSubmissionRepository.findByIdAndUser(
      submissionId,
      userId,
    );
    if (!submission) {
      return next(new AppError("Submission not found", status_code.NOT_FOUND));
    }

    await formSubmissionRepository.deleteById(submissionId);

    return res.status(status_code.SUCCESS).json({
      message: "Submission deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
};
