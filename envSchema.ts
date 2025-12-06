import { z } from "zod";

const envVariables = z.object({
  NEXT_PUBLIC_SECRET_KEY: z.string(),
  NEXT_PUBLIC_API_ACCESS_TOKEN: z.string(),
  NEXT_PUBLIC_ADMIN_API: z.string(),
  NEXT_PUBLIC_API_GATEWAY: z.string(),
});

try {
  envVariables.parse(process.env);
} catch (error) {
  console.log(error);
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}
