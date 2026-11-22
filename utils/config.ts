// export const defaultUrl = "https://highlight-admin.vercel.app/"
export const defaultUrl = "https://cherewere.vercel.app/"
  // process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL :
  // process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`
  // : "http://localhost:3000";
 

export const allowedOrigins = [
  // "https://platform.jobbrekete.com",
  // "https://platform.jobbrekete.com",
 
  // localhost
  "http://localhost:3000",
  "http://localhost:3001",
];

export const baseUrl = {
  api: `${defaultUrl}api`,
  app: defaultUrl,
  platform: `${defaultUrl}space`,
}

 