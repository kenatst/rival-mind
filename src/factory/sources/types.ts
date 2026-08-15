export type CanonicalPredicate =
  | "CAPITAL_OF"
  | "PLACE_OF_BIRTH"
  | "DATE_OF_BIRTH"
  | "DATE_OF_DEATH"
  | "DIRECTED_BY"
  | "WRITTEN_BY"
  | "PERFORMED_BY"
  | "COMPOSED_BY"
  | "RELEASE_YEAR"
  | "FOUNDED_IN_YEAR"
  | "LOCATED_IN"
  | "MEMBER_OF"
  | "DISCOVERED_BY"
  | "INVENTED_BY"
  | "AWARDED_TO"
  | "CREATOR_OF"
  | "SUBDIVISION_OF"
  | "TAXONOMIC_FAMILY_OF"
  | "DEVELOPED_BY"
  | "HIGHEST_POINT_OF"
  | "CURRENCY_OF"
  | "OFFICIAL_LANGUAGE_OF"
  | "HEADQUARTERS_IN"
  | "CHAMPION_OF";

export interface CanonicalFactSourceRef {
  sourceName: "wikidata" | "musicbrainz" | "openalex" | "geonames";
  externalId: string;
  license: string;
  retrievedAt: string;
  sourceVersion: string;
}

export interface CanonicalFactCandidate {
  candidateId: string;
  fingerprint: string; // sha256(predicate:normalized_subject:normalized_object)
  domain: string;
  category: string;
  subcategory: string;
  topicSlug: string;
  topicPath: string;
  subjectEntityId: string;
  subjectName: string;
  predicate: CanonicalPredicate;
  objectEntityId?: string | undefined;
  objectValue: string;
  qualifiers?: Record<string, any> | undefined;
  sources: CanonicalFactSourceRef[];
  confidence: number; // 0.00 to 1.00
  notability: number; // 0.00 to 1.00
  interestScore: number; // 0.00 to 1.00
  isTimeless: boolean;
}
