const { FormSubmission } = require("../models");

class FormSubmissionRepository {
  async findAllByUser(userId) {
    return FormSubmission.find({ user: userId })
      .sort({ updatedAt: -1 })
      .populate("template", "title steps");
  }

  async findById(submissionId) {
    return FormSubmission.findById(submissionId).populate(
      "template",
      "title version steps",
    );
  }

  async findByIdAndUser(submissionId, userId) {
    return FormSubmission.findOne({
      _id: submissionId,
      user: userId,
    }).populate("template", "title version steps");
  }

  async create(data) {
    const submission = new FormSubmission(data);
    return submission.save();
  }

  async save(submission) {
    return submission.save();
  }

  async deleteById(submissionId) {
    return FormSubmission.findByIdAndDelete(submissionId);
  }
}

module.exports = FormSubmissionRepository;
