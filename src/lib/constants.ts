/** CGC App project on the platform. Drives OTP email branding
 *  via the x-recursiv-app-project header — without it, auth emails
 *  go out with platform branding instead of Common Ground Campus. */
export const PROJECT_ID =
  process.env.RECURSIV_PROJECT_ID || "01a0014f-254f-748d-96f8-945ecba4ce18";
