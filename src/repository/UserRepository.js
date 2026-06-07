const { User } = require("../models");

class UserRepository {
  async findById(userId) {
    return User.findById(userId);
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async save(user) {
    return user.save();
  }
}

module.exports = UserRepository;
