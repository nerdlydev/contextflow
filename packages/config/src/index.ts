import { z } from "zod";

/**
 * Zod schema for validating required environment variables.
 * Fails loudly if any required variable is missing or malformed.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),

  // Primary Model Provider: NVIDIA NIM
  NVIDIA_API_KEY: z.string().optional(),
  MODEL_NAME: z.string().default("meta/llama-3.2-11b-vision-instruct"),
  MODEL_URL: z.string().default("https://integrate.api.nvidia.com/v1"),

  // Alternative Provider: OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
});

/**
 * Parsed and validated environment configuration.
 * Throws a ZodError at startup if validation fails.
 */
function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const config = parseEnv();

export type Config = typeof config;
