import { hash } from "bcrypt";

const plain = Deno.args[0];
const hashed = await hash(plain);
console.log(hashed);
