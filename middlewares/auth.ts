import { composeMiddleware, Context } from "oak";
import { compareSync } from "bcrypt";
import { jwtVerify, SignJWT } from "jose";
import { params } from "./validator.ts";

const users = {} as Record<string, string>;

for (const [user, password] of Object.entries(Deno.env.toObject())) {
	if (!user.startsWith("USER_")) {
		continue;
	}
	users[user.slice(5).toLowerCase()] = password;
}

console.log("users: ");
Object.keys(users).map((user) => console.log(user, users[user]));

const secret = new TextEncoder().encode(
	Deno.env.get("JWT_SECRET") || "Abelia Narindi A.",
);
const issuer = Deno.env.get("JWT_ISSUER") || "prkita";

export const auth = async (ctx: Context, next: () => Promise<unknown>) => {
	const authorization = ctx.request.headers.get("Authorization");
	if (!authorization) {
		ctx.throw(401, "authorization required");
	}

	const [type, token] = authorization.split(" ");
	if (type !== "Bearer") {
		ctx.throw(400, "authorization header must be type of Bearer");
	}

	ctx.state.user = await jwtVerify(token, secret, {
		issuer,
		algorithms: ["HS384"],
		audience: Object.keys(users),
		maxTokenAge: 60 * 60, // 1 Hour
	}).catch(() => {
		return null;
	});

	if (!ctx.state.user) {
		ctx.throw(401, "invalid token value");
	}

	await next();
};

export const login = composeMiddleware([
	params(["username", "password"]),
	async (ctx) => {
		const username = ctx.request.url.searchParams.get("username")!;
		const password = ctx.request.url.searchParams.get("password")!;
		if (!(username && password)) {
			ctx.throw(400, "invalid body");
		}

		const passwordHash = users[username];
		if (!passwordHash) {
			ctx.throw(401, "invalid user");
		}

		const ok = compareSync(password, passwordHash);
		if (!ok) {
			ctx.throw(401, "invalid password");
		}

		const token = await new SignJWT({})
			.setProtectedHeader({ alg: "HS384" })
			.setIssuedAt()
			.setIssuer(issuer)
			.setSubject(username)
			.setAudience(username)
			.sign(secret);

		ctx.response.body = {
			token,
		};
	},
]);
