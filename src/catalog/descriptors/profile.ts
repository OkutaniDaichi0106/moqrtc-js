import { z } from "zod"
import { uint8Schema, uint53Schema } from "../integers.ts"
import { ContainerSchema } from "../container.ts"
import { TrackDescriptorSchema } from "../track.ts"

export const ProfileTrackSchema = TrackDescriptorSchema.extend({
	schema: z.literal('profile'),
	config: z.object({
		id: z.string(),
	}),
});

export type ProfileTrackDescriptor = z.infer<typeof ProfileTrackSchema>;