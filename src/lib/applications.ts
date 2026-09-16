import type { ApplicationStatus } from './types';

/** The happy path, in order. Used to draw how far an application has travelled. */
export const PIPELINE: ApplicationStatus[] = [
  'SUBMITTED',
  'IN_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
];

/** Statuses a recruiter may set. The candidate alone withdraws. */
export const RECRUITER_STATUSES: ApplicationStatus[] = [
  'IN_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
];

/** Nothing moves once an application lands here. */
export const CLOSED_STATUSES: ApplicationStatus[] = ['HIRED', 'REJECTED', 'WITHDRAWN'];

export function isClosed(status: ApplicationStatus) {
  return CLOSED_STATUSES.includes(status);
}

export function statusLabel(status: ApplicationStatus) {
  return status.replace('_', ' ').toLowerCase();
}

export function statusTone(status: ApplicationStatus): 'success' | 'warning' | 'danger' | undefined {
  switch (status) {
    case 'HIRED':
    case 'OFFER':
    case 'SHORTLISTED':
      return 'success';
    case 'IN_REVIEW':
    case 'INTERVIEW':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    default:
      return undefined;
  }
}

/** Plain-language explanation of where things stand, shown to the candidate. */
export function statusExplainer(status: ApplicationStatus) {
  switch (status) {
    case 'SUBMITTED':
      return 'Your application is with the company. They have not opened it yet.';
    case 'IN_REVIEW':
      return 'Someone at the company is reading your application.';
    case 'SHORTLISTED':
      return 'You made their shortlist. Expect to hear about next steps.';
    case 'INTERVIEW':
      return 'They want to interview you. Watch your messages.';
    case 'OFFER':
      return 'An offer is on the table.';
    case 'HIRED':
      return 'You got the role. Congratulations.';
    case 'REJECTED':
      return 'The company is not moving forward this time.';
    case 'WITHDRAWN':
      return 'You withdrew this application. You can apply again while the job is open.';
    default:
      return '';
  }
}

/** How many of the pipeline steps are behind this application, for the progress bar. */
export function pipelineProgress(status: ApplicationStatus) {
  if (status === 'REJECTED' || status === 'WITHDRAWN') return 0;
  const index = PIPELINE.indexOf(status);
  if (index < 0) return 0;
  return Math.round(((index + 1) / PIPELINE.length) * 100);
}
