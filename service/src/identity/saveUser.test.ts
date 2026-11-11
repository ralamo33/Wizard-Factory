import assert from "node:assert/strict";
import { after, test } from "node:test";

import { Result } from "@praha/byethrow";
import type { Viewer } from "@wizard/domain";
import { closeDb, withRollback } from "@wizard/store/dbTestOnly";

import { findUser } from "./findUser.ts";
import { listUsers } from "./listUsers.ts";
import { saveUser } from "./saveUser.ts";

const kaladin: Viewer = { userId: "user_service_kaladin", permissions: [] };
const shallan: Viewer = { userId: "user_service_shallan", permissions: [] };

after(closeDb);

test("saving a knight stores it for the viewer who swore it", async () => {
  await withRollback(async () => {
    const saved = Result.unwrap(await saveUser(kaladin, { name: "Service Kaladin", age: 20, order: "Windrunners" }));

    assert.equal(saved.userId, kaladin.userId);
    assert.equal(saved.name, "Service Kaladin");
    assert.deepEqual(Result.unwrap(await findUser(shallan, saved.id)), saved);
    assert.deepEqual(Result.unwrap(await listUsers(shallan, { page: 1, pageLimit: 100, filters: { name: "Service Kaladin" } })).items, [saved]);
  });
});
