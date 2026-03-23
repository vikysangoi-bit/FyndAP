// Static deploy stub — no Base44 backend needed
export const base44 = {
  auth: {
    me: () => Promise.reject(new Error('No backend')),
    logout: () => {},
    redirectToLogin: () => {}
  },
  appLogs: {
    logUserInApp: () => Promise.resolve()
  }
};
