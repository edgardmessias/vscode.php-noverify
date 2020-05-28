import * as assert from "assert";
import * as vscode from "vscode";
import { activateExtension, EXTENSION_ID } from "./common";

suiteSetup(async function () {
  if (!(await activateExtension())) {
    this.skip();
  }
});

suite("Extension Tests", function () {
  let ext;

  test("Active Extension", function () {
    ext = vscode.extensions.getExtension(EXTENSION_ID) as vscode.Extension<any>;
    assert.ok(ext, "Extension not found");
    assert.equal(ext.isActive, true, "Extension not activated");
  });
});
