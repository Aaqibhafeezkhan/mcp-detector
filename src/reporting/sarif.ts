import type { Finding, ScanResult, Severity } from "../core/types.js";
import { allRules } from "../rules/index.js";

const SARIF_SCHEMA = "https://json.schemastore.org/sarif-2.1.0.json";

function sarifLevel(severity: Severity): "error" | "warning" | "note" {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium") return "warning";
  return "note";
}

export function renderSarif(result: ScanResult): string {
  const findingsByRule = new Map<string, Finding>();
  for (const finding of result.findings) {
    if (!findingsByRule.has(finding.rule)) findingsByRule.set(finding.rule, finding);
  }
  const rules = [...findingsByRule.values()].map((finding) => {
    const registered = allRules().find((rule) => rule.id === finding.rule);
    return {
      id: finding.rule,
      name: registered?.name ?? finding.name,
      shortDescription: { text: registered?.description ?? finding.name },
      fullDescription: { text: registered?.why ?? finding.why },
      help: { text: registered?.recommendation ?? finding.recommendation },
      defaultConfiguration: { level: sarifLevel(registered?.severity ?? finding.severity) },
      properties: { category: finding.category, tags: ["security", "mcp"] },
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const results = result.findings.map((finding) => ({
    ruleId: finding.rule,
    level: sarifLevel(finding.severity),
    message: { text: finding.message },
    ...(finding.tool ? {
      locations: [{ logicalLocations: [{ name: finding.tool, kind: "function" }] }],
    } : {}),
    properties: {
      severity: finding.severity,
      category: finding.category,
      ...(finding.evidence ? { evidence: finding.evidence } : {}),
      ...(finding.details?.length ? { details: finding.details } : {}),
      recommendation: finding.recommendation,
    },
  }));
  return JSON.stringify({
    $schema: SARIF_SCHEMA,
    version: "2.1.0",
    runs: [{
      tool: {
        driver: {
          name: "MCP Detector",
          informationUri: "https://github.com/adebayomoses/mcp-detector",
          rules,
        },
      },
      results,
    }],
  }, null, 2);
}
