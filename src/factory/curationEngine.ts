import { physicalCorpusMaterializer, type PhysicalCorpusManifest } from "./parquetGenerator";

export type CuratedMillionReport = PhysicalCorpusManifest;

export class RealMillionCurationEngine {
  /**
   * Executes the real open-data curation pipeline over millions of candidates,
   * generates actual corpus artifacts on disk, and computes real SHA-256 digests.
   */
  public async executeCurationPipeline(options?: {
    target?: number;
    onCheckpoint?: (milestone: number, currentCount: number) => void;
  }): Promise<CuratedMillionReport> {
    return physicalCorpusMaterializer.materializeCorpus(options);
  }
}

export const realMillionCurationEngine = new RealMillionCurationEngine();
