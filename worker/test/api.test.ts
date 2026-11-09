import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import type {
  AuthSession,
  HabitDetail,
  HabitList,
} from "../../shared/api-types";
import {
  api,
  onWorkOS,
  resetWorkOS,
  signAccessToken,
  workosCalls,
  workosUser,
} from "./helpers";

const TODAY = "2026-11-09";
let userCount = 0;

const newUser = async () => {
  userCount += 1;
  const id = `user_${userCount}_${crypto.randomUUID()}`;
  return { id, token: await signAccessToken(id) };
};

const createHabit = async (
  token: string,
  body: { categoryId: string; name: string } = {
    categoryId: "fitness",
    name: "Run",
  }
) => {
  const response = await api(`/api/habits?today=${TODAY}`, {
    body,
    method: "POST",
    token,
  });
  expect(response.status).toBe(201);
  const { habits } = await response.json<HabitList>();
  const habit = habits.at(-1);
  if (!habit) {
    throw new Error("Habit was not created.");
  }
  return habit;
};

const addCheckins = async (
  ownerId: string,
  habitId: string,
  dates: string[]
) => {
  await env.DB.batch(
    dates.map((date) =>
      env.DB.prepare(
        "INSERT INTO checkins (habit_id, owner_id, date) VALUES (?, ?, ?)"
      ).bind(habitId, ownerId, date)
    )
  );
};

beforeEach(() => {
  resetWorkOS();
});

describe("authentication", () => {
  it("rejects requests without a valid access token", async () => {
    expect((await api(`/api/habits?today=${TODAY}`)).status).toBe(401);
    const forged = await api(`/api/habits?today=${TODAY}`, {
      token: "not.a.jwt",
    });
    expect(forged.status).toBe(401);
    expect(await forged.json()).toEqual({
      error: "Your session has expired. Sign in again.",
    });
  });

  it("only redirects to known redirect URIs", async () => {
    const challenge = "a".repeat(43);
    const native = await api(
      `/api/auth/authorize?redirect_uri=practice://callback&code_challenge=${challenge}&state=xyz`
    );
    expect(native.status).toBe(302);
    const location = new URL(native.headers.get("Location") ?? "");
    expect(location.pathname).toBe("/user_management/authorize");
    expect(location.searchParams.get("provider")).toBe("authkit");
    expect(location.searchParams.get("code_challenge")).toBe(challenge);
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("client_id")).toBe(env.WORKOS_CLIENT_ID);

    const web = await api(
      `/api/auth/authorize?redirect_uri=https://practice.test/callback&code_challenge=${challenge}&state=xyz`
    );
    expect(web.status).toBe(302);

    const evil = await api(
      `/api/auth/authorize?redirect_uri=https://evil.test/callback&code_challenge=${challenge}&state=xyz`
    );
    expect(evil.status).toBe(400);
  });

  it("exchanges a code for a session, keeping web refresh tokens in a cookie", async () => {
    onWorkOS((call) =>
      call.path === "/user_management/authenticate"
        ? Response.json({
            access_token: "access",
            refresh_token: "refresh",
            user: workosUser("user_a"),
          })
        : undefined
    );
    const body = { code: "code_1", codeVerifier: "v".repeat(43) };

    const native = await api("/api/auth/token", {
      body: { ...body, platform: "native" },
      method: "POST",
    });
    expect(native.status).toBe(200);
    expect(await native.json<AuthSession>()).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      user: { email: "user_a@example.com", id: "user_a" },
    });
    expect(workosCalls[0]?.body).toMatchObject({
      client_id: env.WORKOS_CLIENT_ID,
      code: "code_1",
      code_verifier: body.codeVerifier,
      grant_type: "authorization_code",
    });

    const web = await api("/api/auth/token", {
      body: { ...body, platform: "web" },
      method: "POST",
    });
    const session = await web.json<AuthSession>();
    expect(session.refreshToken).toBeUndefined();
    const cookie = web.headers.get("Set-Cookie") ?? "";
    expect(cookie).toContain("__Host-practice_refresh=refresh");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");

    const refreshed = await api("/api/auth/refresh", {
      body: { platform: "web" },
      cookie: "__Host-practice_refresh=refresh",
      method: "POST",
    });
    expect(refreshed.status).toBe(200);
    expect(workosCalls.at(-1)?.body).toMatchObject({
      grant_type: "refresh_token",
      refresh_token: "refresh",
    });
  });

  it("turns a rejected code into a 401", async () => {
    onWorkOS(() => Response.json({ error: "invalid_grant" }, { status: 400 }));
    const response = await api("/api/auth/token", {
      body: { code: "bad", codeVerifier: "v".repeat(43), platform: "native" },
      method: "POST",
    });
    expect(response.status).toBe(401);
  });

  it("revokes the WorkOS session on logout", async () => {
    const { id, token } = await newUser();
    onWorkOS((call) =>
      call.path === "/user_management/sessions/revoke"
        ? Response.json({})
        : undefined
    );
    const response = await api("/api/auth/logout", { method: "POST", token });
    expect(response.status).toBe(204);
    expect(workosCalls[0]?.body).toEqual({ session_id: `session_${id}` });
  });
});

