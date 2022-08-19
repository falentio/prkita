import { hash } from "bcrypt";

const plain = Deno.args[0];
console.error("plain: ", plain)
const hashed = await hash(plain);
console.log(hashed);
