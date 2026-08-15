import { createHash } from "crypto";
import type { CanonicalFactCandidate, CanonicalPredicate } from "./types";

export const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export class CrossSourceDeduplicator {
  private canonicalFingerprints = new Map<string, CanonicalFactCandidate>();
  private duplicateSourceLinksCount = 0;

  /**
   * Generates a deterministic, full 256-bit SHA-256 fingerprint for a canonical proposition.
   * CRITICAL: Domain and Category are EXCLUDED from canonical identity so reclassifying
   * or mapping to multiple topics never creates duplicate knowledge entities.
   *
   * Fingerprint = SHA-256(canonical_predicate : normalized_subject : normalized_object [: qualifiers])
   */
  public generateFingerprint(
    predicate: CanonicalPredicate,
    subjectEntityIdOrName: string,
    objectValueOrEntityId: string,
    qualifiers?: Record<string, any>,
  ): string {
    const normSubj = subjectEntityIdOrName.trim().toLowerCase();
    const normObj = objectValueOrEntityId.trim().toLowerCase();
    const qualStr = qualifiers && Object.keys(qualifiers).length > 0 ? JSON.stringify(qualifiers) : "";
    const raw = `${predicate}:${normSubj}:${normObj}${qualStr ? `:${qualStr}` : ""}`;
    return createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Ingests and deduplicates a fact candidate. If the fact already exists from another source,
   * it merges the citation in canonical_fact_sources and computes a calibrated confidence.
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
      // Calibrated multi-source confidence (no blind 1.00 assumption)
      const independenceBonus = existing.sources.length >= 2 ? 0.08 : 0.04;
      existing.confidence = Math.min(0.98, Math.max(existing.confidence, candidate.confidence) + independenceBonus);
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

  public clear(): void {
    this.canonicalFingerprints.clear();
    this.duplicateSourceLinksCount = 0;
  }
}

export const crossSourceDeduplicator = new CrossSourceDeduplicator();
