/**
 * Feature Flags Configuration
 * Set a flag to false to temporarily disable a feature in the UI and navigation.
 * Set to true to re-enable it.
 */
export const FEATURES = {
  /**
   * AI Assistant:
   * Controls AI Assistant in sidebar, top header link, floating button,
   * dashboard AI widget, and assistant page access.
   */
  AI_ASSISTANT: true,

  /**
   * Study Planner:
   * AI-powered revision study planner (part of resources).
   */
  STUDY_PLANNER: true,

  /**
   * Resources Section:
   * Controls Resources group in sidebar (Notices, Study Materials,
   * Study Planner, Notifications) and direct access to those routes.
   */
  RESOURCES: true,
};
