const router = require("express").Router();
const { route } = require("../utils/statics/statics");
const { listTemplates, getTemplate } = require("../controllers");

router.get(route.formTemplates.list, listTemplates);
router.get(route.formTemplates.getById, getTemplate);

module.exports = router;
