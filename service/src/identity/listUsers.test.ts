import assert from "node:assert/strict";
import { after, test } from "node:test";

import { Result } from "@praha/byethrow";
import type { Viewer } from "@wizard/domain";
import { closeDb, withRollback } from "@wizard/store/dbTestOnly";

import { listUsers } from "./listUsers.ts";
import { saveUser } from "./saveUser.ts";

const viewer: Viewer = { userId: "user_service_reader", permissions: [] };

after(closeDb);

test("listing knights filters, sorts and pages them", async () => {
  await withRollback(async () => {
    Result.unwrap(await saveUser(viewer, { name: "Service Kaladin", age: 20 }));
    Result.unwrap(await saveUser(viewer, { name: "Service Shallan", age: 17 }));
    Result.unwrap(await saveUser(viewer, { name: "Service Dalinar", age: 53 }));

    const page = Result.unwrap(await listUsers(viewer, { page: 1, pageLimit: 1, sortBy: "age", filters: { name: "service" } }));

    assert.deepEqual(
      page.items.map((user) => user.name),
      ["Service Shallan"],
    );
    assert.equal(page.hasNextPage, true);
  });
});

test("listing with no match gives an empty last page", async () => {
  await withRollback(async () => {
    assert.deepEqual(Result.unwrap(await listUsers(viewer, { page: 1, pageLimit: 1, filters: { name: "no knight is called this" } })), {
      items: [],
      hasNextPage: false,
    });
  });
});
