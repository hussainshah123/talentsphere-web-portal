export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'VERIFICATION_OFFICER' | 'ADMIN';

export type VerificationStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'VERIFIED'
  | 'SUSPENDED';

export type ProfileStatus = 'DRAFT' | 'IN_REVIEW' | 'LIVE' | 'HIDDEN' | 'SUSPENDED';
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID' | 'FLEXIBLE';
export type ConversationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED' | 'CLOSED';

export interface SessionUser {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  termsAcceptedAt: string | null;
  candidateProfile: {
    id: string;
    fullName: string;
    headline: string | null;
    photoUrl: string | null;
    profileStatus: ProfileStatus;
    verificationStatus: VerificationStatus;
    completeness: number;
  } | null;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    verificationStatus: VerificationStatus;
    myRole: string;
  } | null;
  unreadNotifications: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CandidateSkill {
  id: string;
  proficiency: string;
  yearsExperience: number;
  skill: { id: string; name: string };
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string | null;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export interface Education {
  id: string;
  institute: string;
  degree: string;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  grade: string | null;
}

export interface CandidatePreferences {
  preferredTitles: string[];
  preferredLocations: string[];
  industries: string[];
  employmentTypes: string[];
  relocationAllowed: boolean;
  jobAlertsEnabled: boolean;
}

export interface CandidatePrivacy {
  profileVisible: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showDateOfBirth: boolean;
  showGender: boolean;
  showCurrentEmployer: boolean;
  showSalary: boolean;
  allowRecruiterContact: boolean;
  allowCvDownload: boolean;
}

export interface CandidateProfile {
  id: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  currentTitle: string | null;
  industry: string | null;
  employmentType: string | null;
  noticePeriodDays: number | null;
  availabilityDate: string | null;
  experienceYears: number;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  workMode: WorkMode;
  openToRelocation: boolean;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  websiteUrl: string | null;
  profileStatus: ProfileStatus;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  completeness: number;
  user: { email: string; phone: string | null; emailVerifiedAt: string | null; phoneVerifiedAt: string | null };
  skills: CandidateSkill[];
  workExperiences: WorkExperience[];
  educations: Education[];
  preferences: CandidatePreferences | null;
  privacy: CandidatePrivacy | null;
  cvs: Array<{ id: string; atsScore: number | null; parserStatus: string; createdAt: string; file: { id: string; originalName: string; size: number } }>;
  completenessDetail: {
    score: number;
    missing: string[];
    sections: Array<{ key: string; label: string; weight: number; complete: boolean; hint: string }>;
  };
}

export interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  required: boolean;
  weight: number;
  autoCheck: boolean;
  passed: boolean;
  pendingManualReview: boolean;
  reason: string;
  action: string | null;
}

export interface VerificationSnapshot {
  caseId: string;
  status: VerificationStatus;
  score: number;
  checklist: ChecklistItem[];
  blockingItems: ChecklistItem[];
  canSubmit: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  decisionReason: string | null;
  completeness: number;
}

export interface AtsReport {
  score: number;
  parsingStatus: 'PARSED' | 'PARTIAL' | 'FAILED';
  detectedSections: string[];
  missingSections: string[];
  keywordMatchPercent: number | null;
  matchedKeywords: string[];
  missingKeywords: string[];
  formattingWarnings: string[];
  suggestions: Array<{ severity: 'critical' | 'important' | 'nice-to-have'; message: string }>;
  factors: Array<{ key: string; label: string; weight: number; earned: number; detail: string }>;
  wordCount: number;
  pageCount: number;
  analyzedAt: string;
  disclaimer: string;
  extracted: {
    fullName: string | null;
    emails: string[];
    phones: string[];
    links: { linkedin?: string; github?: string; website?: string };
    skills: string[];
    sections: string[];
    totalYears: number | null;
    educations: Array<{ institute: string; degree: string; year?: string }>;
    experiences: Array<{ company: string; title: string; period: string }>;
  };
}

export interface AtsReportResponse {
  cvId: string;
  fileName: string;
  parserStatus: string;
  parserMessage: string | null;
  analyzedAt: string | null;
  atsScore: number | null;
  report: AtsReport | null;
  extracted: AtsReport['extracted'] | null;
}

export interface SearchResultItem {
  id: string;
  fullName: string;
  headline: string | null;
  currentTitle: string | null;
  location: string | null;
  experienceYears: number;
  workMode: string;
  availabilityDate: string | null;
  verificationStatus: VerificationStatus;
  verified: boolean;
  completeness: number;
  lastActiveAt: string | null;
  skills: string[];
  salary: { min: number | null; max: number | null; currency: string } | null;
  contactable: boolean;
  relevance: number;
}

export interface PublicCandidate {
  id: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  currentTitle: string | null;
  industry: string | null;
  noticePeriodDays: number | null;
  availabilityDate: string | null;
  experienceYears: number;
  workMode: string;
  openToRelocation: boolean;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  websiteUrl: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  completeness: number;
  lastActiveAt: string | null;
  skills: Array<{ id: string; name: string; proficiency: string; yearsExperience: number }>;
  educations: Education[];
  workExperiences: WorkExperience[];
  salary: { min: number | null; max: number | null; currency: string } | null;
  contact: { email: string | null; phone: string | null; contactThroughPlatform: boolean };
  allowRecruiterContact: boolean;
  allowCvDownload: boolean;
  cv: { id: string; fileId: string; atsScore: number | null } | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  skills: string[];
  location: string | null;
  country: string | null;
  workMode: WorkMode;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  experienceMin: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';
  publishedAt: string | null;
  createdAt: string;
  company?: { id: string; name: string; logoUrl: string | null };
  _count?: { matches: number; applications?: number };
}

