import { describe, it, expect } from "vitest";
import type { FeatureNode } from "../domain/featureNode.types";
import { getAncestorChain, getEffectiveRules } from "../domain/inheritance.utils";

describe("Inheritance Utilities", () => {
  const sampleNodes: FeatureNode[] = [
    {
      id: "root",
      parentId: null,
      title: "Auth",
      type: "category",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "",
      businessRules: ["User must be active.", "Token response must follow common format."],
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
      id: "child",
      parentId: "root",
      title: "Login",
      type: "feature",
      clients: ["Admin"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "",
      businessRules: ["Failed login must not reveal whether account exists.", "Login attempts rate-limited."],
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
      id: "leaf",
      parentId: "child",
      title: "Google Login",
      type: "leaf_feature",
      clients: ["Admin", "Driver"],
      status: "draft",
      priority: "medium",
      tags: [],
      summary: "",
      businessRules: ["Google token must be verified server-side."],
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
    }
  ];

  it("getAncestorChain returns correct parent chain including target", () => {
    const chain = getAncestorChain("leaf", sampleNodes);
    expect(chain).toHaveLength(3);
    expect(chain[0].id).toBe("root");
    expect(chain[1].id).toBe("child");
    expect(chain[2].id).toBe("leaf");
  });

  it("getAncestorChain on root node returns only root", () => {
    const chain = getAncestorChain("root", sampleNodes);
    expect(chain).toHaveLength(1);
    expect(chain[0].id).toBe("root");
  });

  it("getEffectiveRules combines parent + child rules in correct order", () => {
    const effective = getEffectiveRules("leaf", sampleNodes);
    expect(effective).toHaveLength(3);
    
    expect(effective[0].sourceTitle).toBe("Auth");
    expect(effective[0].rules).toContain("User must be active.");
    
    expect(effective[1].sourceTitle).toBe("Login");
    expect(effective[1].rules).toContain("Failed login must not reveal whether account exists.");
    
    expect(effective[2].sourceTitle).toBe("Google Login");
    expect(effective[2].rules).toContain("Google token must be verified server-side.");
  });

  it("child rules do not mutate parent rules", () => {
    const effective = getEffectiveRules("leaf", sampleNodes);
    
    // Mutate the returned rules array
    effective[0].rules.push("Malicious Rule");
    
    const rootNode = sampleNodes.find(n => n.id === "root")!;
    expect(rootNode.businessRules).not.toContain("Malicious Rule");
    expect(rootNode.businessRules).toHaveLength(2);
  });
});
