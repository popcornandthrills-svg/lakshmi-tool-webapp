import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, ".next", "static");
const targetRoot = path.join(root, ".next", "standalone", ".next");
const target = path.join(targetRoot, "static");

await mkdir(targetRoot, { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
