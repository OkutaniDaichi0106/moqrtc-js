import { z } from "zod"
import { uint8Schema, uint62Schema } from "../integers.ts"
import { ContainerSchema } from "../container.ts"
import { TrackDescriptorSchema } from "../track.ts"

export const CaptionsTrackSchema = TrackDescriptorSchema.extend({
	schema: z.literal('captions'),
	dependencies: z.array(z.string().min(1)).min(1), // Must depend on a audio or video track
});

export type CaptionsTrackDescriptor = z.infer<typeof CaptionsTrackSchema>;