const router = require("express").Router({ mergeParams: true });
const { route } = require("../utils/statics/statics");
const {
  listSubmissions,
  createSubmission,
  getSubmission,
  saveStep,
  completeSubmission,
  deleteSubmission,
} = require("../controllers");

// All routes are scoped under /api/users/:userId/submissions
router.get(route.formSubmissions.list, listSubmissions);
router.post(route.formSubmissions.create, createSubmission);
router.get(route.formSubmissions.getById, getSubmission);
router.patch(route.formSubmissions.saveStep, saveStep);
router.post(route.formSubmissions.complete,  completeSubmission);
router.delete(route.formSubmissions.delete, deleteSubmission);

module.exports = router;
