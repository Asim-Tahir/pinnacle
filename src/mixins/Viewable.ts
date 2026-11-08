export interface IViewable {
  /**
   * @default 0
   */
  viewCount: number;

  /**
   * @default null
   */
  lastViewedAt: Date | null;
}

export class Viewable implements IViewable {
  viewCount: number = 0;
  lastViewedAt: Date | null = null;

  constructor(viewCount: number = 0, lastViewedAt: Date | null = null) {
    this.viewCount = viewCount;
    this.lastViewedAt = lastViewedAt;
  }

  view() {
    this.viewCount++;
    this.lastViewedAt = new Date();
  }

  resetView() {
    this.viewCount = 0;
  }

  static fromJSON(data: IViewable) {
    return new Viewable(data.viewCount, data.lastViewedAt);
  }

  toJSON() {
    return {
      viewCount: this.viewCount,
      lastViewedAt: this.lastViewedAt?.toISOString() ?? null,
    };
  }
}
