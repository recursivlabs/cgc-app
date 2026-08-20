/** CGC App project on the platform. Drives OTP email branding
 *  via the x-recursiv-app-project header - without it, auth emails
 *  go out with platform branding instead of Common Ground Campus. */
export const PROJECT_ID =
  process.env.RECURSIV_PROJECT_ID || "01a00182-7971-729c-b5da-7c396bef6d84";
