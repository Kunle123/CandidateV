// Form Field IDs
export const FORM_IDS = {
  // Auth Forms
  AUTH: {
    NAME: 'auth-name',
    EMAIL: 'auth-email',
    PASSWORD: 'auth-password',
    CONFIRM_PASSWORD: 'auth-confirm-password',
    TERMS: 'auth-terms',
    REMEMBER_ME: 'auth-remember-me'
  },
  
  // Profile Forms
  PROFILE: {
    FIRST_NAME: 'profile-first-name',
    LAST_NAME: 'profile-last-name',
    EMAIL: 'profile-email',
    PHONE: 'profile-phone',
    JOB_TITLE: 'profile-job-title',
    LOCATION: 'profile-location',
    BIO: 'profile-bio',
    AVATAR: 'profile-avatar'
  },

  // Social Links
  SOCIAL: {
    LINKEDIN: 'social-linkedin',
    GITHUB: 'social-github',
    TWITTER: 'social-twitter',
    FACEBOOK: 'social-facebook'
  },

  // CV Forms
  CV: {
    PERSONAL_INFO: {
      FULL_NAME: 'cv-full-name',
      JOB_TITLE: 'cv-job-title',
      EMAIL: 'cv-email',
      PHONE: 'cv-phone',
      LOCATION: 'cv-location',
      SUMMARY: 'cv-summary'
    },
    EDUCATION: {
      INSTITUTION: 'cv-edu-institution',
      DEGREE: 'cv-edu-degree',
      FIELD: 'cv-edu-field',
      START_DATE: 'cv-edu-start-date',
      END_DATE: 'cv-edu-end-date'
    },
    EXPERIENCE: {
      COMPANY: 'cv-exp-company',
      POSITION: 'cv-exp-position',
      LOCATION: 'cv-exp-location',
      START_DATE: 'cv-exp-start-date',
      END_DATE: 'cv-exp-end-date',
      DESCRIPTION: 'cv-exp-description'
    }
  }
};

// Form Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please enter a valid email address'
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    MIN_LENGTH: 'Password must be at least 6 characters',
    MISMATCH: 'Passwords do not match'
  },
  TERMS: 'You must accept the terms and conditions'
};

// Form Button States
export const BUTTON_STATES = {
  AUTH: {
    SIGN_IN: {
      DEFAULT: 'Sign In',
      LOADING: 'Signing in...'
    },
    SIGN_UP: {
      DEFAULT: 'Sign Up',
      LOADING: 'Creating account...'
    }
  },
  PROFILE: {
    SAVE: {
      DEFAULT: 'Save Changes',
      LOADING: 'Saving...'
    }
  },
  CV: {
    SAVE: {
      DEFAULT: 'Save CV',
      LOADING: 'Saving...'
    },
    OPTIMIZE: {
      DEFAULT: 'Optimize CV',
      LOADING: 'Optimizing...'
    }
  }
};

// Form Components Default Props
export const FORM_DEFAULTS = {
  INPUT: {
    size: 'md',
    variant: 'outline',
    focusBorderColor: 'blue.400'
  },
  BUTTON: {
    size: 'md',
    colorScheme: 'blue',
    variant: 'solid'
  },
  CHECKBOX: {
    size: 'md',
    colorScheme: 'blue'
  }
}; 