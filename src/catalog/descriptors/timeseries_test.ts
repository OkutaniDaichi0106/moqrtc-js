import { assertEquals, assert } from "@std/assert";
import { TimeseriesTrackSchema } from './timeseries.ts';

const createMeasurements = () => new Map([
	['temperature', {
		type: 'temperature',
		unit: 'celsius',
		interval: 1,
		min: 0,
		max: 100,
	}],
]);

const createValidDescriptor = () => ({
	name: 'timeseries-temp',
	priority: 2,
	schema: 'timeseries' as const,
	config: {
		measurements: createMeasurements(),
	},
	dependencies: ['sensor-stream'],
});

Deno.test("TimeseriesTrackSchema", async (t) => {
	await t.step("accepts a valid timeseries descriptor", () => {
		const parsed = TimeseriesTrackSchema.parse(createValidDescriptor());
		const temp = parsed.config.measurements.get('temperature');

		assert(temp);
		assertEquals(temp.type, 'temperature');
		assertEquals(temp.unit, 'celsius');
		assertEquals(temp.interval, 1);
		assertEquals(temp.min, 0);
		assertEquals(temp.max, 100);
	});

	await t.step("rejects descriptors with non-map measurements", () => {
		const result = TimeseriesTrackSchema.safeParse({
			...createValidDescriptor(),
			config: {
				measurements: { temperature: createMeasurements().get('temperature') },
			},
		});

		assertEquals(result.success, false);
	});

	await t.step("rejects measurements with invalid interval", () => {
		const invalidMeasurements = new Map([
			['temperature', {
				type: 'temperature',
				unit: 'celsius',
				interval: 0,
			}],
		]);

		const result = TimeseriesTrackSchema.safeParse({
			...createValidDescriptor(),
			config: {
				measurements: invalidMeasurements,
			},
		});

		assertEquals(result.success, false);
		if (!result.success) {
			assert(result.error.issues[0].path.includes('interval'));
		}
	});
});
