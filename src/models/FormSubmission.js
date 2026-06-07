const mongoose = require("mongoose");
const AnswerSchema = new mongoose.Schema(
  {
    fieldKey: {
      type: String,
      required: true,
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const FormSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormTemplate",
      required: true,
    },

    templateVersion: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
      index: true,
    },

    currentStep: {
      type: Number,
      default: 1,
    },

    completedSteps: {
      type: [String],
      default: [],
    },

    answers: {
      type: [AnswerSchema],
      default: [],
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

FormSubmissionSchema.index({
  user: 1,
  updatedAt: -1,
});

module.exports = mongoose.model(
  "FormSubmission",
  FormSubmissionSchema,
);