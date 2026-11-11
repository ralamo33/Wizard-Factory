import assert from "node:assert/strict";
import { test } from "node:test";

import { createContextWith } from "./context.ts";

const requestWith = (authorization?: string): Readonly<{ req: Readonly<{ headers: Readonly<{ authorization?: string }> }> }> => ({
  req: { headers: authorization === undefined ? {} : { authorization } },
});

const verifyingAs =
  (claims: unknown) =>
  async (token: string): Promise<unknown> =>
    token === "good-token" ? Promise.resolve(claims) : Promise.reject(new Error("Token is invalid."));

test("verified claims become the viewer", async () => {
  const createContext = createContextWith(verifyingAs({ sub: "user_2abc", app_permissions: ["users:manage"] }));

  assert.deepEqual(await createContext(requestWith("Bearer good-token")), { viewer: { userId: "user_2abc", permissions: ["users:manage"] } });
});

test("claims without app_permissions give a viewer with no permissions", async () => {
  const createContext = createContextWith(verifyingAs({ sub: "user_2abc" }));

  assert.deepEqual(await createContext(requestWith("Bearer good-token")), { viewer: { userId: "user_2abc", permissions: [] } });
});

test("a bad token, a missing header or unusable claims give no viewer", async () => {
  const createContext = createContextWith(verifyingAs({ sub: "user_2abc" }));

  assert.deepEqual(await createContext(requestWith("Bearer bad-token")), { viewer: undefined });
  assert.deepEqual(await createContext(requestWith()), { viewer: undefined });
  assert.deepEqual(await createContext(requestWith("Basic good-token")), { viewer: undefined });
  assert.deepEqual(await createContextWith(verifyingAs({ sub: "org_2abc" }))(requestWith("Bearer good-token")), { viewer: undefined });
});
