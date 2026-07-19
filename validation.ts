// validation.ts
import { seedInput } from './src/seed/parkingBuildingSeed';
import { createSeedNode } from './src/seed/parkingBuildingSeed';
import { migrateParkingTaxonomy } from './src/seed/parkingTaxonomyMigration';
import { isNodeAiReady } from './src/domain/inheritance.utils';

function walk(root) {
  return [root, ...(root.children || []).flatMap(walk)];
}

const rootNode = migrateParkingTaxonomy(createSeedNode(seedInput, null, 0));
const allNodes = walk(rootNode);

const diagFeatures = ["leaf-diag-core-health", "leaf-diag-support-health", "leaf-diag-db-check", "leaf-diag-res-dump", "leaf-diag-sess-dump"];

let allReady = true;

for (const id of diagFeatures) {
    const node = allNodes.find(n => n.id === id);
    if (!node) {
        console.error("Node not found: " + id);
        allReady = false;
        continue;
    }
    const result = isNodeAiReady(node, allNodes);
    if (!result.isReady) {
        console.error("Node NOT READY: " + id, result.reasons);
        allReady = false;
    } else {
        console.log("Node IS READY: " + id);
    }
}

if (allReady) {
    console.log("SUCCESS: All nodes are AI Ready.");
} else {
    process.exit(1);
}
