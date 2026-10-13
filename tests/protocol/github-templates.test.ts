import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

/**
 * GitHub silently ignores a malformed issue form (the template just disappears), and a label that does not exist
 * is dropped. These checks keep the templates, labels and good-first-issue drafts consistent with each other.
 */
const dir = ".github/ISSUE_TEMPLATE";
const forms = readdirSync(dir).filter((f) => f.endsWith(".yml") && f !== "config.yml");
const labels: { name: string; color: string; description: string }[] = parse(readFileSync(".github/labels.yml", "utf8"));
const labelNames = new Set(labels.map((l) => l.name));
const BODY_TYPES = new Set(["markdown", "input", "textarea", "dropdown", "checkboxes"]);

describe("issue forms", () => {
  it("has the templates we expect", () => {
    expect(forms.sort()).toEqual(["bug_report.yml", "false_positive.yml", "feature_request.yml", "missed_detection.yml", "rule_proposal.yml"]);
  });

  for (const f of forms) {
    describe(f, () => {
      const doc: any = parse(readFileSync(join(dir, f), "utf8"));
      it("has the required top-level fields", () => {
        expect(typeof doc.name).toBe("string");
        expect(typeof doc.description).toBe("string");
        expect(Array.isArray(doc.body) && doc.body.length > 0).toBe(true);
      });
      it("only uses valid body elements, unique ids, and at least one required field", () => {
        const ids = new Set<string>();
        let required = 0;
        for (const el of doc.body) {
          expect(BODY_TYPES.has(el.type), `${f}: unknown type ${el.type}`).toBe(true);
          if (el.type === "markdown") expect(typeof el.attributes?.value).toBe("string");
          else {
            expect(typeof el.attributes?.label, `${f}: ${el.type} needs a label`).toBe("string");
            if (el.id) {
              expect(ids.has(el.id), `${f}: duplicate id ${el.id}`).toBe(false);
              ids.add(el.id);
            }
          }
          if (el.type === "dropdown") expect(el.attributes.options.length).toBeGreaterThan(1);
          if (el.type === "checkboxes") for (const o of el.attributes.options) expect(typeof o.label).toBe("string");
          if (el.validations?.required) required++;
        }
        expect(required).toBeGreaterThan(0);
      });
      it("only applies labels that exist in labels.yml", () => {
        for (const l of doc.labels ?? []) expect(labelNames.has(l), `${f}: label "${l}" is not defined`).toBe(true);
      });
      it("warns people not to paste secrets", () => {
        expect(JSON.stringify(doc).toLowerCase()).toMatch(/secret|token|password/);
      });
    });
  }

  it("config.yml disables blank issues and points security reports somewhere private", () => {
    const cfg: any = parse(readFileSync(join(dir, "config.yml"), "utf8"));
    expect(cfg.blank_issues_enabled).toBe(false);
    expect(JSON.stringify(cfg.contact_links)).toMatch(/security\/advisories/);
  });
});

describe("labels", () => {
  it("are well-formed (6-digit hex colour, description under GitHub's 100-character limit)", () => {
    for (const l of labels) {
      expect(l.color).toMatch(/^[0-9a-f]{6}$/i);
      expect(l.description.length).toBeLessThanOrEqual(100);
      expect(l.name.length).toBeLessThanOrEqual(50);
    }
    expect(new Set(labels.map((l) => l.name)).size).toBe(labels.length);
  });
});

describe("good-first-issue drafts", () => {
  const files = readdirSync(".github/good-first-issues").filter((f) => f.endsWith(".md"));
  it("has several, so there is something for newcomers to pick up", () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });
  for (const f of files) {
    it(`${f}: has a title line, known labels, and the sections a newcomer needs`, () => {
      const text = readFileSync(join(".github/good-first-issues", f), "utf8").replace(/\r/g, "");
      const lines = text.split("\n");
      expect(lines[0]).toMatch(/^title: .{10,}/);
      expect(lines[1]).toMatch(/^labels: /);
      expect(lines[2]).toBe(""); // the setup script uses everything from line 3 as the body
      for (const l of lines[1].replace("labels: ", "").split(",").map((x) => x.trim()))
        expect(labelNames.has(l), `${f}: label "${l}" is not defined`).toBe(true);
      expect(text).toMatch(/## Background/);
      expect(text).toMatch(/## What to do/);
      expect(text).toMatch(/## Done when/);
    });
  }
  it("each mentions files that exist, so a newcomer is not sent to a dead path", () => {
    const re = /`((?:src|tests|docs|\.github)\/[\w./-]+\.(?:ts|md|yml))`/g;
    for (const f of files) {
      const text = readFileSync(join(".github/good-first-issues", f), "utf8");
      for (const m of text.matchAll(re)) expect(existsSync(m[1]), `${f} references missing ${m[1]}`).toBe(true);
    }
  });
});

describe("pull request template", () => {
  it("asks for tests and the generated rules doc", () => {
    const t = readFileSync(".github/pull_request_template.md", "utf8");
    expect(t).toMatch(/npm test/);
    expect(t).toMatch(/docs:rules/);
    expect(t).toMatch(/must.*flag|near-miss/i);
  });
});