export interface JobMatchResult {
  jobId: string;
  jobTitle: string;
  disclaimer: string;
  items: Array<{
    candidateId: string;
    fullName: string;
    headline: string | null;
    location: string;
    experienceYears: number;
    verified: boolean;
    atsScore: number | null;
    score: number;
    explanation: {
      skills: { matched: string[]; missing: string[]; score: number };
      experience: { candidateYears: number; requiredYears: number | null; score: number };
      location: { candidate: string | null; job: string | null; score: number };
      workMode: { candidate: string; job: string; score: number };
      salary: { candidateMin: number | null; jobMax: number | null; score: number };
      atsScore: number | null;
    };
  }>;
}

export interface Conversation {
  id: string;
  subject: string | null;
  status: ConversationStatus;
  lastMessageAt: string | null;
  candidate: { id: string; fullName: string; headline: string | null };
  company: { id: string; name: string; logoUrl: string | null };
  messages?: Array<{ id: string; body: string; createdAt: string }>;
  _count?: { messages: number };
}

export interface Message {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  attachmentFileId: string | null;
  mine: boolean;
  senderRole: UserRole;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface SavedCandidate {
  id: string;
  poolName: string;
  notes: string | null;
  stage: string;
  createdAt: string;
  candidate: {
    id: string;
    fullName: string;
    headline: string | null;
    city: string | null;
    country: string | null;
    experienceYears: number;
    verificationStatus: VerificationStatus;
    completeness: number;
  };
}

export interface VerificationCaseSummary {
  id: string;
  status: VerificationStatus;
  score: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  decisionReason: string | null;
  candidate: { id: string; fullName: string; headline: string | null; completeness: number };
  reviewer: { id: string; email: string } | null;
}

export interface VerificationCaseDetail extends VerificationCaseSummary {
  checklistJson: ChecklistItem[] | null;
  candidate: VerificationCaseSummary['candidate'] & {
    user: { email: string; phone: string | null; emailVerifiedAt: string | null };
    verificationStatus: VerificationStatus;
    profileStatus: ProfileStatus;
  };
  events: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    metadataJson: Record<string, unknown> | null;
    actor: { email: string } | null;
  }>;
}

export interface AdminDashboard {
  candidates: { total: number; verified: number; live: number; newLast30Days: number; verificationRate: number };
  verification: { pendingReview: number };
  companies: { total: number; pendingVerification: number };
  moderation: { openReports: number };
  messaging: { conversations: number };
  ats: { cvsAnalysed: number; averageScore: number; parserFailures: number };
}

export interface AiCvReview {
  headline: string;
  priorityFixes: Array<{
    severity: 'critical' | 'important' | 'nice-to-have';
    issue: string;
    fix: string;
    example: string;
  }>;
  rewrittenSummary: string;
  bulletRewrites: Array<{ before: string; after: string; why: string }>;
  keywordsToAdd: string[];
  atsRisks: string[];
  generatedAt: string;
  model: string;
}

export interface AiCvReviewResponse {
  enabled: boolean;
  cached: boolean;
  review: AiCvReview | null;
  message?: string;
}

export interface AiJobFit {
  fitScore: number;
  verdict: string;
  strengths: string[];
  gaps: Array<{ requirement: string; status: 'missing' | 'weak'; howToAddress: string }>;
  tailoredSummary: string;
  bulletRewrites: Array<{ before: string; after: string; why: string }>;
  keywordsToAdd: string[];
  profileUpdates: Array<{ field: string; suggestedValue: string; why: string }>;
  applicationPitch: string;
  generatedAt: string;
  model: string;
}

export interface AiJobFitResponse {
  enabled: boolean;
  keywordMatchPercent: number | null;
  missingKeywords: string[];
  fit: AiJobFit | null;
  message?: string;
}

// --------------------------------------------------------------- applications

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationEvent {
  id: string;
  status: ApplicationStatus;
  note: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  coverNote: string | null;
  /** Snapshots taken when the application was submitted, not live scores. */
  atsScore: number | null;
  matchScore: number | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    location: string | null;
    workMode: string;
    employmentType: string;
    status: string;
    company: { id: string; name: string; logoUrl: string | null };
  };
  candidate?: {
    id: string;
    fullName: string;
    headline: string | null;
    currentTitle: string | null;
    experienceYears: number;
    city: string | null;
    country: string | null;
    verificationStatus: VerificationStatus;
  };
  cv?: { id: string; atsScore: number | null; createdAt?: string } | null;
  events?: ApplicationEvent[];
}

/** Drives the job card: show Apply, show the current status, or point at CV upload. */
export interface ApplicationEligibility {
  application: {
    id: string;
    status: ApplicationStatus;
    createdAt: string;
    updatedAt: string;
  } | null;
  canApply: boolean;
  hasCv: boolean;
}
