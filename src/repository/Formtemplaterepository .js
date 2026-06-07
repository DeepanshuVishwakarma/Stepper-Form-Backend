const { FormTemplate } = require("../models");

class FormTemplateRepository {
  async findAll() {
    return FormTemplate.find({ isActive: true }).select(
      "title version steps createdAt",
    );
  }

  async findById(templateId) {
    return FormTemplate.findById(templateId);
  }
}

module.exports = FormTemplateRepository;
