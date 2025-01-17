export enum ValidationMessage {
  // General Errors
  CUSTOM_ERROR = "Something went wrong. Please try again later.",

  // User Authentication
  SIGNUP_SUCCESS = "Welcome! You’ve been registered successfully!",
  SIGNUP_FAILED = "Failed to Register User",
  SIGNIN_SUCCESS = "Welcome back! You’ve been signed in successfully!",
  SIGN_IN_FAILED = "Failed to sign in User",
  USER_EXISTS = "This email is already in use. Please log in to access your account.",
  INVALID_CREDENTIALS = "Incorrect username or password",
  USER_DOES_NOT_EXISTS = "User does not exists",

  // Validation Messages
  INVALID_EMAIL = "Invalid email",
  PASSWORD_MIN_LENGTH = "Password must be atleast 8 characters long",
  PASSWORD_MAX_LENGTH = "Password must be atmost 16 characters long",
  NAME_MIN_LENGTH = "Name should be atleast 2 characters long",
  CONTACT_FORMAT = "Contact number must be exactly 10 digits",

  // Informational
  LANDING_PAGE_TITLE = "Transform Speech into Action: Translate, Transcribe, and Summarize Effortlessly",
  LANDINF_PAGE_DESCRIPTION = "Unleash the power of seamless communication with a tool that does it all—accurate transcription, real-time translation, and intelligent summaries in one go.",
}
