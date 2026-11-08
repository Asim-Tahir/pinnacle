export interface IArchivable {
  archivedAt: Date | null;
}

export class Archivable implements IArchivable {
  archivedAt: Date | null = null;

  get isArchived(): boolean {
    return this.archivedAt !== null;
  }

  constructor(archivedAt: Date | null = null) {
    this.archivedAt = archivedAt;
  }

  archive() {
    this.archivedAt = new Date();
  }

  unarchive() {
    this.archivedAt = null;
  }

  static fromJSON(data: IArchivable) {
    return new Archivable(data.archivedAt);
  }

  toJSON() {
    return {
      archivedAt: this.archivedAt?.toISOString() ?? null,
    };
  }
}
