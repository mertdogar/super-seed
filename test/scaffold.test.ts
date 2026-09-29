import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { keyPrefix, rename, slugify, stripMarkers, titleCase } from "../src/scaffold.ts";

const source = `import a from "a";
// @feature billing
import b from "b";
// @end billing
const nav = [
  home,
  // @feature projects
  projects,
  // @feature billing
  limits,
  // @end billing
  // @end projects
];
{/* @feature operator */}
<Banner />
{/* @end operator */}
# @feature api-keys
KEY=1
# @end api-keys`;

describe("stripMarkers", () => {
  it("keeps kept blocks and drops every marker line", () => {
    const all = new Set(["billing", "projects", "operator", "api-keys"]);
    assert.equal(
      stripMarkers(source, all),
      `import a from "a";\nimport b from "b";\nconst nav = [\n  home,\n  projects,\n  limits,\n];\n<Banner />\nKEY=1`,
    );
  });

  it("drops removed blocks, including blocks nested inside them", () => {
    assert.equal(
      stripMarkers(source, new Set(["billing"])),
      `import a from "a";\nimport b from "b";\nconst nav = [\n  home,\n];`,
    );
  });

  it("drops a kept block nested in a removed one", () => {
    assert.equal(stripMarkers(source, new Set(["projects"])).includes("limits"), false);
  });

  it("leaves prose that mentions a marker alone", () => {
    const prose = "Wrap code in `// @feature billing` comments.";
    assert.equal(stripMarkers(prose, new Set()), prose);
  });

  it("rejects unknown features and unbalanced blocks", () => {
    assert.throws(
      () => stripMarkers("// @feature nope\n// @end nope", new Set()),
      /unknown feature/,
    );
    assert.throws(() => stripMarkers("// @feature billing", new Set()), /never closed/);
    assert.throws(
      () => stripMarkers("// @feature billing\n// @end projects", new Set()),
      /does not close/,
    );
  });
});

describe("names", () => {
  it("derives a slug, display name and key prefix", () => {
    assert.equal(slugify("My Cool_App!"), "my-cool-app");
    assert.equal(titleCase("my-cool-app"), "My Cool App");
    assert.equal(keyPrefix("my-cool-app"), "mca_");
    assert.equal(keyPrefix("acme"), "ac_");
  });

  it("renames the domain, display name, slug and key prefix", () => {
    const names = { slug: "acme", displayName: "Acme", domain: "acme.dev", keyPrefix: "ac_" };
    assert.equal(
      rename(
        'site "Super Seed" at https://super-seed.example.com, db super-seed, key ss_x, class_ok',
        names,
      ),
      'site "Acme" at https://acme.dev, db acme, key ac_x, class_ok',
    );
  });
});
