/**
 * Feedback and support types and utilities
 */

export type FeedbackCategory = 'bug' | 'feature_request' | 'improvement' | 'other';

export interface FeedbackSubmission {
  name: string;
  email: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
}

export const FEEDBACK_CATEGORIES: Record<FeedbackCategory, string> = {
  bug: 'Bug Report',
  feature_request: 'Feature Request',
  improvement: 'Improvement Suggestion',
  other: 'Other',
};

export const FEEDBACK_CATEGORY_ICONS: Record<FeedbackCategory, string> = {
  bug: 'bug',
  feature_request: 'sparkles',
  improvement: 'bulb',
  other: 'chatbubble',
};

/**
 * Validate feedback submission
 */
export function validateFeedback(feedback: Partial<FeedbackSubmission>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!feedback.name?.trim()) {
    errors.push('Name is required');
  }

  if (!feedback.email?.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(feedback.email)) {
    errors.push('Please enter a valid email address');
  }

  if (!feedback.category) {
    errors.push('Please select a category');
  }

  if (!feedback.subject?.trim()) {
    errors.push('Subject is required');
  } else if (feedback.subject.trim().length < 3) {
    errors.push('Subject must be at least 3 characters');
  }

  if (!feedback.message?.trim()) {
    errors.push('Message is required');
  } else if (feedback.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
