import Dexie, { type Table } from "dexie";
import type { FeatureNode, Project } from "../domain/featureNode.types";

export class FeatureTreeDatabase extends Dexie {
  projects!: Table<Project, string>;
  features!: Table<FeatureNode & { projectId: string }, string>;

  constructor() {
    super("FeatureTreeDatabase");
    this.version(1).stores({
      projects: "id, name, createdAt, updatedAt",
      features: "id, projectId, parentId, title, type, order"
    });
  }
}

export const db = new FeatureTreeDatabase();
