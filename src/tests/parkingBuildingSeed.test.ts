import { describe, test, expect } from "vitest";
import { createParkingBuildingSeedTree } from "../seed/parkingBuildingSeed";
import { flattenNodeTree } from "../domain/featureNodeFactory";

describe("parkingBuildingSeed", () => {
  test("createParkingBuildingSeedTree returns one root project node", () => {
    const tree = createParkingBuildingSeedTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe("project");
    expect(tree[0].title).toBe("Parking Building Management System");
  });

  test("root contains Clients / Roles and major feature categories", () => {
    const tree = createParkingBuildingSeedTree();
    const root = tree[0];
    expect(root.children).toBeDefined();
    
    const titles = root.children!.map(c => c.title);
    expect(titles).toContain("Clients / Roles");
    expect(titles).toContain("Authentication");
    expect(titles).toContain("Access Control & Authorization");
    expect(titles).toContain("Reservation / Booking");
    expect(titles).toContain("Payment");
  });

  test("Auth/Login node has clients and endpoint POST /api/core/auth/login", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const loginNode = flat.find(n => n.title === "Login");
    
    expect(loginNode).toBeDefined();
    expect(loginNode!.clients).toContain("Driver");
    expect(loginNode!.metadata?.endpoints).toContain("POST /api/core/auth/login");
  });

  test("Create Reservation node has Driver client and POST /api/core/reservations endpoint", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const resNode = flat.find(n => n.title === "Create Reservation");
    
    expect(resNode).toBeDefined();
    expect(resNode!.clients).toContain("Driver");
    expect(resNode!.metadata?.endpoints).toContain("POST /api/core/reservations");
  });

  test("PayOS Webhook node has System / Worker client and POST /api/core/payments/payos/webhook endpoint", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const webhookNode = flat.find(n => n.title === "PayOS Webhook");
    
    expect(webhookNode).toBeDefined();
    expect(webhookNode!.clients).toContain("System");
    expect(webhookNode!.metadata?.endpoints).toContain("POST /api/core/payments/payos/webhook");
  });

  test("Public Pricing node has Public / Guest client and GET /api/public/pricing endpoint", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const pricingNode = flat.find(n => n.title === "Public Pricing");
    
    expect(pricingNode).toBeDefined();
    expect(pricingNode!.clients).toContain("Guest");
    expect(pricingNode!.metadata?.endpoints).toContain("GET /api/public/pricing");
  });

  test("Every leaf node has at least 2 test cases", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const leaves = flat.filter(n => n.type === "leaf_feature");
    
    leaves.forEach(leaf => {
      expect(leaf.testCases.length).toBeGreaterThanOrEqual(2);
    });
  });

  test("Every leaf node has at least 1 done criterion", () => {
    const tree = createParkingBuildingSeedTree();
    const flat = flattenNodeTree(tree[0]);
    const leaves = flat.filter(n => n.type === "leaf_feature");
    
    leaves.forEach(leaf => {
      expect(leaf.doneCriteria.length).toBeGreaterThanOrEqual(1);
    });
  });

  test("Every node has deterministic id", () => {
    const tree1 = createParkingBuildingSeedTree();
    const flat1 = flattenNodeTree(tree1[0]);
    
    const tree2 = createParkingBuildingSeedTree();
    const flat2 = flattenNodeTree(tree2[0]);
    
    expect(flat1.length).toEqual(flat2.length);
    for (let i = 0; i < flat1.length; i++) {
      expect(flat1[i].id).toEqual(flat2[i].id);
    }
  });

  test("ParentId is correctly assigned recursively", () => {
    const tree = createParkingBuildingSeedTree();
    
    const checkParentIds = (node: any, expectedParentId: string | null) => {
      expect(node.parentId).toBe(expectedParentId);
      if (node.children) {
        node.children.forEach((child: any) => {
          checkParentIds(child, node.id);
        });
      }
    };
    
    checkParentIds(tree[0], null);
  });
});
