import "std/dotenv/load.ts";
import { Application, isHttpError, Router } from "oak";
import { createClient, SupabaseClient } from "supabase";
import { auth, login } from "./middlewares/auth.ts";
import { Homework } from "./services/homework/homework.ts";

const supabaseClient: SupabaseClient = createClient(
	Deno.env.get("SUPABASE_URL"),
	Deno.env.get("SUPABASE_KEY"),
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

app.addEventListener("error", (evt) => {
	if (evt.error.status < 500) {
		return;
	}
	console.error(evt.error);
});
app.use(async (ctx, next) => {
	const h = ctx.response.headers;
	h.set("I-Love-You", "Abelia Narindi Agsya");
	h.set("Cache-Control", "private, no-store, max-age=0");
	h.set("Access-Control-Allow-Origin", "*");
	await next();
});
app.use(r.routes());

if (import.meta.main) {
	const port = +(Deno.env.get("PORT") || 8080);
	console.log("listening on port: " + port);
	app.listen({
		port,
	});
}
