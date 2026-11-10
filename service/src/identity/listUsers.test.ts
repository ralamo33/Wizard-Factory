import assert from "node:assert/strict";
import { test } from "node:test";

import { listUsers } from "./listUsers.ts";
import { saveUser } from "./saveUser.ts";

test("listUsers returns the requested page of stored users", () => {
  saveUser({ name: "Service Jasnah", age: 34, order: "Elsecallers" });
  saveUser({ name: "Service Renarin", age: 19, order: "Truthwatchers" });

  const page = listUsers({ page: 1, pageLimit: 1, sortBy: "name", filters: { name: "service" } });

  assert.deepEqual(
    page.items.map((user) => user.name),
    ["Service Jasnah"],
  );
  assert.equal(page.hasNextPage, true);
});
