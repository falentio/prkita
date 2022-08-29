import "std/dotenv/load.ts";
import { Application, Router } from "oak";
import { createClient, SupabaseClient } from "supabase";
import { auth, login } from "./middlewares/auth.ts";
import { Homework } from "./services/homework/homework.ts";

const supabaseClient: SupabaseClient = createClient(
	Deno.env.get("SUPABASE_URL") as string,
	Deno.env.get("SUPABASE_KEY") as string,
	{ fetch },
);
const homework = new Homework({ supabaseClient }).routes();

const r = new Router();
r.use("/homework", homework);
r.get("/auth/login", login);
r.get("/auth/test", auth, (ctx) => {
	ctx.response.status = 204;
});

export const app = new Application({
	logErrors: false,
	proxy: Deno.env.get("PROXY") !== undefined,
});

app.use(async (ctx, next) => {
	const h = ctx.response.headers;
	h.set("I-Love-You", "Abelia Narindi Agsya");
	h.set("Access-Control-Allow-Origin", "*");
	h.set("Access-Control-Allow-Methods", "*");
	h.set("Access-Control-Allow-Headers", "*");
	h.set("Access-Control-Max-Age", "86400");
	h.set("Cache-Control", "private, no-store, max-age=0");
	if (ctx.request.method == "OPTIONS") {
		ctx.response.status = 204
		return
	}
	try {
		await next()
	} catch (e) {
		if (e.status < 500) {
			return;
		}
		throw e
	}
});
app.use(r.routes());

if (import.meta.main) {
	const port = +(Deno.env.get("PORT") || 8080);
	console.log("listening on port: " + port);
	app.listen({
		port,
	});
}
