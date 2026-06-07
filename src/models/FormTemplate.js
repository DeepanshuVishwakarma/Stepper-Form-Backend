const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const ValidationSchema = new mongoose.Schema(
  {
    minLength: Number,
    maxLength: Number,

    min: Number,
    max: Number,
  },
  { _id: false },
);

const FieldSchema = new mongoose.Schema(
  {
    fieldKey: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "select", "radio"],
      required: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    options: {
      type: [OptionSchema],
      default: [],
    },

    validations: {
      type: ValidationSchema,
      default: {},
    },
  },
  { _id: false },
);

const StepSchema = new mongoose.Schema(
  {
    stepId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    order: {
      type: Number,
      required: true,
    },

    fields: {
      type: [FieldSchema],
      default: [],
    },
  },
  { _id: false },
);

const FormTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    version: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    steps: {
      type: [StepSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("FormTemplate", FormTemplateSchema);