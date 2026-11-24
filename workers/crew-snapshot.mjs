import groups from "../app/content/crew.json" with { type: "json" };

const snapshotPath = "/_build/crew.json";
const snapshotKey = "crew-v1";
const discordApi = "https://discord.com/api/v10";
const discordCdn = "https://cdn.discordapp.com";

async function discord(path, token) {
  const response = await fetch(`${discordApi}${path}`, {
    headers: {
      Authorization: `Bot ${token}`,
      "User-Agent": "DiscordBot (https://twbronycon.org, 1.0.0)",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Discord returned HTTP ${response.status}`);
  return response.json();
}

function avatarUrl(guildId, user, guildAvatar) {
  if (!guildAvatar && !user.avatar) {
    return `${discordCdn}/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;
  }
  const hash = guildAvatar ?? user.avatar;
  const directory = guildAvatar
    ? `/guilds/${guildId}/users/${user.id}/avatars`
    : `/avatars/${user.id}`;
  const format = hash.startsWith("a_") ? "gif" : "png";
  return `${discordCdn}${directory}/${hash}.${format}?size=256`;
}

async function compileRoster(guildId, token) {
  const listedIds = new Set(
    groups.flatMap(({ members }) =>
      members.flatMap(({ discordId }) => (discordId ? [discordId] : [])),
    ),
  );
  const roles = new Map(
    groups.flatMap(({ roleId }) => (roleId ? [[roleId, []]] : [])),
  );
  const profiles = new Map();

  let after = "0";
  while (true) {
    const members = await discord(
      `/guilds/${guildId}/members?limit=1000&after=${after}`,
      token,
    );
    for (const { user, nick, avatar, roles: memberRoles } of members) {
      let publish = listedIds.has(user.id);
      for (const roleId of memberRoles) {
        const membersInRole = roles.get(roleId);
        if (membersInRole) {
          membersInRole.push(user.id);
          publish = true;
        }
      }
      if (publish) {
        profiles.set(user.id, {
          name: nick || user.global_name || user.username,
          avatar: avatarUrl(guildId, user, avatar),
        });
      }
    }
    if (members.length < 1000) break;
    after = members.at(-1).user.id;
  }

  for (const id of listedIds) {
    if (profiles.has(id)) continue;
    const user = await discord(`/users/${id}`, token);
    profiles.set(id, {
      name: user.global_name || user.username,
      avatar: avatarUrl(guildId, user, null),
    });
  }

  return groups.map(({ groupName, members, roleId }) => {
    const explicitIds = new Set(members.map(({ discordId }) => discordId));
    return {
      groupName,
      members: [
        ...members.map((member) => {
          const profile = profiles.get(member.discordId);
          const customAvatar =
            member.override ||
            (member.avatar &&
              !member.avatar.startsWith("/img/avatar/discord/"));
          return {
            name:
              member.name ||
              (!member.override && !member.nameOverride
                ? profile?.name
                : undefined) ||
              member.nameHint ||
              member.discordId,
            avatar: customAvatar ? member.avatar : profile?.avatar,
          };
        }),
        ...(roles.get(roleId) ?? [])
          .filter((id) => !explicitIds.has(id))
          .map((id) => profiles.get(id)),
      ],
    };
  });
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== snapshotPath)
      return env.ASSETS.fetch(request);
    if (request.method !== "GET")
      return new Response(null, { status: 405, headers: { Allow: "GET" } });
    const snapshot = await env.CREW_SNAPSHOT?.get(snapshotKey);
    if (!snapshot)
      return new Response("Crew snapshot unavailable", { status: 503 });
    return new Response(snapshot, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  },

  async scheduled(_event, env) {
    const [token, guildId] = await Promise.all([
      env.DISCORD_BOT_TOKEN.get(),
      env.DISCORD_GUILD_ID.get(),
    ]);
    if (!token || !/^\d+$/.test(guildId))
      throw new Error("Invalid Discord secret configuration");
    const groups = await compileRoster(guildId, token);
    await env.CREW_SNAPSHOT.put(snapshotKey, JSON.stringify(groups), {
      expirationTtl: 86_400,
    });
  },
};
