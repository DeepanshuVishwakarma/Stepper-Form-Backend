const AppError = require("../utils/errors/error");
const { status_code } = require("../utils/statics/statics");
const { UserRepository } = require("../repository");

const userRepository = new UserRepository();

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

exports.createUser = async (req, res, next) => {
  try {
    const { name: rawName } = req.body;
    const name = typeof rawName === "string" ? rawName.trim() : rawName;

    const nameError = requireNonEmptyString(name, "name");
    if (nameError) {
      return next(new AppError(nameError, status_code.BAD_REQUEST));
    }

    const user = await userRepository.create({ username: name });

    return res.status(status_code.CREATED).json({
      user: {
        id: user._id,
        name: user.username,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateUserName = async (req, res, next) => {
  try {
    const { userId: rawUserId } = req.params;
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : rawUserId;

    const userIdError = requireNonEmptyString(userId, "userId");
    if (userIdError) {
      return next(new AppError(userIdError, status_code.BAD_REQUEST));
    }

    const { name: rawName } = req.body;
    const name = typeof rawName === "string" ? rawName.trim() : rawName;

    const nameError = requireNonEmptyString(name, "name");
    if (nameError) {
      return next(new AppError(nameError, status_code.BAD_REQUEST));
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return next(new AppError("User not found", status_code.NOT_FOUND));
    }

    user.username = name;
    await user.save();

    return res.status(status_code.SUCCESS).json({
      user: {
        id: user._id,
        name: user.username,
      },
    });
  } catch (err) {
    return next(err);
  }
};
