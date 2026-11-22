
export const LOG_MESSAGES = {
  SUCCESS: {
    DEFAULT: "Operation completed successfully.",
    LOGIN: "Welcome back!",
    LOGOUT: "You have been signed out.",
    ACCOUNT_CREATED: "Account created successfully.",
    PROFILE_UPDATED: "Profile updated successfully.",
    PASSWORD_CHANGED: "Password changed successfully.",

    CREATED: "Record created successfully.",
    UPDATED: "Changes saved successfully.",
    DELETED: "Record deleted successfully.",
    IMPORTED: "Records imported successfully.",

    SCHOOL_UPDATED: "School information updated successfully.",
    STUDENT_CREATED: "Student account created successfully.",
    TEACHER_CREATED: "Teacher account created successfully.",
    CLASS_CREATED: "Class created successfully.",
    SUBJECT_CREATED: "Subject created successfully.",
    ENROLLMENT_CREATED: "Student enrolled successfully.",

    QUESTION_CREATED: "Question added successfully.",
    QUESTION_UPDATED: "Question updated successfully.",
    EXAM_CREATED: "Examination created successfully.",
    EXAM_UPDATED: "Examination updated successfully.",
    EXAM_PUBLISHED: "Examination published successfully.",
    EXAM_ASSIGNED: "Examination assigned successfully.",

    ANSWER_SAVED: "Answer saved.",
    EXAM_SUBMITTED: "Your examination has been submitted successfully.",
    RESULT_RELEASED: "Results released successfully.",
    RECORD_SAVED: "Academic record saved successfully.",
  },

  WARNING: {
    DEFAULT: "Something needs your attention.",
    NETWORK: "Connection is unstable. Please check your connection.",
    UNSAVED_CHANGES: "You have unsaved changes.",
    INCOMPLETE_FORM: "Complete all required fields.",
    RATE_LIMIT: "Too many attempts. Please wait and try again.",

    EXAM_NOT_STARTED: "This examination has not started.",
    EXAM_ENDING: "Your examination time is almost up.",
    EXAM_TIME_UP: "Your examination time has expired.",
    EXAM_ALREADY_SUBMITTED: "You have already submitted this examination.",
    ANSWER_NOT_SAVED: "Your answer has not been saved yet.",
    UNANSWERED_QUESTIONS: "You still have unanswered questions.",
    EXAM_IN_PROGRESS: "You have an examination in progress.",
  },

  ERROR: {
    DEFAULT: "Something went wrong. Please try again.",
    UNAUTHORIZED: "Please sign in to continue.",
    FORBIDDEN: "You do not have permission to perform this action.",
    NOT_FOUND: "The requested record was not found.",
    PAGE_NOT_FOUND: "This page could not be found.",
    SERVER: "A server error occurred. Please try again.",
    VALIDATION: "Please check the information entered.",
    CONNECTION: "Unable to connect to the school server.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",

    CREATE_FAILED: "Unable to create the record.",
    UPDATE_FAILED: "Unable to save changes.",
    DELETE_FAILED: "Unable to delete the record.",
    IMPORT_FAILED: "Unable to import records.",

    LOGIN_FAILED: "Invalid login credentials.",
    ACCOUNT_INACTIVE: "Your account is inactive. Contact the school administrator.",
    ACCOUNT_NOT_FOUND: "Account not found.",
    PASSWORD_CHANGE_FAILED: "Unable to change your password.",

    EXAM_NOT_FOUND: "Examination not found.",
    EXAM_NOT_ASSIGNED: "You are not assigned to this examination.",
    EXAM_UNAVAILABLE: "This examination is currently unavailable.",
    EXAM_EXPIRED: "This examination has ended.",
    EXAM_START_FAILED: "Unable to start the examination.",
    ANSWER_SAVE_FAILED: "Unable to save your answer. Please try again.",
    EXAM_SUBMIT_FAILED: "Unable to submit your examination. Please try again.",

    RESULT_NOT_FOUND: "Result not found.",
    RESULT_NOT_RELEASED: "This result is not yet available.",
    RESULT_ACCESS_DENIED: "You cannot access this result.",
    GRADING_FAILED: "Unable to grade the examination.",
  },

  INFO: {
    DEFAULT: "Everything is up to date.",
    LOADING: "Loading...",
    SAVING: "Saving...",
    FETCHING: "Loading records...",
    SEARCHING: "Searching...",
    PROCESSING: "Processing...",
    SUBMITTING: "Submitting examination...",
    GRADING: "Grading examination...",
    IMPORTING: "Importing records...",
    SYNCING: "Syncing...",
    CONNECTING: "Connecting to school server...",
  },

  PROMPT: {
    DELETE_CONFIRM: "Are you sure you want to delete this record?",
    LOGOUT_CONFIRM: "Are you sure you want to sign out?",
    DEACTIVATE_ACCOUNT: "Deactivate this account?",
    PUBLISH_EXAM: "Publish this examination?",
    CLOSE_EXAM: "Close this examination?",
    SUBMIT_EXAM: "Submit your examination? You cannot change your answers afterward.",
    SUBMIT_UNANSWERED: "Some questions are unanswered. Submit anyway?",
    RELEASE_RESULTS: "Release these results to students?",
    LEAVE_EXAM: "Leave this examination? Your timer may continue running.",
  },

  SYSTEM: {
    ONLINE: "Connected to school server.",
    OFFLINE: "Connection to school server lost.",
    RECONNECTED: "Connection restored.",
    SESSION_RESTORED: "Your session has been restored.",
  },
} as const;

export type LogMessages = typeof LOG_MESSAGES;
