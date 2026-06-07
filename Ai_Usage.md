# AI Usage Documentation

## 1. AI Tools Used

- **Claude , Cursor**

---

## 2. Prompts I Gave

**Project Setup & Standards**

- "follow my existing coding standards, don't change anything about the pattern — same error handling, same response shape, same way of organizing controllers"
- "no hardcoding anywhere — all status codes, route strings, everything should come from a centralized statics file"
- "use repository pattern, all db queries go through repository classes, controllers should not touch mongoose directly"
- "centralized error handling — use the AppError class and always pass errors to next(), never res.send() an error directly"

**Feature Implementation**

- "i have these models and this project structure, write me controllers and routes for form template and form submission — i need create submission, save draft, update step, complete submission, list submissions, get single submission, delete submission"
- "all input should be validated before any db call — required fields, type checks, trim strings"
- "saveStep should allow partial saves, only validate the fields being submitted, but only mark a step complete when all its required fields are filled"
- "completeSubmission should re-validate every step and every required field independently, don't trust completedSteps array alone"
- "write a user repository for findById, create, save — same structure as the other repositories"
- "update statics.js with all the new routes, keep the same structure as existing routes object"
- "update app.js to register new routes, scope submission routes under /api/users/:userId/submissions"

---

## 3. What I Modified from AI Output

- Adjusted response shapes in controllers to match what my frontend was already expecting
- Changed color values in the dark mode select fix to match my existing Tailwind theme
- Fixed the controllers export — import paths didn't match my actual file structure
- Reviewed all validation logic in `saveStep` and `completeSubmission` manually and tweaked edge case handling

---



## 4. What AI Got Wrong

- **Dark mode select fix** — Claude first suggested `dark:bg-transparent` on the select element. Native `<select>` dropdowns are rendered by the browser OS-level and ignore transparency, so the background stayed white. Had to use an explicit `dark:bg-gray-900` instead.
- **Complete API 400 error** — Claude's first suggestion was to just not send a body on the POST request. The real issue was that my HTTP utility was always attaching a body and serializing `undefined` as the string `"null"`, which crashed Express's JSON parser before the request even reached the route handler. Claude got to the right answer after I shared the exact error but missed it initially.
- **Controllers index** — generated barrel file referenced a file path that didn't exist in my structure, caused an immediate import error on server start.

---

## 5. How I Verified Correctness

- Tested all endpoints manually — create user, list templates, create/save/complete/delete submissions
- Refreshed mid-form to confirm draft persistence worked correctly
- Tested required field validation by submitting incomplete steps and checking field-level errors returned
- Toggled dark mode and inspected computed styles in DevTools to confirm select colors were correct
- Hard refreshed the stepper page multiple times to confirm the flash bug was gone

