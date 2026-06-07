const router = require("express").Router();
const { route } = require("../utils/statics/statics");
const { createUser, updateUserName } = require("../controllers");

router.post(route.users.create, createUser);
router.patch(route.users.updateName, updateUserName);

module.exports = router;
