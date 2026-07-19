import { describe, expect, test } from "vitest";
import { flattenNodeTree } from "../domain/featureNodeFactory";
import { CURRENT_PROJECT_VERSION, parseProjectBackup } from "../domain/projectBackup";
import { createParkingBuildingSeedTree } from "../seed/parkingBuildingSeed";

describe("project backup", () => {
  test("migrates version 1 backups and validates their tree", () => {
    const parsed = parseProjectBackup({
      version: "1.0.0",
      projectName: "Parking",
      clients: ["Admin", "Driver"].map(name => ({ id: name, name })),
      nodes: flattenNodeTree(createParkingBuildingSeedTree()[0]),
    });
    expect(parsed.migrated).toBe(true);
    expect(parsed.data.version).toBe(CURRENT_PROJECT_VERSION);
    expect(parsed.issues.filter(issue => issue.blocksSave)).toEqual([]);
  });

  test("rejects unsupported future major versions", () => {
    expect(() => parseProjectBackup({ version: "3.0.0", projectName: "Future", nodes: [] }))
      .toThrow(/Unsupported backup version/);
  });
});
