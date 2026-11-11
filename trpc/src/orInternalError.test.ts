import assert from "node:assert/strict";
import { test } from "node:test";

import { orInternalError } from "./orInternalError.ts";

test("a service Ok gives its value", async () => {
  assert.equal(await orInternalError({ type: "Success", value: 42 }), 42);
});

test("a service Err becomes an INTERNAL_SERVER_ERROR without leaking the cause", async () => {
  await assert.rejects(orInternalError({ type: "Failure", error: { name: "DatabaseError", message: "secret detail" } }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal("code" in error ? error.code : undefined, "INTERNAL_SERVER_ERROR");
    assert.doesNotMatch(error.message, /secret detail/u);

    return true;
  });
});