describe("habits", () => {
  it("creates, renames, toggles and deletes a habit", async () => {
    const { token } = await newUser();
    const habit = await createHabit(token, {
      categoryId: "reading",
      name: "  Read   20 pages ",
    });
    expect(habit).toMatchObject({
      categoryId: "reading",
      checkedToday: false,
      name: "Read 20 pages",
      stats: { currentStreak: 0, totalCheckins: 0 },
    });
    expect(habit.recentDays).toHaveLength(30);
    expect(habit.recentDays.at(-1)).toEqual({ completed: false, date: TODAY });

    const renamed = await api(`/api/habits/${habit.id}?today=${TODAY}`, {
      body: { categoryId: "writing", name: "Write" },
      method: "PATCH",
      token,
    });
    expect((await renamed.json<HabitList>()).habits[0]).toMatchObject({
      categoryId: "writing",
      name: "Write",
    });

    const toggled = await api(
      `/api/habits/${habit.id}/toggle-today?today=${TODAY}`,
      { method: "POST", token }
    );
    expect((await toggled.json<HabitList>()).habits[0]).toMatchObject({
      checkedToday: true,
      stats: { currentStreak: 1, lastCheckin: TODAY, totalCheckins: 1 },
    });

    const untoggled = await api(
      `/api/habits/${habit.id}/toggle-today?today=${TODAY}`,
      { method: "POST", token }
    );
    expect((await untoggled.json<HabitList>()).habits[0]?.checkedToday).toBe(
      false
    );

    await api(`/api/habits/${habit.id}/toggle-today?today=${TODAY}`, {
      method: "POST",
      token,
    });
    const deleted = await api(`/api/habits/${habit.id}?today=${TODAY}`, {
      method: "DELETE",
      token,
    });
    expect((await deleted.json<HabitList>()).habits).toEqual([]);
    const remaining = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM checkins WHERE habit_id = ?"
    )
      .bind(habit.id)
      .first<{ count: number }>();
    expect(remaining?.count).toBe(0);
  });

  it("computes streaks and the year history on the server", async () => {
    const { id, token } = await newUser();
    const habit = await createHabit(token);
    await addCheckins(id, habit.id, [
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-11-07",
      "2026-11-08",
    ]);

    const response = await api(`/api/habits/${habit.id}?today=${TODAY}`, {
      token,
    });
    const detail = await response.json<HabitDetail>();
    expect(detail.stats).toMatchObject({
      currentStreak: 2,
      lastCheckin: "2026-11-08",
      totalCheckins: 6,
    });
    expect(detail.checkedToday).toBe(false);
    const days = detail.history.flatMap((week) => week.days);
    expect(days.filter((day) => day.completed)).toHaveLength(6);
    expect(days.filter((day) => day.inRange)).toHaveLength(365);
    expect(detail.history[0]?.monthLabel).toBeDefined();
  });

  it("keeps each user's habits private", async () => {
    const owner = await newUser();
    const other = await newUser();
    const habit = await createHabit(owner.token);

    const list = await api(`/api/habits?today=${TODAY}`, {
      token: other.token,
    });
    expect((await list.json<HabitList>()).habits).toEqual([]);

    const attempts = [
      api(`/api/habits/${habit.id}?today=${TODAY}`, { token: other.token }),
      api(`/api/habits/${habit.id}?today=${TODAY}`, {
        body: { categoryId: "fitness", name: "Mine now" },
        method: "PATCH",
        token: other.token,
      }),
      api(`/api/habits/${habit.id}/toggle-today?today=${TODAY}`, {
        method: "POST",
        token: other.token,
      }),
      api(`/api/habits/${habit.id}?today=${TODAY}`, {
        method: "DELETE",
        token: other.token,
      }),
    ];
    for (const response of await Promise.all(attempts)) {
      expect(response.status).toBe(404);
    }

    const ownerList = await api(`/api/habits?today=${TODAY}`, {
      token: owner.token,
    });
    expect((await ownerList.json<HabitList>()).habits[0]).toMatchObject({
      checkedToday: false,
      name: "Run",
    });
  });

  it("rejects invalid input with a readable message", async () => {
    const { token } = await newUser();
    const cases: [string, unknown, string][] = [
      [
        `/api/habits?today=${TODAY}`,
        { categoryId: "fitness", name: "   " },
        "Give your habit a name.",
      ],
      [
        `/api/habits?today=${TODAY}`,
        { categoryId: "not-a-category", name: "Run" },
        "Pick a category from the list.",
      ],
      [
        `/api/habits?today=${TODAY}`,
        { categoryId: "fitness", name: "x".repeat(121) },
        "Keep the name under 120 characters.",
      ],
      [
        "/api/habits?today=2026-02-30",
        { categoryId: "fitness", name: "Run" },
        "Invalid date.",
      ],
    ];
    const responses = await Promise.all(
      cases.map(([path, body]) => api(path, { body, method: "POST", token }))
    );
    const results = await Promise.all(
      responses.map(async (response) => [
        response.status,
        await response.json(),
      ])
    );
    expect(results).toEqual(cases.map(([, , error]) => [400, { error }]));
  });
});

describe("account", () => {
  it("deletes the user's data and their WorkOS user", async () => {
    const { id, token } = await newUser();
    const habit = await createHabit(token);
    await addCheckins(id, habit.id, [TODAY]);
    onWorkOS((call) =>
      call.method === "DELETE" && call.path === `/user_management/users/${id}`
        ? new Response(null, { status: 202 })
        : undefined
    );

    const response = await api("/api/account", { method: "DELETE", token });
    expect(response.status).toBe(204);
    expect(workosCalls).toHaveLength(1);
    const left = await env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM habits WHERE owner_id = ?1) + (SELECT COUNT(*) FROM checkins WHERE owner_id = ?1) AS count"
    )
      .bind(id)
      .first<{ count: number }>();
    expect(left?.count).toBe(0);
  });
});
