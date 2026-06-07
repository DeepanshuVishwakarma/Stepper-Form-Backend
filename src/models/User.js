const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,

  activeState: {
    moduleId: String,
    currentQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  },

  history: [
    {
      moduleId: String,
      questions: [
        {
          questionId: mongoose.Schema.Types.ObjectId,
          question: String,
          selectedOption: String,
          answeredAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  ],
});
module.exports = mongoose.model("User", userSchema);