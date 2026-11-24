import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const endpoint = "https://twbc-2026-preview.twbc.workers.dev/_build/crew.json";
const avatarPath = "/img/avatar/discord/";

async function fetchSnapshot(url) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response;
}

const groups = await (await fetchSnapshot(endpoint)).json();
const downloads = new Map();
await mkdir(`public${avatarPath}`, { recursive: true });

for (const { members } of groups) {
  for (const member of members) {
    if (!member.avatar?.startsWith("https://cdn.discordapp.com/")) continue;

    const url = member.avatar;
    const format = new URL(url).pathname.endsWith(".gif") ? "gif" : "png";
    const key = createHash("sha256").update(url).digest("hex").slice(0, 24);
    member.avatar = `${avatarPath}${key}.${format}`;
    if (!downloads.has(url)) downloads.set(url, member.avatar);
  }
}

await Promise.all(
  [...downloads].map(async ([url, path]) => {
    const response = await fetchSnapshot(url);
    await writeFile(`public${path}`, Buffer.from(await response.arrayBuffer()));
  }),
);
await writeFile(
  "app/content/.generated-crew.json",
  JSON.stringify(groups, null, 2) + "\n",
);
console.log(`Synced the Worker crew snapshot with ${downloads.size} avatars.`);
