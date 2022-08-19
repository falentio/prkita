import { hashSync } from "bcrypt";

const plain = Deno.args[0];
console.error("plain: ", plain)
const hashed = hashSync(plain);
console.log(hashed);
