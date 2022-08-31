import { Router, RouterContext } from "oak";
import { SupabaseClient } from "supabase";
import * as s from "superstruct";
import { auth } from "~/middlewares/auth.ts";
import { json, params } from "~/middlewares/validator.ts";

const url = s.define("Url", (v) => {
	if (typeof v !== "string") {
		return false;
	}
	if (v.length > 1024) {
		return false;
	}
	try {
		new URL(v);
		return true;
	} catch {
		return false;
	}
});

const date = s.define("Date", (v) => {
	if (typeof v !== "string") {
		return false;
	}
	return new Date(v).toString() !== "Invalid Date";
});

const structsCreate = s.object({
	subject: s.size(s.string(), 1, 32),
	description: s.optional(
		s.size(s.string(), 0, 1024),
	),
	dueDate: s.optional(date),
	attatchments: s.defaulted(
		s.array(s.object({
			url: url,
			type: s.optional(
				s.size(s.string(), 0, 16),
			),
		})),
		() => [],
	),
});

export class Homework extends Router {
	supabaseClient: SupabaseClient;

	constructor(opts: {
		supabaseClient: SupabaseClient;
	}) {
		super();
		this.supabaseClient = opts.supabaseClient;
		// public endpoints
		super.get("/list", params(["date"]), (ctx) => this.#list(ctx));
		super.get("/id/:id", (ctx) => this.#id(ctx));
		// authorization required endpoints
		super.use(auth);
		super.post("/create", json(structsCreate), (ctx) => this.#create(ctx));
		super.delete("/delete", params(["id"]), (ctx) => this.#delete(ctx));
	}

	async #id(ctx: RouterContext<"/id/:id">) {
		const id = ctx.params.id;
		const { data, error } = await this.supabaseClient
			.from("homework")
			.select(`
				id,
				subject,
				description,
				dueDate:due_date,
				attatchments:homework_attatchments(url, type)
			`)
			.eq("id", id)
			.limit(1);
		if (error) {
			console.error("supabase error: ", error);
			ctx.throw(500);
		}
		if (data.length === 0) {
			ctx.response.status = 404;
		} else {
			ctx.response.body = data[0];
		}
	}

	async #list(ctx: RouterContext<"/list">) {
		const s = ctx.request.url.searchParams;
		const limit = parseInt("0" + (s.get("limit") ?? "100"));
		const page = parseInt("0" + (s.get("page") ?? "1"));
		const date = s.get("date")!;

		const { data, error } = await this.supabaseClient
			.from("homework")
			.select(`
				id,
				subject,
				description,
				dueDate:due_date,
				attatchments:homework_attatchments(url, type)
			`)
			.order("due_date")
			.range((page - 1) * limit, (page - 1) * limit + limit - 1)
			.eq("due_date", date);
		if (error) {
			console.error("supabase error: ", error);
			ctx.throw(500);
		}
		ctx.response.body = data;
		ctx.response.headers.set("Cache-Control", "public, max-age=10")
	}

	async #delete(ctx: RouterContext<"/delete">) {
		const id = ctx.request.url.searchParams.get("id");
		const { error } = await this.supabaseClient
			.from("homework")
			.delete()
			.eq("id", id);
		if (error) {
			console.error("supabase error: ", error);
			ctx.throw(500);
		}
		ctx.response.status = 204;
	}

	async #create(ctx: RouterContext<"/create">) {
		const body: s.Infer<typeof structsCreate> = ctx.state.body;
		const homework = await this.supabaseClient
			.from("homework")
			.insert([{
				subject: body.subject,
				description: body.description,
				due_date: body.dueDate,
			}]);
		if (homework.error) {
			console.error("supabase error: ", homework.error);
			ctx.throw(500);
		}

		const attatchments = body.attatchments.map((i) => {
			return {
				...i,
				homework_id: homework.data[0].id,
			};
		});
		const homeworkAttatchments = await this.supabaseClient
			.from("homework_attatchments")
			.insert(attatchments);
		if (homeworkAttatchments.error) {
			console.error("supabase error: ", homeworkAttatchments.error);
			ctx.throw(500);
		}

		ctx.response.status = 201;
		ctx.response.body = {
			...homework.data[0],
			due_date: undefined,
			dueDate: homework.data[0].due_date,
			attatchments: homeworkAttatchments.data.map((i) => {
				return {
					...i,
					id: undefined,
					homework_id: undefined,
				};
			}),
		};
	}
}
