import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const folder = path.join(here, "../data");
const file = path.join(folder, "users.json");

async function ensure() {
  await mkdir(folder, { recursive: true });
  try { await readFile(file, "utf8"); }
  catch { await writeFile(file, "[]", "utf8"); }
}
export async function getUsers() {
  await ensure();
  return JSON.parse(await readFile(file, "utf8"));
}
export async function findUserByEmail(email) {
  return (await getUsers()).find(u => u.email === email) || null;
}
export async function findUserById(id) {
  return (await getUsers()).find(u => u.id === id) || null;
}
export async function createUser(user) {
  const users = await getUsers();
  if (users.some(u => u.email === user.email)) {
    const error = new Error("An account with this email already exists.");
    error.code = "EMAIL_EXISTS";
    throw error;
  }
  users.push(user);
  await writeFile(file, JSON.stringify(users, null, 2), "utf8");
  return user;
}
