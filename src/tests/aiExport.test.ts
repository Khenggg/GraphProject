import { describe, test, expect } from "vitest";
import { createParkingBuildingSeedTree } from "../seed/parkingBuildingSeed";
import { flattenNodeTree } from "../domain/featureNodeFactory";
import { formatSingleNodeMarkdown } from "../domain/export.utils";

describe("aiExport", () => {
  test("Export selected node includes inherited rules", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    
    // Find "Create Reservation"
    const resNode = flat.find(n => n.title === "Create Reservation");
    expect(resNode).toBeDefined();

    // Export to AI mode
    const md = formatSingleNodeMarkdown(resNode!, flat, "ai");

    // Inherited rules from cat-reservation should be present:
    // "A reservation must be associated with a driver"
    expect(md).toContain("A reservation must be associated with a driver");
    expect(md).toContain("Unpaid or expired reservations must not permanently lock slots");
  });

  test("Export selected node includes clients, endpoints, API contracts, tests, and done criteria", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    
    // Find Login node
    const loginNode = flat.find(n => n.title === "Login & Session Management");
    expect(loginNode).toBeDefined();

    // Export to AI mode
    const md = formatSingleNodeMarkdown(loginNode!, flat, "ai");

    // Validate metadata fields
    expect(md).toContain("**Authorized Clients/Roles:** Driver, Staff, Manager, Admin");
    expect(md).toContain("**Owner Service:** .NET Core API");
    expect(md).toContain("**Endpoints:**\n- POST /api/core/auth/login");

    // Validate sections
    expect(md).toContain("## 5. API Contracts");
    expect(md).toContain("POST /api/core/auth/login");
    expect(md).toContain("## 12. Automated Test Cases");
    expect(md).toContain("## 13. Acceptance / Done Criteria");
  });
});
