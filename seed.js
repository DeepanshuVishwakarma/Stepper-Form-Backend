require("dotenv").config();
const connectDB = require("./src/config/db");
const { FormTemplate } = require("./src/models");

const sportsEventTemplate = {
  title: "Sports Event Registration",
  version: 1,
  steps: [
    {
      stepId: "personalDetails",
      title: "Personal Details",
      order: 1,
      fields: [
        {
          fieldKey: "fullName",
          label: "Full Name",
          type: "text",
          required: true,
          validations: { minLength: 3, maxLength: 100 },
        },
        {
          fieldKey: "age",
          label: "Age",
          type: "text",
          required: true,
          validations: { min: 10, max: 100 },
        },
        {
          fieldKey: "gender",
          label: "Gender",
          type: "select",
          required: true,
          options: [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Other", value: "other" },
          ],
        },
      ],
    },
    {
      stepId: "sportDetails",
      title: "Sport Details",
      order: 2,
      fields: [
        {
          fieldKey: "sport",
          label: "Sport",
          type: "radio",
          required: true,
          options: [
            { label: "Cricket", value: "cricket" },
            { label: "Football", value: "football" },
            { label: "Basketball", value: "basketball" },
          ],
        },
        {
          fieldKey: "experienceLevel",
          label: "Experience Level",
          type: "select",
          required: true,
          options: [
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Pro", value: "pro" },
          ],
        },
        {
          fieldKey: "competitionGoal",
          label: "Competition Goal",
          type: "radio",
          required: true,
          options: [
            { label: "Fun Participation", value: "fun" },
            { label: "Skill Improvement", value: "improvement" },
            { label: "Competitive Play", value: "competitive" },
          ],
        },
      ],
    },
    {
      stepId: "availability",
      title: "Availability",
      order: 3,
      fields: [
        {
          fieldKey: "venue",
          label: "Preferred Venue",
          type: "select",
          required: true,
          options: [
            { label: "Stadium A", value: "stadiumA" },
            { label: "Stadium B", value: "stadiumB" },
            { label: "Stadium C", value: "stadiumC" },
          ],
        },
        {
          fieldKey: "timeSlot",
          label: "Preferred Time Slot",
          type: "radio",
          required: true,
          options: [
            { label: "Morning", value: "morning" },
            { label: "Afternoon", value: "afternoon" },
            { label: "Evening", value: "evening" },
          ],
        },
        {
          fieldKey: "notes",
          label: "Additional Notes",
          type: "text",
          required: false,
        },
      ],
    },
  ],
};

async function seed() {
  try {
    await connectDB();

    const existing = await FormTemplate.findOne({
      title: sportsEventTemplate.title,
    });
    if (existing) {
      console.log("Template already exists, skipping seed");
      process.exit(0);
    }

    await FormTemplate.create(sportsEventTemplate);
    console.log("Template seeded");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
