import { createHash } from "crypto";
import type { CanonicalFactCandidate, CanonicalPredicate, CanonicalFactSourceRef } from "./types";

export class CrossSourceDeduplicator {
  private canonicalFingerprints = new Map<string, CanonicalFactCandidate>();
  private duplicateSourceLinksCount = 0;

  /**
   * Generates a source-independent canonical fingerprint.
   * e.g. Mozart + PLACE_OF_BIRTH + Salzburg = Same fingerprint whether from Wikidata or MusicBrainz
   */
  public generateFingerprint(predicate: CanonicalPredicate, subjectName: string, objectValue: string): string {
    const raw = `${predicate}:${subjectName.trim().toLowerCase()}:${objectValue.trim().toLowerCase()}`;
    return createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Ingests and deduplicates a fact candidate. If the fact already exists from another source,
   * it merges the citation and increases confidence.
   */
  public ingestCandidate(candidate: CanonicalFactCandidate): { isNew: boolean; mergedCandidate: CanonicalFactCandidate } {
    const existing = this.canonicalFingerprints.get(candidate.fingerprint);

    if (existing) {
      this.duplicateSourceLinksCount++;
      // Merge source citations
      for (const src of candidate.sources) {
        if (!existing.sources.some((s) => s.sourceName === src.sourceName && s.externalId === src.externalId)) {
          existing.sources.push(src);
        }
      }
      // Boost confidence on multi-source confirmation
      existing.confidence = Math.min(1.0, existing.confidence + 0.15);
      return { isNew: false, mergedCandidate: existing };
    }

    this.canonicalFingerprints.set(candidate.fingerprint, candidate);
    return { isNew: true, mergedCandidate: candidate };
  }

  public getCanonicalCount(): number {
    return this.canonicalFingerprints.size;
  }

  public getDuplicateSourceLinksCount(): number {
    return this.duplicateSourceLinksCount;
  }

  public getAllCandidates(): CanonicalFactCandidate[] {
    return Array.from(this.canonicalFingerprints.values());
  }
}

export const crossSourceDeduplicator = new CrossSourceDeduplicator();
