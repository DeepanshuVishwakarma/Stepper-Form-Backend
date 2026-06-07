module.exports = {
  status_code: {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  route: {
    root: "/",
    ping: "/ping",
    api: {
      auth: "/api/auth",
      questions: "/api/questions",
      modules: "/api/modules",
      users: "/api/users",
      formTemplates: "/api/form-templates",
      formSubmissions: "/api/form-submissions",
    },
    auth: {
      signup: "/signup",
      login: "/login",
    },
    questions: {
      previous: "/previous/question",
      next: "/next",
      deepLink: "/:moduleId/:questionId",
    },
    modules: {
      root: "/",
      switch: "/switch",
      history: "/history",
    },
    users: {
      create: "/",
      updateName: "/:userId/name",
    },
    formTemplates: {
      list: "/",
      getById: "/:templateId",
    },
    formSubmissions: {
      list: "/",
      create: "/",
      getById: "/:submissionId",
      saveStep: "/:submissionId/steps/:stepId",
      complete: "/:submissionId/complete",
      delete: "/:submissionId",
    },
  },
};
