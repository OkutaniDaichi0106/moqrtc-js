import { z } from "zod"
import { uint62Schema } from "./integers.ts"
import { TrackDescriptorSchema } from "./track.ts"

export const DEFAULT_CATALOG_VERSION = "@gomoqt/v1"

export const CatalogInitSchema = z.object({
	version: z.string(),
	$schema: z.url().optional(),
});

export type CatalogInit = z.infer<typeof CatalogInitSchema>;
