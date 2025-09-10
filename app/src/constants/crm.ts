export const CRM_CONSTANTS = {
  MESSAGES: {
    LOADING: "Loading CRM records...",
    FAILED_TO_FETCH: "Failed to fetch CRM data",
    UNKNOWN_COMPANY: "Unknown Company",
    UNKNOWN_CONTACT: "Unknown",
    NO_TRANSLATION: "No translation available",
  },
  UI: {
    TITLE: "CRM Records",
    SUBTITLE: "Manage and view your customer relationship management data",
    DETAILS_TITLE: "CRM Record Details",
    DETAILS_SUBTITLE: "View and analyze customer relationship data and call recordings",
    EMPTY_STATE_TITLE: "No CRM Records Found",
    EMPTY_STATE_DESCRIPTION: "You don't have any CRM records yet. Start by uploading audio files or creating new leads.",
  },
  FALLBACK_DATA: {
    COMPANY: "Unknown Company",
    CONTACT: "Unknown",
    TRANSLATION: "No translation available",
  }
} as const;
