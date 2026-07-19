import { describe, expect, test } from "vitest";
import { flattenNodeTree } from "../domain/featureNodeFactory";
import { validateFeatureTree } from "../domain/taxonomy";
import { createParkingBuildingSeedTree } from "../seed/parkingBuildingSeed";

describe("parking capability taxonomy", () => {
  test("seed has one valid project root and no blocking taxonomy issues", () => {
    const nodes = flattenNodeTree(createParkingBuildingSeedTree()[0]);
    const blocking = validateFeatureTree(nodes).filter(issue => issue.blocksSave);
    expect(blocking).toEqual([]);
  });

  test("keeps target business domains and removes duplicate capabilities", () => {
    const root = createParkingBuildingSeedTree()[0];
    const nodes = flattenNodeTree(root);
    expect(root.children).toHaveLength(14);
    expect(nodes.filter(node => node.title === "Public Pricing")).toHaveLength(1);
    expect(nodes.filter(node => node.title === "Public Available Slots")).toHaveLength(1);
    expect(nodes.find(node => node.id === "leaf-price-public")).toBeUndefined();
    expect(nodes.find(node => node.id === "leaf-struct-avail")).toBeUndefined();
    expect(nodes.find(node => node.id === "leaf-notif-unread")).toBeUndefined();
  });

  test("splits authentication into independently editable leaf flows", () => {
    const nodes = flattenNodeTree(createParkingBuildingSeedTree()[0]);
    const auth = nodes.find(node => node.id === "leaf-auth-session");
    expect(auth?.type).toBe("feature");
    for (const id of ["leaf-auth-login", "leaf-auth-profile", "leaf-auth-refresh", "leaf-auth-logout"]) {
      const node = nodes.find(item => item.id === id);
      expect(node?.type).toBe("leaf_feature");
      expect(node?.testCases.length).toBeGreaterThanOrEqual(2);
    }
  });
});
