import { describe, it, expect } from "vitest";
import type { FeatureNode } from "../domain/featureNode.types";
import { formatSingleNodeMarkdown, formatSubtreeMarkdown, formatProjectMarkdown } from "../domain/export.utils";

describe("Export Utilities", () => {
  const sampleNodes: FeatureNode[] = [
    {
      id: "root",
      parentId: null,
      title: "Project Root",
      type: "project",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "Root summary",
      businessRules: ["Global rule"],
      apiContracts: [],
      uiContracts: [],
      dataContracts: [],
      testCases: [],
      doneCriteria: [],
      dependencies: [],
      risks: [],
      notes: "",
      createdAt: "",
      updatedAt: "",
      order: 0
    },
    {
      id: "feat",
      parentId: "root",
      title: "Feature A",
      type: "feature",
      clients: ["Admin", "Driver"],
      status: "ready",
      priority: "high",
      tags: ["tag1"],
      summary: "Feature summary",
      businessRules: ["Local rule"],
      apiContracts: [{ id: "c1", name: "POST /login", content: "Payload content" }],
      uiContracts: [],
      dataContracts: [],
      testCases: [{ id: "t1", title: "Test A", type: "unit", expectedResult: "pass", status: "passed" }],
      doneCriteria: [{ id: "d1", content: "Criteria A", checked: true }],
      dependencies: ["None"],
      risks: ["None"],
      notes: "Some notes",
      createdAt: "",
      updatedAt: "",
      order: 0
    }
  ];

  it("export selected node contains local and inherited rules", () => {
    const md = formatSingleNodeMarkdown(sampleNodes[1], sampleNodes, "ai");
    
    // Check path, clients, rules, contracts, tests, done criteria
    expect(md).toContain("AI Implementation Guide: Feature A");
    expect(md).toContain("Project Root > Feature A");
    expect(md).toContain("Admin, Driver");
    expect(md).toContain("Global rule"); // Inherited
    expect(md).toContain("Local rule");  // Local
    expect(md).toContain("POST /login");
    expect(md).toContain("Test A");
    expect(md).toContain("Criteria A");
  });

  it("export subtree exports recursively in order", () => {
    const md = formatSubtreeMarkdown("root", sampleNodes, "human");
    expect(md).toContain("# Feature Specification: Project Root");
    expect(md).toContain("# Feature Specification: Feature A");
  });

  it("export project exports all root trees", () => {
    const md = formatProjectMarkdown(sampleNodes, "qa");
    expect(md).toContain("QA Specification: Project Root");
    expect(md).toContain("QA Specification: Feature A");
  });
});
