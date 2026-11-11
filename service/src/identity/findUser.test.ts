import assert from "node:assert/strict";
import { after, test } from "node:test";

import { Result } from "@praha/byethrow";
import type { Viewer } from "@wizard/domain";
import { closeDb, withRollback } from "@wizard/store/dbTestOnly";

import { findUser } from "./findUser.ts";
import { saveUser } from "./saveUser.ts";

const viewer: Viewer = { userId: "user_service_reader", permissions: [] };

after(closeDb);

test("finding a saved knight by id gives it back", async () => {
  await withRollback(async () => {
    const saved = Result.unwrap(await saveUser(viewer, { name: "Service Teft", age: 40 }));

    assert.deepEqual(await findUser(viewer, saved.id), { type: "Success", value: saved });
  });
});

test("finding a knight that does not exist gives Ok undefined", async () => {
  await withRollback(async () => {
    assert.deepEqual(await findUser(viewer, "not-a-number"), { type: "Success", value: undefined });
    assert.deepEqual(await findUser(viewer, "2147483647"), { type: "Success", value: undefined });
  });
});
