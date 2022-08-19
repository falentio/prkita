import { BodyOptions, Context } from "oak";
import { Struct, validate } from "superstruct";

// deno-lint-ignore no-explicit-any
export function json(s: Struct<any>, opts?: BodyOptions<"json">) {
	return async (ctx: Context, next: () => Promise<unknown>) => {
		const body = ctx.request.body(opts);
		if (body.type !== "json") {
			ctx.throw(400, "body content type must be application/json");
		}
		const value = await body.value.catch(() => {
			ctx.throw(400, "failed to parse body");
		});
		const [err, v] = validate(value, s, { coerce: true });
		if (err) {
			ctx.throw(400, `body: invalid value for "${err.key}"`);
		}
		ctx.state.body = v;
		await next();
	};
}

export function params(fields: string[]) {
	return async (ctx: Context, next: () => Promise<unknown>) => {
		const s = ctx.request.url.searchParams;
		for (const f of fields) {
			if (s.get(f) === null) {
				ctx.throw(400, `params: "${f}" is required`);
			}
		}

		await next();
	};
}
