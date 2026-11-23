import {
  CREATIVE_CASE_STUDY,
  DISCIPLINES,
  EXPERIENCE,
  ExperienceItem,
  GEOLOCATION_CASE_STUDY,
  PROCESS_PILLARS,
  PROFILE,
  PROJECTS,
  PROJECT_TIMELINE_PHASES,
  ProjectCategory,
  ProjectId,
  ProjectSummary,
  ProjectTimelinePhase,
  ROBOT_CASE_STUDY,
  getProjectReadingMinutes,
} from '../data/portfolio';

export type Language = 'en' | 'ml';

export interface TextSegmentCopy {
  text: string;
  accent?: boolean;
}

export interface TranslationBundle {
  skipToMain: string;
  nav: {
    primaryAria: string;
    mobileAria: string;
    about: string;
    work: string;
    experience: string;
    contact: string;
    getInTouch: string;
    lightMode: string;
    darkMode: string;
    switchToLightAria: string;
    switchToDarkAria: string;
    openMenuAria: string;
    closeMenuAria: string;
    languageToggleAria: string;
    languageToggleTitle: string;
    languageLabel: string;
  };
  dividers: {
    works: { label: string; descriptor: string };
    experience: { label: string; descriptor: string };
    contact: { label: string; descriptor: string };
  };
  scrollRuler: {
    ariaLabel: string;
    sections: {
      about: string;
      work: string;
      experience: string;
      contact: string;
    };
  };
  about: {
    eyebrow: string;
    headlineSegments: TextSegmentCopy[];
    bioPrefix: string;
    bioMiddle: string;
    bioEnd: string;
    quote: string;
    secondPara: string;
    coreDisciplines: string;
    selectDisciplineHint: string;
    experienceEyebrow: string;
    experienceTitle: string;
    experienceSubtitle: string;
  };
  techCloud: {
    eyebrow: string;
    title: string;
    fieldGroupAria: string;
    modes: {
      mixed: string;
      attract: string;
      repel: string;
    };
    attract: string;
    repel: string;
    attractsTooltip: string;
    repelsTooltip: string;
    dragHint: string;
    nodeDisciplines: Record<string, string>;
  };
  timeline: {
    tabsAria: string;
    all: string;
    role: string;
    education: string;
    orderLabel: string;
    earliestToPresent: string;
    presentToEarliest: string;
    orderAriaAsc: string;
    orderAriaDesc: string;
    educationBadge: string;
    roleBadge: string;
  };
  works: {
    eyebrow: string;
    title: string;
    tabsAria: string;
    filters: Record<ProjectCategory, string>;
    readCaseStudy: string;
    expandSpecs: string;
    hideSpecs: string;
    technicalSpecs: string;
    parametersSuffix: string;
    projectConstraints: string;
    boundariesSuffix: string;
    minReadSuffix: string;
  };
  caseStudy: {
    caseStudyPrefix: string;
    progressAria: string;
    progressTitlePrefix: string;
    switchGroupAria: string;
    prevPrefix: string;
    nextPrefix: string;
    close: string;
    closeAria: string;
    previous: string;
    next: string;
    timelineAria: string;
    timelineTitle: string;
    phaseWord: string;
    prevPhaseAria: string;
    nextPhaseAria: string;
    competency: {
      eyebrow: string;
      title: string;
      subtitle: string;
      envelopeToggle: string;
      activeLegend: string;
      envelopeLegend: string;
      radarAria: string;
      stackHeading: string;
      focusHint: string;
      axes: {
        frontendUi: string;
        visualDesign: string;
        embeddedFirmware: string;
        rfTelemetry: string;
        sensorsDsp: string;
        systemsArch: string;
      };
      categories: {
        visualVector: string;
        frontendMotion: string;
        architectureCraft: string;
        embeddedActuation: string;
        sensorsVision: string;
        commsOperator: string;
        rfCompute: string;
        inertialDsp: string;
        simulationFirmware: string;
      };
    };
    creative: {
      sec1: string;
      sec1Intro: string;
      sec2: string;
      guidingPillars: string;
      sec3: string;
    };
    robot: {
      sec1: string;
      sec2: string;
      sec3: string;
      sec4: string;
      sec5: string;
      operatorConsole: string;
      remoteController: string;
      wirelessLink: string;
      mcuRpi: string;
      motors: string;
      camera: string;
      cameraDetail: string;
      sensors: string;
      workingPrinciple: string;
      conclusion: string;
    };
    geo: {
      sec1: string;
      sec2: string;
      sec3: string;
      sec4: string;
      sec5: string;
      sec5Sub: string;
      anchorDistance: string;
      meterUnit: string;
      envExponent: string;
      predictedRssi: string;
      sec6: string;
      colSubsystem: string;
      colModel: string;
      colRole: string;
      softwareToolchain: string;
      applications: string;
      advantages: string;
      roadmap: string;
      conclusion: string;
    };
  };
  contact: {
    eyebrow: string;
    headlineSegments: TextSegmentCopy[];
    intro: string;
    formAria: string;
    websiteTrap: string;
    dearPrefix: string;
    fields: {
      re: string;
      from: string;
      via: string;
    };
    monthsFull: string[];
    inquirySubjectSrOnly: string;
    inquiryKinds: {
      collab: string;
      hello: string;
    };
    fromPlaceholder: string;
    validEmailAria: string;
    validBadge: string;
    viaPlaceholder: string;
    suggestions: string;
    showSuggestionsAria: string;
    hideSuggestionsAria: string;
    viaListboxAria: string;
    viaSuggestions: string[];
    letterSrOnly: string;
    bodyPlaceholder: string;
    formattingAria: string;
    boldTitle: string;
    boldAria: string;
    italicTitle: string;
    italicAria: string;
    boldSample: string;
    italicSample: string;
    sincerely: string;
    signAria: string;
    signHint: string;
    yourNameAria: string;
    yourNamePlaceholder: string;
    clearSignature: string;
    replyPromise: string;
    letterStatuses: {
      received: string;
      ready: string;
      signed: string;
      unsigned: string;
    };
    sendIt: string;
    whatsapp: string;
    keepCopy: string;
    writeAnother: string;
    toastCopiedHeading: string;
    toastCopySaved: string;
    stampBrand: string;
    stampDispatched: string;
    dispatch: {
      titlePrefix: string;
      subtitle: string;
      summaryHeading: string;
      refId: string;
      submitted: string;
      targetReply: string;
      channel: string;
      channelEmail: string;
      channelWhatsapp: string;
      detailsHeading: string;
      subject: string;
      name: string;
      replyEmail: string;
      referral: string;
      signature: string;
      handSignedFallback: string;
      directVisitFallback: string;
      sigBoth: string;
      sigDrawn: string;
      sigTyped: string;
      messageHeading: string;
      timezone: string;
    };
    errors: {
      emailEmpty: string;
      emailTooLong: string;
      emailInvalid: string;
      bodyEmpty: string;
      bodyTooLong: string;
      signMissing: string;
      signTooLong: string;
    };
    ticket: {
      aria: string;
      header: string;
      counter: string;
      job: string;
      received: string;
      replyBy: string;
      status: string;
      fileUnder: string;
      keepHalf: string;
      statuses: {
        received: string;
        ready: string;
        signedDraft: string;
        writing: string;
      };
    };
    footer: {
      craftedWithPrecision: string;
      linkedin: string;
      instagram: string;
    };
    signatureModal: {
      ariaLabel: string;
      signHere: string;
      instructions: string;
      padAria: string;
      cancel: string;
      clear: string;
      done: string;
    };
  };
  companion: {
    buttonAria: string;
    prompts: Record<'about' | 'work' | 'experience' | 'contact', { line: string; cta: string }>;
    emotions: Record<'happy' | 'love' | 'laugh' | 'cool' | 'shy' | 'surprised', string>;
    actions: {
      dance: string;
      radar: string;
      wave: string;
      spin: string;
      dock: string;
      roam: string;
    };
  };
  audio: {
    muteAria: string;
    enableAria: string;
    floatingOnTitle: string;
    floatingOffTitle: string;
    inlineOnTitle: string;
    inlineOffTitle: string;
  };
  backToTop: {
    ariaLabel: string;
  };
  preloader: {
    loadingSuffix: string;
  };
  liveClock: {
    ariaPrefix: string;
  };
  portfolio: {
    profile: typeof PROFILE;
    disciplines: typeof DISCIPLINES;
    projects: ProjectSummary[];
    experience: ExperienceItem[];
    processPillars: typeof PROCESS_PILLARS;
    creativeCaseStudy: typeof CREATIVE_CASE_STUDY;
    robotCaseStudy: typeof ROBOT_CASE_STUDY;
    geolocationCaseStudy: typeof GEOLOCATION_CASE_STUDY;
    projectTimelinePhases: Record<ProjectId, ProjectTimelinePhase[]>;
  };
}

const EN_TRANSLATIONS: TranslationBundle = {
  skipToMain: 'Skip to main content',
  nav: {
    primaryAria: 'Primary Navigation',
    mobileAria: 'Mobile Navigation',
    about: 'About',
    work: 'Work',
    experience: 'Experience',
    contact: 'Contact',
    getInTouch: 'Get in Touch',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    switchToLightAria: 'Switch to light theme',
    switchToDarkAria: 'Switch to dark theme',
    openMenuAria: 'Open navigation menu',
    closeMenuAria: 'Close navigation menu',
    languageToggleAria: 'Switch language to Malayalam',
    languageToggleTitle: 'Switch to Malayalam (മലയാളം)',
    languageLabel: 'Language',
  },
  dividers: {
    works: { label: 'Selected Works', descriptor: 'Case Studies & Research' },
    experience: { label: 'Professional Background', descriptor: 'Roles & Academic Journey' },
    contact: { label: 'Direct Connection', descriptor: 'Collaborations & Inquiries' },
  },
  scrollRuler: {
    ariaLabel: 'Page scroll ruler',
    sections: {
      about: 'Origins & Ethos',
      work: 'Selected Works',
      experience: 'Journey',
      contact: 'Connection',
    },
  },
  about: {
    eyebrow: '01. Origins & Ethos',
    headlineSegments: [
      { text: 'Where applied electronics meets ' },
      { text: 'intentional', accent: true },
      { text: ' design.' },
    ],
    bioPrefix: 'I am ',
    bioMiddle: ', a creative developer and visual designer based in ',
    bioEnd:
      '. Holding a {education}, my work lives at the intersection of tactile hardware systems and human-centered web software.',
    quote:
      '“I don’t just build interfaces; I construct digital architectures that prioritize human intuition over technical complexity.”',
    secondPara:
      'Whether calibrating an RF trilateration filter on an ESP32 or refining bezier curves in Affinity and Illustrator, I bring disciplined engineering clarity to expressive creative execution.',
    coreDisciplines: 'Core Disciplines',
    selectDisciplineHint: 'Select a discipline to filter Selected Works ↓',
    experienceEyebrow: '03. Journey',
    experienceTitle: 'Experience & Academic Foundation',
    experienceSubtitle:
      'Multidisciplinary progression across digital brand strategy, full-stack web engineering, and postgraduate applied electronics research.',
  },
  techCloud: {
    eyebrow: '3D Orbital Stack',
    title: 'Technology Globe',
    fieldGroupAria: 'Technology globe cursor polarity',
    modes: {
      mixed: 'Mixed Field',
      attract: 'Attract',
      repel: 'Repel',
    },
    attract: 'Attract',
    repel: 'Repel',
    attractsTooltip: 'Attracts to cursor',
    repelsTooltip: 'Repels from cursor',
    dragHint: '· Drag sphere to orbit',
    nodeDisciplines: {
      react: 'Interactive UI Architecture',
      typescript: 'Type-Safe Engineering',
      illustrator: 'Bezier Vector Craft',
      robotics: 'Autonomous Actuation',
      nodejs: 'Server & API Workflows',
      'embedded-c': 'Deterministic Firmware',
      affinity: 'Visual Brand Systems',
      kalman: 'Signal Path-Loss Smoothing',
      motion: 'Spring Kinetic Systems',
      sensors: 'Spatial Orientation Fusion',
    },
  },
  timeline: {
    tabsAria: 'Filter career and academic timeline',
    all: 'All Milestones',
    role: 'Professional Roles',
    education: 'Education',
    orderLabel: 'Order:',
    earliestToPresent: 'Earliest → Present',
    presentToEarliest: 'Present → Earliest',
    orderAriaAsc: 'Sort order: Earliest to Present',
    orderAriaDesc: 'Sort order: Present to Earliest',
    educationBadge: 'Education',
    roleBadge: 'Professional Role',
  },
  works: {
    eyebrow: '02. Selected Works',
    title: 'Case Studies & Hardware Research',
    tabsAria: 'Filter projects by discipline',
    filters: {
      all: 'All Works',
      design: 'Visual Design',
      robotics: 'Robotics & IoT',
      rf: 'RF Systems',
    },
    readCaseStudy: 'Read Case Study',
    expandSpecs: 'Expand Specs',
    hideSpecs: 'Hide Specs',
    technicalSpecs: 'Technical Specifications',
    parametersSuffix: 'Parameters',
    projectConstraints: 'Project Constraints',
    boundariesSuffix: 'Boundaries',
    minReadSuffix: 'min read',
  },
  caseStudy: {
    caseStudyPrefix: 'Case Study',
    progressAria: 'Case study reading progress',
    progressTitlePrefix: 'Reading progress',
    switchGroupAria: 'Switch case study',
    prevPrefix: 'Previous case study',
    nextPrefix: 'Next case study',
    close: 'Close',
    closeAria: 'Close case study (Escape)',
    previous: 'Previous',
    next: 'Next',
    timelineAria: 'Project timeline phases',
    timelineTitle: 'Project Timeline',
    phaseWord: 'Phase',
    prevPhaseAria: 'Previous project phase',
    nextPhaseAria: 'Next project phase',
    competency: {
      eyebrow: 'Stack & Competency Snapshot',
      title: 'Engineering Competency Radar',
      subtitle:
        'Cross-disciplinary proficiency profile mapped alongside categorized tools and hardware.',
      envelopeToggle: 'Overall Profile',
      activeLegend: 'Project Focus',
      envelopeLegend: 'Portfolio Envelope',
      radarAria: 'Engineering competency radar chart',
      stackHeading: 'Categorized Tech Stack',
      focusHint: 'Hover or tap an axis or category to highlight its stack',
      axes: {
        frontendUi: 'UI & Frontend',
        visualDesign: 'Visual & Vector',
        embeddedFirmware: 'Embedded & MCU',
        rfTelemetry: 'RF & Telemetry',
        sensorsDsp: 'Sensors & DSP',
        systemsArch: 'Systems & UX',
      },
      categories: {
        visualVector: 'Visual & Vector',
        frontendMotion: 'Frontend & Motion',
        architectureCraft: 'Architecture & Craft',
        embeddedActuation: 'Embedded & Actuation',
        sensorsVision: 'Sensors & Vision',
        commsOperator: 'RF & Telemetry Link',
        rfCompute: 'RF & Compute Node',
        inertialDsp: 'Inertial Fusion & DSP',
        simulationFirmware: 'Simulation & Toolchain',
      },
    },
    creative: {
      sec1: '01. Creative Methodology',
      sec1Intro:
        'Merging the analytical approach of applied electronics engineering with the expressive freedom of visual design. Every project begins on a structural grid before introducing organic typography and motion.',
      sec2: '02. Core Philosophy',
      guidingPillars: 'Guiding Pillars',
      sec3: '03. Studio Craft & Toolkit',
    },
    robot: {
      sec1: '01. Abstract & Context',
      sec2: '02. Mission Objectives',
      sec3: '03. Hardware Stack',
      sec4: '04. Software & Telemetry',
      sec5: '05. System Architecture & Signal Flow',
      operatorConsole: 'Operator Console',
      remoteController: 'Remote Controller / Laptop',
      wirelessLink: 'Wireless RF / Wi-Fi Link',
      mcuRpi: 'Microcontroller / Raspberry Pi',
      motors: 'Motors',
      camera: 'Camera',
      cameraDetail: 'Stream',
      sensors: 'Sensors',
      workingPrinciple: 'Working Principle',
      conclusion: 'Conclusion',
    },
    geo: {
      sec1: '01. Research Abstract',
      sec2: '02. Limitations of Satellite GPS',
      sec3: '03. Proposed RF Architecture',
      sec4: '04. Localization Pipeline',
      sec5: '05. Logarithmic Path-Loss Model',
      sec5Sub:
        'Interactive signal attenuation explorer based on SX1278 LoRa RSSI calibration.',
      anchorDistance: 'Anchor Distance (d)',
      meterUnit: 'm',
      envExponent: 'Environment Exponent (n)',
      predictedRssi: 'Predicted RSSI',
      sec6: '06. Hardware & Software Stack',
      colSubsystem: 'Subsystem',
      colModel: 'Component Model',
      colRole: 'Role in Architecture',
      softwareToolchain: 'Software Toolchain',
      applications: 'Applications',
      advantages: 'System Advantages',
      roadmap: 'Future Roadmap',
      conclusion: 'Conclusion',
    },
  },
  contact: {
    eyebrow: '04. Connection',
    headlineSegments: [
      { text: "Let's build something " },
      { text: 'meaningful', accent: true },
      { text: ' together.' },
    ],
    intro:
      'Compose a short note on the desk below, sign it by hand or name, and dispatch it directly via email or WhatsApp.',
    formAria: 'Project inquiry letter',
    websiteTrap: 'Website',
    dearPrefix: 'Dear',
    fields: {
      re: 'RE ::',
      from: 'FROM ::',
      via: 'VIA ::',
    },
    monthsFull: [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ],
    inquirySubjectSrOnly: 'Inquiry subject',
    inquiryKinds: {
      collab: 'A collaboration',
      hello: 'Just a hello',
    },
    fromPlaceholder: 'you@studio.com',
    validEmailAria: 'Valid email',
    validBadge: 'valid',
    viaPlaceholder: 'A friend, LinkedIn, Instagram, a search… (optional)',
    suggestions: 'suggestions',
    showSuggestionsAria: 'Show referral suggestions',
    hideSuggestionsAria: 'Hide referral suggestions',
    viaListboxAria: 'Referral source suggestions',
    viaSuggestions: [
      'LinkedIn',
      'Instagram',
      'Friend or Colleague',
      'Google Search',
      'Direct Visit',
    ],
    letterSrOnly: 'The letter',
    bodyPlaceholder: 'What are we making?',
    formattingAria: 'Message text formatting',
    boldTitle: 'Bold selection (*text*, Ctrl+B)',
    boldAria: 'Bold selected text',
    italicTitle: 'Italic selection (_text_, Ctrl+I)',
    italicAria: 'Italicize selected text',
    boldSample: 'bold text',
    italicSample: 'italic text',
    sincerely: 'Sincerely,',
    signAria: 'Sign your name',
    signHint: 'sign here (click or tap)',
    yourNameAria: 'Your name',
    yourNamePlaceholder: 'Your name',
    clearSignature: 'clear signature',
    replyPromise: 'ONE REPLY, NO NEWSLETTER',
    letterStatuses: {
      received: 'RECEIVED',
      ready: 'READY TO SEND',
      signed: 'SIGNED',
      unsigned: 'NOT YET SIGNED',
    },
    sendIt: 'Send it',
    whatsapp: 'WhatsApp',
    keepCopy: 'Keep a copy',
    writeAnother: 'Write another',
    toastCopiedHeading: 'Copied!',
    toastCopySaved: 'Formatted copy saved to clipboard',
    stampBrand: 'AADESH PS · PRESS',
    stampDispatched: 'DISPATCHED',
    dispatch: {
      titlePrefix: 'PORTFOLIO CORRESPONDENCE',
      subtitle: 'Project Inquiry & Collaboration Dispatch',
      summaryHeading: 'DISPATCH SUMMARY',
      refId: 'Reference ID',
      submitted: 'Submitted',
      targetReply: 'Target Reply',
      channel: 'Channel',
      channelEmail: 'Email',
      channelWhatsapp: 'WhatsApp',
      detailsHeading: 'CORRESPONDENT DETAILS',
      subject: 'Subject (RE)',
      name: 'Name',
      replyEmail: 'Reply Email',
      referral: 'Referral (VIA)',
      signature: 'Signature',
      handSignedFallback: '(Hand-signed)',
      directVisitFallback: 'Direct visit',
      sigBoth: 'Hand-drawn + Typed name',
      sigDrawn: 'Hand-drawn signature',
      sigTyped: 'Typed name',
      messageHeading: 'MESSAGE',
      timezone: 'IST',
    },
    errors: {
      emailEmpty: 'Please include your reply email address.',
      emailTooLong: 'Email address must be 160 characters or fewer.',
      emailInvalid: 'Enter a valid email address (e.g. you@studio.com).',
      bodyEmpty: 'Write a short note on what you are making.',
      bodyTooLong: 'Message must be 6000 characters or fewer.',
      signMissing: 'Please sign above or enter your name.',
      signTooLong: 'Name must be 120 characters or fewer.',
    },
    ticket: {
      aria: 'Job ticket',
      header: 'AADESH PS :: PRESS',
      counter: 'INTAKE · COUNTER 01',
      job: 'JOB',
      received: 'RECEIVED',
      replyBy: 'REPLY BY',
      status: 'STATUS',
      fileUnder: 'FILE UNDER',
      keepHalf: 'KEEP THIS HALF',
      statuses: {
        received: 'RECEIVED',
        ready: 'READY TO SEND',
        signedDraft: 'SIGNED · DRAFT',
        writing: 'BEING WRITTEN',
      },
    },
    footer: {
      craftedWithPrecision: 'Crafted with precision',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
    },
    signatureModal: {
      ariaLabel: 'Sign your name',
      signHere: 'SIGN HERE',
      instructions: 'WITH YOUR FINGER, MOUSE OR PEN',
      padAria: 'Signature pad',
      cancel: 'Cancel',
      clear: 'Clear',
      done: 'Done',
    },
  },
  companion: {
    buttonAria:
      'Interactive robotic companion — click to react, tap 5x for overdrive, double-click to spin, drag to move, or use arrow keys',
    prompts: {
      about: { line: 'Electronics meets software', cta: 'Works ↓' },
      work: { line: 'Inspecting projects & RF craft', cta: 'Journey ↓' },
      experience: { line: 'Tracing roles & research', cta: 'Contact ↓' },
      contact: { line: 'Ready to collaborate', cta: 'Top ↑' },
    },
    emotions: {
      happy: 'Happy',
      love: 'Love',
      laugh: 'Laugh',
      cool: 'Cool',
      shy: 'Shy',
      surprised: 'Whoa',
    },
    actions: {
      dance: 'Dance',
      radar: 'Radar',
      wave: 'Wave',
      spin: 'Spin',
      dock: 'Dock',
      roam: 'Roam',
    },
  },
  audio: {
    muteAria: 'Mute spatial audio cues',
    enableAria: 'Enable spatial audio cues',
    floatingOnTitle: 'Spatial Audio: On (click to mute)',
    floatingOffTitle: 'Spatial Audio: Muted (click to enable)',
    inlineOnTitle: 'Spatial Audio: On',
    inlineOffTitle: 'Spatial Audio: Muted',
  },
  backToTop: {
    ariaLabel: 'Back to top',
  },
  preloader: {
    loadingSuffix: 'portfolio',
  },
  liveClock: {
    ariaPrefix: 'Local time in Kerala, India',
  },
  portfolio: {
    profile: PROFILE,
    disciplines: DISCIPLINES,
    projects: PROJECTS,
    experience: EXPERIENCE,
    processPillars: PROCESS_PILLARS,
    creativeCaseStudy: CREATIVE_CASE_STUDY,
    robotCaseStudy: ROBOT_CASE_STUDY,
    geolocationCaseStudy: GEOLOCATION_CASE_STUDY,
    projectTimelinePhases: PROJECT_TIMELINE_PHASES,
  },
};

const ML_TRANSLATIONS: TranslationBundle = {
  skipToMain: 'പ്രധാന ഉള്ളടക്കത്തിലേക്ക് കടക്കുക',
  nav: {
    primaryAria: 'പ്രധാന നാവിഗേഷൻ',
    mobileAria: 'മൊബൈൽ നാവിഗേഷൻ',
    about: 'എന്നെക്കുറിച്ച്',
    work: 'സൃഷ്ടികൾ',
    experience: 'പ്രവൃത്തിപരിചയം',
    contact: 'ബന്ധപ്പെടുക',
    getInTouch: 'ബന്ധപ്പെടുക',
    lightMode: 'ലൈറ്റ് മോഡ്',
    darkMode: 'ഡാർക്ക് മോഡ്',
    switchToLightAria: 'ലൈറ്റ് തീമിലേക്ക് മാറുക',
    switchToDarkAria: 'ഡാർക്ക് തീമിലേക്ക് മാറുക',
    openMenuAria: 'നാവിഗേഷൻ മെനു തുറക്കുക',
    closeMenuAria: 'നാവിഗേഷൻ മെനു അടയ്ക്കുക',
    languageToggleAria: 'ഇംഗ്ലീഷ് ഭാഷയിലേക്ക് മാറുക',
    languageToggleTitle: 'Switch to English (ഇംഗ്ലീഷിലേക്ക് മാറുക)',
    languageLabel: 'ഭാഷ',
  },
  dividers: {
    works: { label: 'തിരഞ്ഞെടുത്ത സൃഷ്ടികൾ', descriptor: 'കേസ് സ്റ്റഡികളും ഗവേഷണവും' },
    experience: { label: 'തൊഴിൽ പശ്ചാത്തലം', descriptor: 'പദവികളും പഠനയാത്രയും' },
    contact: { label: 'നേരിട്ടുള്ള ബന്ധം', descriptor: 'സഹകരണങ്ങളും അന്വേഷണങ്ങളും' },
  },
  scrollRuler: {
    ariaLabel: 'പേജ് സ്ക്രോൾ സ്കെയിൽ',
    sections: {
      about: 'ആമുഖവും ദർശനവും',
      work: 'തിരഞ്ഞെടുത്ത സൃഷ്ടികൾ',
      experience: 'പഠന-തൊഴിൽ യാത്ര',
      contact: 'നേരിട്ടുള്ള ബന്ധം',
    },
  },
  about: {
    eyebrow: '01. ആമുഖവും ദർശനവും',
    headlineSegments: [
      { text: 'അപ്ലൈഡ് ഇലക്ട്രോണിക്സും ' },
      { text: 'കരുതലോടെയുള്ള', accent: true },
      { text: ' ഡിസൈനും ഒന്നിക്കുന്നിടം.' },
    ],
    bioPrefix: 'ഞാൻ ',
    bioMiddle: ' — ',
    bioEnd:
      ' ആസ്ഥാനമായി പ്രവർത്തിക്കുന്ന ഒരു ക്രിയേറ്റീവ് ഡെവലപ്പറും വിഷ്വൽ ഡിസൈനറുമാണ്. {education} നേടിയ എന്റെ പ്രവർത്തനങ്ങൾ പ്രായോഗിക ഹാർഡ്‌വെയർ സംവിധാനങ്ങളുടെയും മനുഷ്യസൗഹൃദ വെബ് സോഫ്റ്റ്‌വെയറിന്റെയും സംഗമസ്ഥാനത്താണ്.',
    quote:
      '“ഞാൻ ഇന്റർഫേസുകൾ നിർമ്മിക്കുക മാത്രമല്ല; സാങ്കേതിക സങ്കീർണ്ണതയ്ക്ക് പകരം മനുഷ്യന്റെ സഹജാവബോധത്തിന് മുൻഗണന നൽകുന്ന ഡിജിറ്റൽ ഘടനകൾ രൂപപ്പെടുത്തുകയാണ് ചെയ്യുന്നത്.”',
    secondPara:
      'ESP32-ൽ ഒരു RF ട്രൈലാറ്ററേഷൻ ഫിൽട്ടർ ട്യൂൺ ചെയ്യുമ്പോഴും Affinity, Illustrator എന്നിവയിൽ ബെസിയർ വരകൾ മിനുക്കുമ്പോഴും, കൃത്യമായ എഞ്ചിനീയറിംഗ് ചിട്ടയും സർഗ്ഗാത്മകതയും ഞാൻ ഒരുമിപ്പിക്കുന്നു.',
    coreDisciplines: 'പ്രധാന മേഖലകൾ',
    selectDisciplineHint: 'തിരഞ്ഞെടുത്ത സൃഷ്ടികൾ ഫിൽട്ടർ ചെയ്യാൻ ഒരു മേഖല തിരഞ്ഞെടുക്കുക ↓',
    experienceEyebrow: '03. യാത്ര',
    experienceTitle: 'പ്രവൃത്തിപരിചയവും വിദ്യാഭ്യാസ അടിത്തറയും',
    experienceSubtitle:
      'ഡിജിറ്റൽ ബ്രാൻഡ് തന്ത്രങ്ങൾ, ഫുൾ-സ്റ്റാക്ക് വെബ് എഞ്ചിനീയറിംഗ്, അപ്ലൈഡ് ഇലക്ട്രോണിക്സ് ബിരുദാനന്തര ഗവേഷണം എന്നിവയിലൂടെയുള്ള ബഹുമുഖ വളർച്ച.',
  },
  techCloud: {
    eyebrow: '3D ഓർബിറ്റൽ സ്റ്റാക്ക്',
    title: 'സാങ്കേതിക ഗോളം',
    fieldGroupAria: 'സാങ്കേതിക ഗോളത്തിലെ കർസർ സ്വാധീന രീതി',
    modes: {
      mixed: 'മിശ്രിത ഫീൽഡ്',
      attract: 'ആകർഷണം',
      repel: 'വികർഷണം',
    },
    attract: 'ആകർഷണം',
    repel: 'വികർഷണം',
    attractsTooltip: 'കർസറിലേക്ക് ആകർഷിക്കുന്നു',
    repelsTooltip: 'കർസറിൽ നിന്ന് അകലുന്നു',
    dragHint: '· തിരിക്കാൻ ഗോളം ഡ്രാഗ് ചെയ്യുക',
    nodeDisciplines: {
      react: 'ഇന്ററാക്ടീവ് വെബ് ഇന്റർഫേസുകൾ',
      typescript: 'ടൈപ്പ്-സുരക്ഷിത സോഫ്റ്റ്‌വെയർ വികസനം',
      illustrator: 'ബെസിയർ വെക്റ്റർ ഡിസൈൻ',
      robotics: 'സ്വയംനിയന്ത്രിത റോബോട്ടിക്സ്',
      nodejs: 'സെർവർ & API സംവിധാനങ്ങൾ',
      'embedded-c': 'കൃത്യതയുള്ള എംബഡഡ് ഫേംവെയർ',
      affinity: 'വിഷ്വൽ ബ്രാൻഡ് രൂപകൽപ്പന',
      kalman: 'സിഗ്നൽ ഫിൽട്ടറിംഗും കൃത്യതയും',
      motion: 'ചലനാത്മക സ്പ്രിംഗ് ആനിമേഷൻ',
      sensors: 'സെൻസർ ദിശാ സംയോജനം',
    },
  },
  timeline: {
    tabsAria: 'തൊഴിൽ-പഠന ടൈംലൈൻ ഫിൽട്ടർ ചെയ്യുക',
    all: 'എല്ലാ നാഴികക്കല്ലുകളും',
    role: 'തൊഴിൽ പരിചയം',
    education: 'വിദ്യാഭ്യാസം',
    orderLabel: 'ക്രമം:',
    earliestToPresent: 'പഴയത് → പുതിയത്',
    presentToEarliest: 'പുതിയത് → പഴയത്',
    orderAriaAsc: 'ക്രമം: പഴയതിൽ നിന്ന് പുതിയതിലേക്ക്',
    orderAriaDesc: 'ക്രമം: പുതിയതിൽ നിന്ന് പഴയതിലേക്ക്',
    educationBadge: 'വിദ്യാഭ്യാസം',
    roleBadge: 'തൊഴിൽ പദവി',
  },
  works: {
    eyebrow: '02. തിരഞ്ഞെടുത്ത സൃഷ്ടികൾ',
    title: 'കേസ് സ്റ്റഡികളും ഹാർഡ്‌വെയർ ഗവേഷണവും',
    tabsAria: 'മേഖല അനുസരിച്ച് പ്രോജക്റ്റുകൾ ഫിൽട്ടർ ചെയ്യുക',
    filters: {
      all: 'എല്ലാം',
      design: 'വിഷ്വൽ ഡിസൈൻ',
      robotics: 'റോബോട്ടിക്സ് & IoT',
      rf: 'RF സിസ്റ്റങ്ങൾ',
    },
    readCaseStudy: 'കേസ് സ്റ്റഡി വായിക്കുക',
    expandSpecs: 'വിശദാംശങ്ങൾ കാണുക',
    hideSpecs: 'വിശദാംശങ്ങൾ മറയ്ക്കുക',
    technicalSpecs: 'സാങ്കേതിക സവിശേഷതകൾ',
    parametersSuffix: 'ഘടകങ്ങൾ',
    projectConstraints: 'പ്രോജക്റ്റ് പരിമിതികൾ',
    boundariesSuffix: 'നിബന്ധനകൾ',
    minReadSuffix: 'മിനിറ്റ് വായന',
  },
  caseStudy: {
    caseStudyPrefix: 'കേസ് സ്റ്റഡി',
    progressAria: 'കേസ് സ്റ്റഡി വായനാ പുരോഗതി',
    progressTitlePrefix: 'വായനാ പുരോഗതി',
    switchGroupAria: 'കേസ് സ്റ്റഡി മാറ്റുക',
    prevPrefix: 'മുൻ കേസ് സ്റ്റഡി',
    nextPrefix: 'അടുത്ത കേസ് സ്റ്റഡി',
    close: 'അടയ്ക്കുക',
    closeAria: 'കേസ് സ്റ്റഡി അടയ്ക്കുക (Escape)',
    previous: 'മുമ്പത്തേത്',
    next: 'അടുത്തത്',
    timelineAria: 'പ്രോജക്റ്റ് ഘട്ടങ്ങൾ',
    timelineTitle: 'പ്രോജക്റ്റ് ടൈംലൈൻ',
    phaseWord: 'ഘട്ടം',
    prevPhaseAria: 'മുൻ പ്രോജക്റ്റ് ഘട്ടം',
    nextPhaseAria: 'അടുത്ത പ്രോജക്റ്റ് ഘട്ടം',
    competency: {
      eyebrow: 'സാങ്കേതിക ശേഷി അവലോകനം',
      title: 'എഞ്ചിനീയറിംഗ് കോമ്പിറ്റൻസി റഡാർ',
      subtitle:
        'ഈ പ്രോജക്റ്റിലെ വിവിധ മേഖലകളിലെ പ്രാവീണ്യവും വിഭാഗീകരിച്ച ടെക് സ്റ്റാക്കും.',
      envelopeToggle: 'മൊത്തം പ്രൊഫൈൽ',
      activeLegend: 'പ്രോജക്റ്റ് ശ്രദ്ധ',
      envelopeLegend: 'ആകെ ശേഷി',
      radarAria: 'എഞ്ചിനീയറിംഗ് ശേഷി റഡാർ ചാർട്ട്',
      stackHeading: 'വിഭാഗീകരിച്ച ടെക് സ്റ്റാക്ക്',
      focusHint: 'കൂടുതൽ വിവരങ്ങൾക്ക് ഒരു വിഭാഗമോ ആക്സിസോ തിരഞ്ഞെടുക്കുക',
      axes: {
        frontendUi: 'UI & ഫ്രണ്ട്‌എൻഡ്',
        visualDesign: 'വിഷ്വൽ & വെക്റ്റർ',
        embeddedFirmware: 'എംബഡഡ് & MCU',
        rfTelemetry: 'RF & ടെലിമെട്രി',
        sensorsDsp: 'സെൻസറുകൾ & DSP',
        systemsArch: 'സിസ്റ്റംസ് & UX',
      },
      categories: {
        visualVector: 'വിഷ്വൽ & വെക്റ്റർ',
        frontendMotion: 'ഫ്രണ്ട്‌എൻഡ് & മോഷൻ',
        architectureCraft: 'ആർക്കിടെക്ചർ & മികവ്',
        embeddedActuation: 'എംബഡഡ് & കൺട്രോൾ',
        sensorsVision: 'സെൻസറുകളും വിഷനും',
        commsOperator: 'RF & ടെലിമെട്രി ലിങ്ക്',
        rfCompute: 'RF & കമ്പ്യൂട്ട് നോഡ്',
        inertialDsp: 'സെൻസർ ഫ്യൂഷൻ & DSP',
        simulationFirmware: 'സിമുലേഷനും ടൂളുകളും',
      },
    },
    creative: {
      sec1: '01. ക്രിയേറ്റീവ് പ്രവർത്തനരീതി',
      sec1Intro:
        'അപ്ലൈഡ് ഇലക്ട്രോണിക്സ് എഞ്ചിനീയറിംഗിന്റെ വിശകലന കൃത്യതയും വിഷ്വൽ ഡിസൈനിന്റെ ആവിഷ്കാര സ്വാതന്ത്ര്യവും ഒന്നിപ്പിക്കുന്നു. ടൈപ്പോഗ്രാഫിയും മോഷനും ചേർക്കുന്നതിന് മുമ്പ് ഓരോ പ്രോജക്റ്റും ഉറച്ച ഒരു ഗ്രിഡ് ഘടനയിലാണ് ആരംഭിക്കുന്നത്.',
      sec2: '02. അടിസ്ഥാന തത്വം',
      guidingPillars: 'പ്രധാന മൂല്യങ്ങൾ',
      sec3: '03. സ്റ്റുഡിയോ മികവും ടൂളുകളും',
    },
    robot: {
      sec1: '01. സംഗ്രഹവും പശ്ചാത്തലവും',
      sec2: '02. ദൗത്യ ലക്ഷ്യങ്ങൾ',
      sec3: '03. ഹാർഡ്‌വെയർ ഘടകങ്ങൾ',
      sec4: '04. സോഫ്റ്റ്‌വെയറും ടെലിമെട്രിയും',
      sec5: '05. സിസ്റ്റം ഘടനയും സിഗ്നൽ പ്രവാഹവും',
      operatorConsole: 'ഓപ്പറേറ്റർ കൺസോൾ',
      remoteController: 'റിമോട്ട് കൺട്രോളർ / ലാപ്‌ടോപ്പ്',
      wirelessLink: 'വയർലെസ് RF / Wi-Fi ലിങ്ക്',
      mcuRpi: 'മൈക്രോകൺട്രോളർ / Raspberry Pi',
      motors: 'മോട്ടോറുകൾ',
      camera: 'ക്യാമറ',
      cameraDetail: 'തത്സമയ സ്ട്രീം',
      sensors: 'സെൻസറുകൾ',
      workingPrinciple: 'പ്രവർത്തന തത്വം',
      conclusion: 'ഉപസംഹാരം',
    },
    geo: {
      sec1: '01. ഗവേഷണ സംഗ്രഹം',
      sec2: '02. സാറ്റലൈറ്റ് GPS-ന്റെ പരിമിതികൾ',
      sec3: '03. നിർദ്ദേശിക്കുന്ന RF ഘടന',
      sec4: '04. സ്ഥാനനിർണ്ണയ ഘട്ടങ്ങൾ',
      sec5: '05. ലോഗരിതമിക് പാത്ത്-ലോസ് മോഡൽ',
      sec5Sub:
        'SX1278 LoRa RSSI കാലിബ്രേഷനെ അടിസ്ഥാനമാക്കിയുള്ള സിഗ്നൽ വ്യതിയാന പരിശോധന.',
      anchorDistance: 'ആങ്കർ ദൂരം (d)',
      meterUnit: 'മീ',
      envExponent: 'പരിസ്ഥിതി ഘടകം (n)',
      predictedRssi: 'പ്രതീക്ഷിക്കുന്ന RSSI',
      sec6: '06. ഹാർഡ്‌വെയറും സോഫ്റ്റ്‌വെയറും',
      colSubsystem: 'ഉപവിഭാഗം',
      colModel: 'ഘടക മോഡൽ',
      colRole: 'ഘടനയിലെ പങ്ക്',
      softwareToolchain: 'സോഫ്റ്റ്‌വെയർ ടൂളുകൾ',
      applications: 'ഉപയോഗ മേഖലകൾ',
      advantages: 'പ്രധാന നേട്ടങ്ങൾ',
      roadmap: 'ഭാവി വികസന പദ്ധതികൾ',
      conclusion: 'ഉപസംഹാരം',
    },
  },
  contact: {
    eyebrow: '04. നേരിട്ടുള്ള ബന്ധം',
    headlineSegments: [
      { text: 'നമുക്ക് ' },
      { text: 'അർത്ഥവത്തായ', accent: true },
      { text: ' എന്തെങ്കിലും ഒരുമിച്ച് നിർമ്മിക്കാം.' },
    ],
    intro:
      'താഴെയുള്ള കുറിപ്പിൽ ഒരു ചെറിയ സന്ദേശം എഴുതി, ഒപ്പോ പേരോ നൽകി ഇമെയിൽ വഴിയോ വാട്‌സ്ആപ്പ് വഴിയോ നേരിട്ട് അയയ്ക്കുക.',
    formAria: 'പ്രോജക്റ്റ് അന്വേഷണ കത്ത്',
    websiteTrap: 'വെബ്‌സൈറ്റ്',
    dearPrefix: 'പ്രിയ',
    fields: {
      re: 'വിഷയം ::',
      from: 'ഇമെയിൽ ::',
      via: 'മാർഗ്ഗം ::',
    },
    monthsFull: [
      'ജനുവരി',
      'ഫെബ്രുവരി',
      'മാർച്ച്',
      'ഏപ്രിൽ',
      'മേയ്',
      'ജൂൺ',
      'ജൂലൈ',
      'ഓഗസ്റ്റ്',
      'സെപ്റ്റംബർ',
      'ഒക്ടോബർ',
      'നവംബർ',
      'ഡിസംബർ',
    ],
    inquirySubjectSrOnly: 'അന്വേഷണ വിഷയം',
    inquiryKinds: {
      collab: 'പ്രോജക്റ്റ് സഹകരണം',
      hello: 'സൗഹൃദ സന്ദേശം',
    },
    fromPlaceholder: 'you@studio.com',
    validEmailAria: 'ശരിയായ ഇമെയിൽ',
    validBadge: 'ശരിയാണ്',
    viaPlaceholder: 'സുഹൃത്ത്, LinkedIn, Instagram, Google തിരയൽ… (നിർബന്ധമില്ല)',
    suggestions: 'നിർദ്ദേശങ്ങൾ',
    showSuggestionsAria: 'സൂചനകൾ കാണിക്കുക',
    hideSuggestionsAria: 'സൂചനകൾ മറയ്ക്കുക',
    viaListboxAria: 'പരിചയപ്പെട്ട മാർഗ്ഗത്തിനുള്ള നിർദ്ദേശങ്ങൾ',
    viaSuggestions: [
      'LinkedIn',
      'Instagram',
      'സുഹൃത്ത് അല്ലെങ്കിൽ സഹപ്രവർത്തകൻ',
      'Google തിരയൽ',
      'നേരിട്ടുള്ള സന്ദർശനം',
    ],
    letterSrOnly: 'സന്ദേശം',
    bodyPlaceholder: 'നമ്മൾ എന്താണ് നിർമ്മിക്കാൻ പോകുന്നത്?',
    formattingAria: 'ടെക്സ്റ്റ് ഫോർമാറ്റിംഗ്',
    boldTitle: 'കടുപ്പിക്കുക (*text*, Ctrl+B)',
    boldAria: 'തിരഞ്ഞെടുത്ത ഭാഗം കടുപ്പിക്കുക',
    italicTitle: 'ചരിക്കുക (_text_, Ctrl+I)',
    italicAria: 'തിരഞ്ഞെടുത്ത ഭാഗം ചരിക്കുക',
    boldSample: 'കടുപ്പിച്ച വാക്കുകൾ',
    italicSample: 'ചരിച്ച വാക്കുകൾ',
    sincerely: 'വിശ്വസ്തതയോടെ,',
    signAria: 'ഒപ്പിടുക',
    signHint: 'ഇവിടെ ഒപ്പിടുക (ക്ലിക്ക് അല്ലെങ്കിൽ ടാപ്പ് ചെയ്യുക)',
    yourNameAria: 'നിങ്ങളുടെ പേര്',
    yourNamePlaceholder: 'നിങ്ങളുടെ പേര്',
    clearSignature: 'ഒപ്പ് മായ്ക്കുക',
    replyPromise: 'ഒറ്റ മറുപടി മാത്രം · ന്യൂസ്‌ലെറ്ററുകളില്ല',
    letterStatuses: {
      received: 'സ്വീകരിച്ചു',
      ready: 'അയയ്ക്കാൻ തയ്യാർ',
      signed: 'ഒപ്പിട്ടു',
      unsigned: 'ഒപ്പിട്ടിട്ടില്ല',
    },
    sendIt: 'അയയ്ക്കുക',
    whatsapp: 'വാട്‌സ്ആപ്പ്',
    keepCopy: 'പകർപ്പ് സൂക്ഷിക്കുക',
    writeAnother: 'മറ്റൊന്ന് എഴുതുക',
    toastCopiedHeading: 'പകർത്തി!',
    toastCopySaved: 'ഫോർമാറ്റ് ചെയ്ത പകർപ്പ് ക്ലിപ്പ്ബോർഡിലേക്ക് സേവ് ചെയ്തു',
    stampBrand: 'ആദേശ് പി എസ് · പ്രസ്സ്',
    stampDispatched: 'അയച്ചു',
    dispatch: {
      titlePrefix: 'പോർട്ട്‌ഫോളിയോ സന്ദേശം',
      subtitle: 'പ്രോജക്റ്റ് അന്വേഷണവും സഹകരണ കുറിപ്പും',
      summaryHeading: 'സന്ദേശ സംഗ്രഹം',
      refId: 'റഫറൻസ് നമ്പർ',
      submitted: 'അയച്ച സമയം',
      targetReply: 'പ്രതീക്ഷിക്കുന്ന മറുപടി',
      channel: 'മാധ്യമം',
      channelEmail: 'ഇമെയിൽ',
      channelWhatsapp: 'വാട്‌സ്ആപ്പ്',
      detailsHeading: 'അയച്ചയാളുടെ വിവരങ്ങൾ',
      subject: 'വിഷയം',
      name: 'പേര്',
      replyEmail: 'മറുപടി ഇമെയിൽ',
      referral: 'അറിഞ്ഞ മാർഗ്ഗം',
      signature: 'ഒപ്പ്',
      handSignedFallback: '(കൈയൊപ്പ് രേഖപ്പെടുത്തിയത്)',
      directVisitFallback: 'നേരിട്ടുള്ള സന്ദർശനം',
      sigBoth: 'കൈയൊപ്പും ടൈപ്പ് ചെയ്ത പേരും',
      sigDrawn: 'കൈയൊപ്പ്',
      sigTyped: 'ടൈപ്പ് ചെയ്ത പേര്',
      messageHeading: 'സന്ദേശം',
      timezone: 'IST',
    },
    errors: {
      emailEmpty: 'ദയവായി നിങ്ങളുടെ മറുപടി ഇമെയിൽ വിലാസം നൽകുക.',
      emailTooLong: 'ഇമെയിൽ വിലാസം 160 അക്ഷരങ്ങളിൽ കൂടരുത്.',
      emailInvalid: 'ശരിയായ ഒരു ഇമെയിൽ വിലാസം നൽകുക (ഉദാ. you@studio.com).',
      bodyEmpty: 'നിങ്ങൾ നിർമ്മിക്കാൻ ആഗ്രഹിക്കുന്നതിനെക്കുറിച്ച് ഒരു ചെറിയ കുറിപ്പ് എഴുതുക.',
      bodyTooLong: 'സന്ദേശം 6000 അക്ഷരങ്ങളിൽ കൂടരുത്.',
      signMissing: 'ദയവായി മുകളിൽ ഒപ്പിടുകയോ നിങ്ങളുടെ പേര് നൽകുകയോ ചെയ്യുക.',
      signTooLong: 'പേര് 120 അക്ഷരങ്ങളിൽ കൂടരുത്.',
    },
    ticket: {
      aria: 'ടിക്കറ്റ് രസീത്',
      header: 'ആദേശ് പി എസ് :: പ്രസ്സ്',
      counter: 'സ്വീകരണം · കൗണ്ടർ 01',
      job: 'ടിക്കറ്റ് നമ്പർ',
      received: 'ലഭിച്ച സമയം',
      replyBy: 'മറുപടി തീയതി',
      status: 'നില',
      fileUnder: 'വിഭാഗം',
      keepHalf: 'ഈ പകുതി സൂക്ഷിക്കുക',
      statuses: {
        received: 'സ്വീകരിച്ചു',
        ready: 'അയയ്ക്കാൻ തയ്യാർ',
        signedDraft: 'ഒപ്പിട്ട ഡ്രാഫ്റ്റ്',
        writing: 'എഴുതിക്കൊണ്ടിരിക്കുന്നു',
      },
    },
    footer: {
      craftedWithPrecision: 'കൃത്യതയോടെ നിർമ്മിച്ചത്',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
    },
    signatureModal: {
      ariaLabel: 'നിങ്ങളുടെ പേര് ഒപ്പിടുക',
      signHere: 'ഇവിടെ ഒപ്പിടുക',
      instructions: 'വിരൽ, മൗസ് അല്ലെങ്കിൽ പെൻ ഉപയോഗിച്ച് വരയ്ക്കുക',
      padAria: 'ഒപ്പിടാനുള്ള പാഡ്',
      cancel: 'റദ്ദാക്കുക',
      clear: 'മായ്ക്കുക',
      done: 'പൂർത്തിയായി',
    },
  },
  companion: {
    buttonAria:
      'ഇന്ററാക്ടീവ് റോബോട്ട് കൂട്ടാളി — പ്രതികരിക്കാൻ ക്ലിക്ക് ചെയ്യുക, ഓവർഡ്രൈവിനായി 5 തവണ ടാപ്പ് ചെയ്യുക, കറങ്ങാൻ ഡബിൾ ക്ലിക്ക് ചെയ്യുക, അല്ലെങ്കിൽ ഡ്രാഗ് ചെയ്യുക',
    prompts: {
      about: { line: 'ഇലക്ട്രോണിക്സും സോഫ്റ്റ്‌വെയറും ഒന്നിക്കുന്നു', cta: 'സൃഷ്ടികൾ ↓' },
      work: { line: 'പ്രോജക്റ്റുകളും RF എഞ്ചിനീയറിംഗും പരിശോധിക്കുന്നു', cta: 'യാത്ര ↓' },
      experience: { line: 'പദവികളും ഗവേഷണവും കാണുന്നു', cta: 'ബന്ധപ്പെടുക ↓' },
      contact: { line: 'സഹകരിക്കാൻ തയ്യാർ', cta: 'മുകളിലേക്ക് ↑' },
    },
    emotions: {
      happy: 'സന്തോഷം',
      love: 'സ്നേഹം',
      laugh: 'ചിരി',
      cool: 'കൂൾ',
      shy: 'നാണം',
      surprised: 'അത്ഭുതം',
    },
    actions: {
      dance: 'നൃത്തം',
      radar: 'റഡാർ',
      wave: 'കൈവീശൽ',
      spin: 'കറക്കം',
      dock: 'നിർത്തുക',
      roam: 'സഞ്ചരിക്കുക',
    },
  },
  audio: {
    muteAria: 'സ്പേഷ്യൽ ഓഡിയോ ശബ്ദങ്ങൾ മ്യൂട്ട് ചെയ്യുക',
    enableAria: 'സ്പേഷ്യൽ ഓഡിയോ ശബ്ദങ്ങൾ ഓൺ ചെയ്യുക',
    floatingOnTitle: 'സ്പേഷ്യൽ ഓഡിയോ: ഓൺ (മ്യൂട്ട് ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക)',
    floatingOffTitle: 'സ്പേഷ്യൽ ഓഡിയോ: മ്യൂട്ട് (ഓൺ ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക)',
    inlineOnTitle: 'സ്പേഷ്യൽ ഓഡിയോ: ഓൺ',
    inlineOffTitle: 'സ്പേഷ്യൽ ഓഡിയോ: മ്യൂട്ട്',
  },
  backToTop: {
    ariaLabel: 'മുകളിലേക്ക് പോകുക',
  },
  preloader: {
    loadingSuffix: 'പോർട്ട്‌ഫോളിയോ',
  },
  liveClock: {
    ariaPrefix: 'കേരളത്തിലെ പ്രാദേശിക സമയം',
  },
  portfolio: {
    profile: {
      ...PROFILE,
      name: 'ആദേശ് പി എസ്',
      shortName: 'ആദേശ്',
      location: 'കേരളം, ഇന്ത്യ',
      role: 'ക്രിയേറ്റീവ് ഡെവലപ്പർ & അപ്ലൈഡ് ഇലക്ട്രോണിക്സ് എഞ്ചിനീയർ',
      education: 'അപ്ലൈഡ് ഇലക്ട്രോണിക്സിൽ ബിരുദാനന്തര ബിരുദം',
      availability: 'തിരഞ്ഞെടുത്ത പ്രോജക്റ്റുകൾക്കും പ്രൊഡക്റ്റ് ടീമുകൾക്കും ലഭ്യം',
      heroImageAlt: 'കറുപ്പ്, ട്രാവെർട്ടൈൻ, സിന്നബാർ ആർക്കുകളുടെ ആധുനിക ജ്യാമിതീയ ചിത്രം',
      portraitImageAlt:
        'വൃത്താകൃതിയിലുള്ള ഓർബിറ്റൽ രേഖകളാൽ ചുറ്റപ്പെട്ട ആദേശ് പി എസ്-ന്റെ ജ്യാമിതീയ വെക്റ്റർ ഛായാചിത്രം',
    },
    disciplines: [
      {
        number: '01',
        title: 'ഗ്രാഫിക്സും വെക്റ്റർ ആർട്ടും',
        detail: 'Illustrator · Affinity Suite · Identity',
        filter: 'design',
      },
      {
        number: '02',
        title: 'ഫുൾ-സ്റ്റാക്ക് വെബ് ആപ്പുകൾ',
        detail: 'React · TypeScript · Node.js',
        filter: 'design',
      },
      {
        number: '03',
        title: 'റോബോട്ടിക്സും IoT-യും',
        detail: 'UGV ഹാർഡ്‌വെയർ · Embedded C · സെൻസറുകൾ',
        filter: 'robotics',
      },
      {
        number: '04',
        title: 'RF ജിയോ-ലൊക്കേഷൻ',
        detail: 'LoRa SX1278 · RSSI · Kalman Filter',
        filter: 'rf',
      },
    ],
    projects: [
      {
        ...PROJECTS[0],
        title: 'ഡിജിറ്റൽ ആർട്ടും വെക്റ്റർ മികവും',
        subtitle: 'വിഷ്വൽ ക്രാഫ്റ്റ്, ബ്രാൻഡ് ജ്യാമിതി & വെബ് ഇന്റർഫേസുകൾ',
        discipline: 'വിഷ്വൽ ആർട്ട്സ് · UI/UX · വെബ് ഡെവലപ്‌മെന്റ്',
        year: '2024 — നിലവിൽ',
        summary:
          'ആധുനിക React ആർക്കിടെക്ചറുകൾക്കൊപ്പം ഡിജിറ്റൽ ചിത്രീകരണവും ബെസിയർ വെക്റ്റർ കൃത്യതയും സമന്വയിപ്പിച്ച് — എഞ്ചിനീയറിംഗ് മികവും മനുഷ്യസൗഹൃദവും ഒത്തുചേരുന്ന ദൃശ്യസംവിധാനങ്ങൾ നിർമ്മിക്കുന്നു.',
        imageAlt: 'ടെക്സ്ചർഡ് പേപ്പറിൽ തീർത്ത ഹൈ-കോൺട്രാസ്റ്റ് സ്വിസ് മോഡേണിസ്റ്റ് വെക്റ്റർ പ്രിന്റ്',
        metrics: [
          { label: 'പ്രധാന മാധ്യമങ്ങൾ', value: 'വെക്റ്റർ, UI & വെബ്' },
          { label: 'പ്രധാന ടൂളുകൾ', value: 'Illustrator & Affinity' },
          { label: 'ശ്രദ്ധാകേന്ദ്രം', value: 'മനുഷ്യകേന്ദ്രീകൃത ഡിസൈൻ' },
        ],
        specs: [
          { label: 'വെക്റ്റർ പൈപ്പ്‌ലൈൻ', value: 'ബെസിയർ നോഡ് രൂപകൽപ്പന' },
          { label: 'ഫ്രണ്ട്‌എൻഡ് സ്റ്റാക്ക്', value: 'React · TypeScript · Tailwind' },
          { label: 'മോഷൻ എഞ്ചിൻ', value: 'GPU-അധിഷ്ഠിത ആനിമേഷനുകൾ' },
          { label: 'പ്രവേശനക്ഷമത', value: 'WCAG AA · റെഡ്യൂസ്ഡ് മോഷൻ' },
        ],
        constraints: [
          'അനാവശ്യ അലങ്കാരങ്ങളില്ലാതെ കർശനമായ 60/30/10 ദൃശ്യ അനുപാതം പാലിക്കുക',
          'എല്ലാ ഇന്ററാക്ഷനുകളിലും സാങ്കേതിക സങ്കീർണ്ണതയ്ക്ക് പകരം മനുഷ്യസൗഹൃദത്തിന് മുൻഗണന നൽകുക',
          'എല്ലാ സ്ക്രീനുകളിലും വ്യക്തമായ ദൃശ്യക്രമവും വൃത്തിയുള്ള ഇടങ്ങളും നിലനിർത്തുക',
        ],
      },
      {
        ...PROJECTS[1],
        title: 'സൈനിക നിരീക്ഷണ റോബോട്ട്',
        subtitle: 'അപകടസാധ്യതയുള്ള മേഖലകളിലെ നിരീക്ഷണത്തിനുള്ള അൺമാൻഡ് ഗ്രൗണ്ട് വെഹിക്കിൾ',
        discipline: 'റോബോട്ടിക്സ് · IoT · എംബഡഡ് സിസ്റ്റങ്ങൾ',
        year: '2023',
        summary:
          'അതിർത്തി പ്രദേശങ്ങൾ, തുരങ്കങ്ങൾ, അപകടസാധ്യതയുള്ള മേഖലകൾ എന്നിവിടങ്ങളിൽ വിദൂര നിരീക്ഷണത്തിനും തത്സമയ വീഡിയോ സംപ്രേഷണത്തിനും തടസ്സങ്ങൾ തിരിച്ചറിഞ്ഞ് നീങ്ങുന്നതിനുമായി രൂപകൽപ്പന ചെയ്ത മൊബൈൽ റോബോട്ട്.',
        tools: ['Arduino / RPi', 'L298N ഡ്രൈവർ', 'Embedded C / Python', 'RF / Wi-Fi'],
        imageAlt: 'സ്വയംനിയന്ത്രിത റോബോട്ടിക്സ് ചലനങ്ങളെ സൂചിപ്പിക്കുന്ന ജ്യാമിതീയ പ്രിന്റ്',
        metrics: [
          { label: 'പ്ലാറ്റ്‌ഫോം', value: 'ട്രാക്ക്ഡ് UGV' },
          { label: 'സെൻസറുകൾ', value: 'നൈറ്റ് വിഷൻ & അൾട്രാസോണിക്' },
          { label: 'നിയന്ത്രണം', value: 'വിദൂര വയർലെസ് ലിങ്ക്' },
        ],
        specs: [
          { label: 'കമ്പ്യൂട്ട് കോർ', value: 'Arduino / Raspberry Pi' },
          { label: 'ആക്ച്വേഷൻ', value: 'L298N H-ബ്രിഡ്ജ് ഡ്യുവൽ PWM' },
          { label: 'സെൻസർ നിര', value: 'നൈറ്റ് വിഷൻ · അൾട്രാസോണിക് · IR' },
          { label: 'ടെലിമെട്രി', value: 'ഡ്യുവൽ RF & Wi-Fi വീഡിയോ ലിങ്ക്' },
        ],
        constraints: [
          'ഡ്രൈവും ക്യാമറയും ഒരേസമയം പ്രവർത്തിക്കുമ്പോൾ ബാറ്ററി സമയപരിധി നിയന്ത്രിക്കുക',
          'തുരങ്കങ്ങൾക്കുള്ളിലെ RF സിഗ്നൽ തടസ്സങ്ങളും മൾട്ടിപാത്ത് നഷ്ടവും മറികടക്കുക',
          'കരുത്തുറ്റ സസ്‌പെൻഷനുള്ളിൽ ഭാരം കുറഞ്ഞതും ഒതുക്കമുള്ളതുമായ പേലോഡ് നിലനിർത്തുക',
        ],
      },
      {
        ...PROJECTS[2],
        title: 'ജിയോ-ലൊക്കേഷൻ ഗൈഡൻസ് സിസ്റ്റം',
        subtitle: 'GPS ലഭ്യമല്ലാത്ത ഇടങ്ങളിലെ ഓഫ്-ഗ്രിഡ് RF പൊസിഷനിംഗ്',
        discipline: 'അപ്ലൈഡ് ഇലക്ട്രോണിക്സ് · RF കമ്മ്യൂണിക്കേഷൻസ്',
        year: '2023',
        summary:
          'ഭൂഗർഭ ഖനികൾ, ഇടതൂർന്ന വനങ്ങൾ, വെയർഹൗസുകൾ എന്നിവിടങ്ങളിൽ കൃത്യമായ സ്ഥാനനിർണ്ണയത്തിനായി SX1278 LoRa, RSSI പാത്ത്-ലോസ്, ട്രൈലാറ്ററേഷൻ, Kalman ഫിൽട്ടറിംഗ് എന്നിവ ഉപയോഗിക്കുന്ന സാറ്റലൈറ്റ്-രഹിത സംവിധാനം.',
        imageAlt: 'റേഡിയോ ഫ്രീക്വൻസി തരംഗങ്ങളെയും ട്രയാംഗുലേഷനെയും സൂചിപ്പിക്കുന്ന ജ്യാമിതീയ പ്രിന്റ്',
        metrics: [
          { label: 'ട്രാൻസ്‌സീവർ', value: 'SX1278 LoRa' },
          { label: 'ഫിൽട്ടറിംഗ്', value: 'Kalman പാത്ത്-ലോസ് സ്മൂത്തിംഗ്' },
          { label: 'ആശ്രയത്വം', value: 'GPS ആവശ്യമില്ല' },
        ],
        specs: [
          { label: 'കൺട്രോളറും RF-ഉം', value: 'ESP32 · SX1278 Sub-GHz' },
          { label: 'ഇനേർഷ്യൽ ഫ്യൂഷൻ', value: 'MPU6050 + HMC5883L' },
          { label: 'സ്ഥാനനിർണ്ണയം', value: 'RSSI ലോഗ്-ലോസ് + ട്രൈലാറ്ററേഷൻ' },
          { label: 'ഡിസ്‌പ്ലേ', value: '0.96" OLED ലോക്കൽ ടെലിമെട്രി' },
        ],
        constraints: [
          'GPS സാറ്റലൈറ്റുകളെയോ സെല്ലുലാർ നെറ്റ്‌വർക്കുകളെയോ പൂർണ്ണമായും ഒഴിവാക്കുക',
          'ഇൻഡോർ സിഗ്നൽ വ്യതിയാനങ്ങൾ Kalman ഫിൽട്ടർ വഴി സ്ഥിരപ്പെടുത്തുക',
          'വിദൂര ആങ്കർ നോഡുകൾക്കായി കുറഞ്ഞ ഊർജ്ജ ഉപഭോഗം ഉറപ്പാക്കുക',
        ],
      },
    ],
    experience: [
      {
        index: '01',
        kind: 'role',
        role: 'ക്രിയേറ്റീവ് സ്ട്രാറ്റജിസ്റ്റ്',
        organization: 'Peoples Urban Development Group & Dashami Finance',
        location: 'കേരളം, ഇന്ത്യ',
        period: 'Current',
        description:
          'ഡിജിറ്റൽ ബ്രാൻഡ് സാന്നിധ്യം, വിഷ്വൽ ക്യാമ്പെയ്ൻ അസറ്റുകൾ, മൾട്ടി-ചാനൽ മാർക്കറ്റിംഗ് തന്ത്രങ്ങൾ എന്നിവ നയിച്ചുകൊണ്ട് പ്രേക്ഷക പങ്കാളിത്തവും സ്ഥാപന വളർച്ചയും കൈവരിക്കുന്നു.',
        focus: ['ബ്രാൻഡ് സ്ട്രാറ്റജി', 'വിഷ്വൽ ക്യാമ്പെയ്നുകൾ', 'ഡിജിറ്റൽ വളർച്ച'],
      },
      {
        index: '02',
        kind: 'role',
        role: 'ഫുൾ-സ്റ്റാക്ക് ഡെവലപ്പർ ഇന്റേൺ',
        organization: 'Luminar Technolab',
        location: 'കൊച്ചി, ഇന്ത്യ',
        period: '2023',
        description:
          'React, TypeScript, Node.js എന്നിവ ഉപയോഗിച്ച് പ്രൊഡക്റ്റ് സ്പ്രിന്റുകളിൽ റെസ്‌പോൺസീവ് ഫുൾ-സ്റ്റാക്ക് വെബ് ഇന്റർഫേസുകളും ബാക്കെൻഡ് വർക്ക്‌ഫ്ലോകളും നിർമ്മിച്ചു.',
        focus: ['React & TypeScript', 'Node.js APIs', 'റെസ്‌പോൺസീവ് UI'],
      },
      {
        index: '03',
        kind: 'education',
        role: 'അപ്ലൈഡ് ഇലക്ട്രോണിക്സിൽ ബിരുദാനന്തര ബിരുദം',
        organization: 'ബിരുദാനന്തര ഗവേഷണ & ഹാർഡ്‌വെയർ ലാബ്',
        location: 'കേരളം, ഇന്ത്യ',
        period: 'അടിത്തറ',
        description:
          'RF കമ്മ്യൂണിക്കേഷൻസ്, എംബഡഡ് മൈക്രോകൺട്രോളറുകൾ, സിഗ്നൽ പ്രോസസ്സിംഗ്, സെൻസർ അധിഷ്ഠിത റോബോട്ടിക്സ് എന്നിവയിൽ വൈദഗ്ദ്ധ്യം നേടി — ഹാർഡ്‌വെയറിനെയും സോഫ്റ്റ്‌വെയറിനെയും ബന്ധിപ്പിച്ചു.',
        focus: ['അപ്ലൈഡ് ഇലക്ട്രോണിക്സ്', 'RF & ടെലിമെട്രി', 'Embedded C / Python'],
      },
    ],
    processPillars: [
      {
        step: '01',
        title: 'തന്ത്രം',
        desc: 'ഒരു വരി കോഡ് എഴുതുന്നതിനോ വെക്റ്റർ വരയ്ക്കുന്നതിനോ മുമ്പായി മനുഷ്യ ആവശ്യങ്ങളും ഭൗതിക പരിമിതികളും കൃത്യമായി നിർവ്വചിക്കുന്നു.',
      },
      {
        step: '02',
        title: 'ഡിസൈൻ',
        desc: 'Illustrator, Affinity എന്നിവയിലൂടെ വ്യക്തമായ വിഷ്വൽ സിസ്റ്റങ്ങളും വെക്റ്റർ ഐഡന്റിറ്റികളും ഇന്റർഫേസുകളും രൂപകൽപ്പന ചെയ്യുന്നു.',
      },
      {
        step: '03',
        title: 'എഞ്ചിനീയറിംഗ്',
        desc: 'വേഗതയേറിയ React ഫ്രണ്ട്‌എൻഡുകളും Node.js സേവനങ്ങളും കൃത്യതയുള്ള മൈക്രോകൺട്രോളർ ഹാർഡ്‌വെയറും നിർമ്മിക്കുന്നു.',
      },
      {
        step: '04',
        title: 'ലോഞ്ച്',
        desc: 'ബ്രൗസർ വ്യൂപോർട്ടുകൾ മുതൽ ഓഫ്-ഗ്രിഡ് RF ഫീൽഡ് ടെസ്റ്റുകൾ വരെയുള്ള യഥാർത്ഥ സാഹചര്യങ്ങളിൽ പരിശോധിച്ച് പുറത്തിറക്കുന്നു.',
      },
    ],
    creativeCaseStudy: {
      pillars: [
        {
          title: 'ഗ്രാഫിക്സ് ഡിസൈൻ',
          description:
            'ദൃശ്യപരമായ ബഹളങ്ങളില്ലാതെ ആശയം വേഗത്തിൽ കൈമാറുന്ന ചിട്ടയായ ദൃശ്യരൂപങ്ങളും എഡിറ്റോറിയൽ ലേഔട്ടുകളും ബ്രാൻഡ് ഐഡന്റിറ്റികളും സൃഷ്ടിക്കുന്നു.',
        },
        {
          title: 'വെക്റ്റർ ആർട്ട്',
          description:
            'Adobe Illustrator, Affinity Designer എന്നിവയിൽ ഓരോ നോഡും കൃത്യതയോടെ ക്രമീകരിച്ച് നിർമ്മിച്ച ജ്യാമിതീയ ഡിജിറ്റൽ ചിത്രീകരണങ്ങൾ.',
        },
        {
          title: 'വെബ് ഡെവലപ്‌മെന്റ്',
          description:
            'കലാപരമായ കാഴ്ചപ്പാടുകളെ പ്രവേശനക്ഷമതയുള്ളതും വേഗതയേറിയതുമായ React, TypeScript ആപ്ലിക്കേഷനുകളാക്കി മാറ്റുന്നു.',
        },
      ],
      philosophyTitle: 'ആത്മാവുള്ള സൃഷ്ടികൾ',
      philosophyStatement:
        'ഓരോ ഡിജിറ്റൽ ഉൽപ്പന്നവും സ്വന്തമായൊരു ആത്മാവ് അർഹിക്കുന്നുണ്ടെന്ന് ഞാൻ വിശ്വസിക്കുന്നു. വിശകലനാത്മക എഞ്ചിനീയറിംഗ് കൃത്യതയും സർഗ്ഗാത്മകതയും സമന്വയിപ്പിച്ച് ആ ഹൃദയമിടിപ്പ് കണ്ടെത്തുന്നതിലാണ് എന്റെ ശ്രദ്ധ.',
      values: ['ലക്ഷ്യബോധം', 'സഹാനുഭൂതി', 'മികവ്'],
      craftNotes: [
        {
          label: 'പ്രധാന വെക്റ്റർ ടൂൾകിറ്റ്',
          value: 'Adobe Illustrator & Affinity Designer',
        },
        {
          label: 'UX തത്വം',
          value: 'സാങ്കേതിക സങ്കീർണ്ണതയ്ക്ക് പകരം മനുഷ്യന്റെ സഹജാവബോധത്തിന് മുൻഗണന',
        },
        {
          label: 'ടൈപ്പോഗ്രാഫിക് ചിട്ട',
          value: 'വ്യക്തമായ ദൃശ്യക്രമം, താളം, അർത്ഥവത്തായ വൈറ്റ്‌സ്‌പേസ്',
        },
      ],
    },
    robotCaseStudy: {
      abstract:
        'അപകടസാധ്യതയുള്ള സാഹചര്യങ്ങളിൽ നിരീക്ഷണവും വിവരശേഖരണവും നടത്തുന്നതിനായി രൂപകൽപ്പന ചെയ്ത അൺമാൻഡ് ഗ്രൗണ്ട് വെഹിക്കിൾ (UGV) ആണ് ഈ സൈനിക നിരീക്ഷണ റോബോട്ട്. നൈറ്റ്-വിഷൻ ക്യാമറകൾ, വയർലെസ് കമ്മ്യൂണിക്കേഷൻ മൊഡ്യൂളുകൾ, തടസ്സങ്ങൾ തിരിച്ചറിയുന്ന സെൻസറുകൾ എന്നിവ ഇതിൽ സജ്ജീകരിച്ചിരിക്കുന്നു.',
      introduction:
        'ആളുകൾ പ്രവേശിക്കുന്നതിന് മുമ്പായി സാഹചര്യങ്ങൾ വിലയിരുത്താൻ ആധുനിക ദൗത്യങ്ങളിൽ ഒതുക്കമുള്ള റോബോട്ടിക് സംവിധാനങ്ങൾ ഉപയോഗിക്കുന്നു. അതിർത്തി പ്രദേശങ്ങൾ, തുരങ്കങ്ങൾ, തകർന്ന കെട്ടിടങ്ങൾ എന്നിവയിലൂടെ സഞ്ചരിച്ച് തത്സമയ ദൃശ്യങ്ങളും വിവരങ്ങളും നൽകാൻ ഇതിന് കഴിയും.',
      subsystems: [
        { name: 'നൈറ്റ് വിഷൻ', detail: 'ഇരുണ്ട ഇടങ്ങളിലും കുറഞ്ഞ വെളിച്ചത്തിലും വ്യക്തമായ ദൃശ്യങ്ങൾ' },
        { name: 'കമ്മ്യൂണിക്കേഷൻ', detail: 'ഡ്യുവൽ RF & Wi-Fi ടെലിമെട്രി ലിങ്ക്' },
        { name: 'തടസ്സ നിർണ്ണയം', detail: 'അൾട്രാസോണിക് & IR പ്രോക്‌സിമിറ്റി സെൻസറുകൾ' },
        { name: 'നാവിഗേഷൻ', detail: 'ഔട്ട്ഡോർ GPS സഹായവും ഇൻഡോർ റിമോട്ട് സ്റ്റിയറിംഗും' },
      ],
      objectives: [
        'തടസ്സങ്ങളുള്ള പ്രതലങ്ങളിൽ തത്സമയ വിദൂര നിരീക്ഷണം',
        'കുറഞ്ഞ ലേറ്റൻസിയിൽ ഓപ്പറേറ്റർ സ്റ്റേഷനിലേക്ക് തത്സമയ വീഡിയോ സംപ്രേഷണം',
        'ബോംബ് നിർവീര്യമാക്കൽ പരിശോധനകൾക്ക് സുരക്ഷിതമായ നിരീക്ഷണ സഹായം',
        'അജ്ഞാത മേഖലകളിൽ മനുഷ്യ ജീവനുണ്ടാകുന്ന അപകടസാധ്യത കുറയ്ക്കുക',
        'ഫീൽഡിൽ എളുപ്പം അറ്റകുറ്റപ്പണി നടത്താവുന്ന ഒതുക്കമുള്ള ഘടന',
      ],
      hardwareComponents: [
        'Arduino / Raspberry Pi കമ്പ്യൂട്ട് കോർ',
        'ഹൈ-ടോർക്ക് DC മോട്ടോറുകൾ & L298N H-ബ്രിഡ്ജ് ഡ്രൈവർ',
        'വയർലെസ് നൈറ്റ്-വിഷൻ ക്യാമറ മൊഡ്യൂൾ',
        'Wi-Fi / ലോംഗ്-റേഞ്ച് RF ട്രാൻസ്‌സീവർ മൊഡ്യൂളുകൾ',
        'അൾട്രാസോണിക് & ഇൻഫ്രാറെഡ് പ്രോക്‌സിമിറ്റി സെൻസറുകൾ',
        'GPS മൊഡ്യൂളും ഹൈ-ഡിസ്ചാർജ് ബാറ്ററി പാക്കും',
        'കരുത്തുറ്റ ട്രാക്ക്ഡ് ഷാസിയും സസ്‌പെൻഷനും',
      ],
      softwareComponents: [
        'Embedded C & Python കൺട്രോൾ ഫേംവെയർ',
        'Arduino IDE & Linux എഡ്ജ് റൺടൈം',
        'OpenCV / ഇമേജ് പ്രോസസ്സിംഗ് പൈപ്പ്‌ലൈൻ',
        'കസ്റ്റം കമാൻഡ് & ടെലിമെട്രി പ്രോട്ടോക്കോൾ',
        'തത്സമയ വീഡിയോ സ്ട്രീം ഇന്റർഫേസ്',
      ],
      workingSteps: [
        'ഓപ്പറേറ്റർ റിമോട്ട് കൺട്രോൾ കൺസോളിൽ നിന്ന് ദിശാ നിർദ്ദേശങ്ങൾ നൽകുന്നു.',
        'വയർലെസ് RF/Wi-Fi ലിങ്ക് നിർദ്ദേശങ്ങൾ ഓൺബോർഡ് മൈക്രോകൺട്രോളറിലേക്ക് എത്തിക്കുന്നു.',
        'L298N മോട്ടോർ ഡ്രൈവർ വഴി PWM സിഗ്നലുകൾ നൽകി മോട്ടോറുകളുടെ വേഗത നിയന്ത്രിക്കുന്നു.',
        'ക്യാമറ തുടർച്ചയായ ദൃശ്യങ്ങൾ പകർത്തി ഓപ്പറേറ്റർക്ക് തത്സമയം അയയ്ക്കുന്നു.',
        'അൾട്രാസോണിക്, IR സെൻസറുകൾ മുന്നിലെ തടസ്സങ്ങൾ നിരീക്ഷിച്ച് അപകട മുന്നറിയിപ്പ് നൽകുന്നു.',
      ],
      quadrants: [
        {
          title: 'ഉപയോഗങ്ങൾ',
          items: ['അതിർത്തി നിരീക്ഷണം', 'തുരങ്ക പരിശോധന', 'ദുരന്ത നിവാരണം', 'തിരച്ചിലും രക്ഷാപ്രവർത്തനവും'],
        },
        {
          title: 'മേന്മകൾ',
          items: ['മനുഷ്യ അപകടം കുറയ്ക്കുന്നു', 'തത്സമയ ഫീൽഡ് വിവരങ്ങൾ', 'ഭാരം കുറഞ്ഞതും ഒതുക്കമുള്ളതും', 'ചെലവ് കുറഞ്ഞ നിർമ്മാണം'],
        },
        {
          title: 'പരിമിതികൾ',
          items: ['ബാറ്ററി ശേഷി പരിധി', 'RF ലൈൻ-ഓഫ്-സൈറ്റ് ദൂരം', 'പേലോഡ് ഭാരപരിധി', 'മൾട്ടിപാത്ത് സിഗ്നൽ തടസ്സങ്ങൾ'],
        },
        {
          title: 'ഭാവി സാധ്യതകൾ',
          items: ['AI അധിഷ്ഠിത സ്വയംനിയന്ത്രിത നാവിഗേഷൻ', 'ബഹുയൂണിറ്റ് റിലേ ശൃംഖല', 'തെർമൽ ഇമേജിംഗ് പേലോഡ്', 'ആർട്ടിക്കുലേറ്റഡ് EOD ആം'],
        },
      ],
      conclusion:
        'ഒപ്റ്റിക്കൽ സെൻസിംഗ്, തടസ്സ ടെലിമെട്രി, ശക്തമായ വയർലെസ് നിയന്ത്രണം എന്നിവ സംയോജിപ്പിക്കുന്നതിലൂടെ അപകടസാധ്യതയുള്ള മേഖലകളിൽ സുരക്ഷിതമായ വിവരശേഖരണത്തിന് ഈ ഒതുക്കമുള്ള UGV-കൾ വഴിയൊരുക്കുന്നു.',
    },
    geolocationCaseStudy: {
      abstract:
        'ഭൂഗർഭ ഖനികൾ, ഇടതൂർന്ന വനങ്ങൾ, അടച്ചിട്ട വ്യാവസായിക കേന്ദ്രങ്ങൾ തുടങ്ങിയ GPS ലഭ്യമല്ലാത്ത ഇടങ്ങളിൽ കൃത്യമായ സ്ഥാനനിർണ്ണയവും ദിശാസൂചനയും നൽകുന്നതിനായി റേഡിയോ ഫ്രീക്വൻസി (RF) ഉപയോഗിക്കുന്ന ഓഫ്-ഗ്രിഡ് ഗൈഡൻസ് സിസ്റ്റം.',
      introduction:
        'തുറന്ന ആകാശത്തിന് കീഴിൽ സാറ്റലൈറ്റ് പൊസിഷനിംഗ് നന്നായി പ്രവർത്തിക്കുമെങ്കിലും ഭൂമിക്കടിയിലും കെട്ടിടങ്ങൾക്കുള്ളിലും സിഗ്നലുകൾ ദുർബലമാകുന്നു. ഈ സംവിധാനം നിശ്ചിത RF ആങ്കർ ബീക്കണുകളിൽ നിന്നുള്ള RSSI വിശകലനം ചെയ്ത് പ്രാദേശികമായി സ്ഥാനം കണക്കാക്കുന്നു.',
      gpsLimitations: [
        'ഭൂമിക്കടിയിലും കെട്ടിടങ്ങൾക്കുള്ളിലും കടുത്ത സിഗ്നൽ നഷ്ടം',
        'സാറ്റലൈറ്റ് ജാമിംഗിനും സ്പൂഫിംഗിനുമുള്ള സാധ്യത',
        'ഒപ്റ്റിക്കൽ ബാക്കപ്പിന് നേരിട്ടുള്ള കാഴ്ചാപരിധി ആവശ്യം',
        'സ്വതന്ത്ര ഇനേർഷ്യൽ നാവിഗേഷനിൽ കാലക്രമേണയുള്ള പിഴവുകൾ',
      ],
      rfCapabilities: [
        'സാറ്റലൈറ്റുകളില്ലാതെ തുടർച്ചയായ പ്രാദേശിക സ്ഥാനനിർണ്ണയം',
        'LoRa SX1278 ദീർഘദൂര sub-GHz സിഗ്നൽ പ്രസരണം',
        'RSSI ലോഗരിതമിക് പാത്ത്-ലോസ് ദൂര ഗണന മാതൃക',
        'സ്ഥിരതയുള്ള സഞ്ചാരപഥത്തിനായി Kalman ഫിൽട്ടർ സ്മൂത്തിംഗ്',
      ],
      operationalFlow: [
        { step: '01', text: 'റഫറൻസ് ആങ്കർ ബീക്കണുകൾ കൃത്യമായ ഇടവേളകളിൽ sub-GHz RF പാക്കറ്റുകൾ പ്രക്ഷേപണം ചെയ്യുന്നു.' },
        { step: '02', text: 'മൊബൈൽ റോവർ നോഡ് വിവിധ ആങ്കറുകളിൽ നിന്നുള്ള RSSI മൂല്യങ്ങൾ ശേഖരിക്കുന്നു.' },
        { step: '03', text: 'ലോഗരിതമിക് പാത്ത്-ലോസ് മോഡൽ dBm ശക്തിയെ ദൂരത്തിലേക്ക് മാറ്റുന്നു.' },
        { step: '04', text: '2D ട്രൈലാറ്ററേഷൻ വഴി മേഖലയ്ക്കുള്ളിലെ (X, Y) സ്ഥാനം തത്സമയം കണ്ടെത്തുന്നു.' },
        { step: '05', text: 'Kalman ഫിൽട്ടർ IMU ദിശയുമായി സംയോജിപ്പിച്ച് സിഗ്നൽ വിറയലുകൾ ഒഴിവാക്കുന്നു.' },
      ],
      hardwareTable: [
        { component: 'കൺട്രോളർ', model: 'ESP32', purpose: 'പ്രധാന പ്രോസസ്സിംഗ്, Wi-Fi & BLE ടെലിമെട്രി' },
        { component: 'RF ട്രാൻസ്‌സീവർ', model: 'SX1278 LoRa', purpose: 'ദീർഘദൂര sub-GHz പാക്കറ്റ് വിനിമയം' },
        { component: 'മോഷൻ യൂണിറ്റ്', model: 'MPU6050', purpose: '6-ആക്സിസ് ഗൈറോസ്കോപ്പും ആക്‌സിലറോമീറ്ററും' },
        { component: 'മാഗ്നെറ്റോമീറ്റർ', model: 'HMC5883L', purpose: 'കാന്തിക ദിശാ നിർണ്ണയം' },
        { component: 'ഡിസ്‌പ്ലേ', model: 'OLED 0.96"', purpose: 'തത്സമയ കോർഡിനേറ്റ് & RSSI റീഡ്‌ഔട്ട്' },
      ],
      softwareTools: ['Arduino IDE', 'MATLAB', 'Python', 'Proteus'],
      applications: [
        'സിഗ്നൽ തടസ്സങ്ങളുള്ള മേഖലകളിലെ സൈനിക നിരീക്ഷണം',
        'ഭൂഗർഭ ഖനി തൊഴിലാളികളുടെ സ്ഥാനനിർണ്ണയം',
        'അടിയന്തര തിരച്ചിൽ & രക്ഷാപ്രവർത്തനങ്ങൾ',
        'ഓട്ടോമേറ്റഡ് ഇൻഡോർ വെയർഹൗസ് റോബോട്ടിക്സ്',
      ],
      advantages: [
        'GPS സാറ്റലൈറ്റുകളെയോ ഇന്റർനെറ്റിനെയോ ആശ്രയിക്കേണ്ടതില്ല',
        'ജാമിംഗിനെ ചെറുക്കുന്ന sub-GHz RF ബീക്കൺ ശൃംഖല',
        'കുറഞ്ഞ ഹാർഡ്‌വെയർ ചെലവും വേഗത്തിലുള്ള വിന്യാസവും',
        'ബാറ്ററി നോഡുകൾക്കായി കുറഞ്ഞ ഊർജ്ജ ഉപഭോഗം',
      ],
      roadmap: [
        { title: 'AI കാലിബ്രേഷൻ', desc: 'ഓരോ പരിസ്ഥിതിക്കും അനുസരിച്ചുള്ള അഡാപ്റ്റീവ് പാത്ത്-ലോസ് ക്രമീകരണം' },
        { title: 'UWB സംയോജനം', desc: 'സെന്റീമീറ്റർ കൃത്യതയ്ക്കായി ടൈം-ഓഫ്-ഫ്ലൈറ്റ് റേഞ്ചിംഗ്' },
        { title: '3D പൊസിഷനിംഗ്', desc: 'ബാരോമെട്രിക് ഉയര നിർണ്ണയവും മൾട്ടി-പ്ലെയിൻ മാപ്പിംഗും' },
      ],
      conclusion:
        'RSSI പാത്ത്-ലോസ് ഗണനവും ജ്യാമിതീയ ട്രൈലാറ്ററേഷനും Kalman ഫിൽട്ടറിംഗും സമന്വയിപ്പിക്കുന്നതിലൂടെ, ഓഫ്-ഗ്രിഡ് റോബോട്ടിക്സിലും ഖനനത്തിലും രക്ഷാപ്രവർത്തനങ്ങളിലും GPS-ന് വിശ്വസനീയമായൊരു ബദൽ സാധ്യമാകുന്നു.',
    },
    projectTimelinePhases: {
      creative: [
        {
          step: '01',
          phase: 'ആശയം',
          timeframe: 'ആഴ്ച 01',
          title: 'സൗന്ദര്യശാസ്ത്രവും ഗ്രിഡ് തന്ത്രവും',
          description:
            'ഒരു വെക്റ്റർ നോഡ് പോലും വരയ്ക്കുന്നതിന് മുമ്പായി ഘടനാപരമായ ഗ്രിഡ് അനുപാതങ്ങളും മനുഷ്യസൗഹൃദ നാവിഗേഷനും മോണോക്രോം വിഷ്വൽ നിയമങ്ങളും നിശ്ചയിക്കുന്നു.',
          deliverables: ['ഡിസൈൻ ടോക്കണുകൾ', 'എഡിറ്റോറിയൽ ഗ്രിഡ്', 'കോൺട്രാസ്റ്റ് ഓഡിറ്റ്'],
        },
        {
          step: '02',
          phase: 'ഡിസൈൻ',
          timeframe: 'ആഴ്ച 02–03',
          title: 'ബെസിയർ വെക്റ്റർ & ബ്രാൻഡ് ഡിസൈൻ',
          description:
            'Adobe Illustrator, Affinity Suite എന്നിവയിലൂടെ കസ്റ്റം വെക്റ്റർ ജ്യാമിതിയും ഐഡന്റിറ്റി ചിഹ്നങ്ങളും എഡിറ്റോറിയൽ ടൈപ്പോഗ്രാഫിയും രൂപകൽപ്പന ചെയ്യുന്നു.',
          deliverables: ['വെക്റ്റർ ആർട്ട്‌വർക്ക്', 'ടൈപ്പ് ശ്രേണി', 'ബ്രാൻഡ് സിസ്റ്റം'],
        },
        {
          step: '03',
          phase: 'നിർമ്മാണം',
          timeframe: 'ആഴ്ച 04–05',
          title: 'React & മോഷൻ ആർക്കിടെക്ചർ',
          description:
            'മോഡുലാർ TypeScript ഘടകങ്ങൾ, റെസ്‌പോൺസീവ് Tailwind ലേഔട്ടുകൾ, GPU-അധിഷ്ഠിത സ്പ്രിംഗ് ആനിമേഷനുകൾ എന്നിവ നിർമ്മിക്കുന്നു.',
          deliverables: ['React + TS ബിൽഡ്', 'സ്പ്രിംഗ് ഫിസിക്സ്', 'റെസ്‌പോൺസീവ് വ്യൂസ്'],
        },
        {
          step: '04',
          phase: 'പൂർത്തീകരണം',
          timeframe: 'തുടർച്ചയായത്',
          title: 'പ്രവേശനക്ഷമതയും ലോഞ്ച് മിനുക്കുപണിയും',
          description:
            'ഡെസ്ക്ടോപ്പിലും മൊബൈലിലും WCAG AA കോൺട്രാസ്റ്റ്, കീബോർഡ് നാവിഗേഷൻ, റെഡ്യൂസ്ഡ്-മോഷൻ പിന്തുണ എന്നിവ ഉറപ്പാക്കുന്നു.',
          deliverables: ['WCAG AA പരിശോധന', 'റെഡ്യൂസ്ഡ് മോഷൻ', 'പ്രൊഡക്ഷൻ ബണ്ടിൽ'],
        },
      ],
      robot: [
        {
          step: '01',
          phase: 'ആശയം',
          timeframe: 'ഘട്ടം 01',
          title: 'നിരീക്ഷണ ആവശ്യകതകൾ',
          description:
            'തുരങ്കങ്ങളിലെയും അതിർത്തികളിലെയും പരിമിതികൾ, പേലോഡ് ഭാരം, തടസ്സ നിർണ്ണയ ദൂരം, വയർലെസ് ലിങ്ക് വിശ്വാസ്യത എന്നിവ നിർണ്ണയിക്കുന്നു.',
          deliverables: ['മിഷൻ ബ്രീഫ്', 'പവർ ബജറ്റ്', 'റേഞ്ച് ലക്ഷ്യങ്ങൾ'],
        },
        {
          step: '02',
          phase: 'ഡിസൈൻ',
          timeframe: 'ഘട്ടം 02',
          title: 'ഷാസിയും ഡ്യുവൽ-ലിങ്ക് സ്കീമാറ്റിക്കും',
          description:
            'ട്രാക്ക്ഡ് സസ്‌പെൻഷൻ ഷാസി, L298N H-ബ്രിഡ്ജ് മോട്ടോർ ഡ്രൈവർ വയറിംഗ്, അൾട്രാസോണിക്/IR സെൻസറുകൾ, നൈറ്റ്-വിഷൻ ക്യാമറ മൗണ്ട് എന്നിവ ക്രമീകരിക്കുന്നു.',
          deliverables: ['UGV CAD ലേഔട്ട്', 'H-ബ്രിഡ്ജ് സർക്യൂട്ട്', 'സെൻസർ മാപ്പ്'],
        },
        {
          step: '03',
          phase: 'നിർമ്മാണം',
          timeframe: 'ഘട്ടം 03',
          title: 'എംബഡഡ് ഫേംവെയറും വീഡിയോ സ്ട്രീമും',
          description:
            'Embedded C/Python മോട്ടോർ നിയന്ത്രണം, PWM വേഗതാ നിയന്ത്രണം, OpenCV ടെലിമെട്രി, വിദൂര കമാൻഡ് പ്രോട്ടോക്കോൾ എന്നിവ വികസിപ്പിക്കുന്നു.',
          deliverables: ['കൺട്രോൾ ഫേംവെയർ', 'OpenCV ഫീഡ്', 'RF പാക്കറ്റ് ലിങ്ക്'],
        },
        {
          step: '04',
          phase: 'പരിശോധന',
          timeframe: 'ഫീൽഡ് ടെസ്റ്റ്',
          title: 'തടസ്സ & തുരങ്ക പരീക്ഷണങ്ങൾ',
          description:
            'ഡ്രൈവും ക്യാമറയും ഒരേസമയം പ്രവർത്തിക്കുമ്പോൾ വീഡിയോ ലേറ്റൻസി, അപകട മുന്നറിയിപ്പ്, ബാറ്ററി ശേഷി എന്നിവ പരീക്ഷിക്കുന്നു.',
          deliverables: ['റേഞ്ച് പരിശോധന', 'ലേറ്റൻസി ബെഞ്ച്മാർക്ക്', 'ഫീൽഡ് സജ്ജത'],
        },
      ],
      geolocation: [
        {
          step: '01',
          phase: 'ആശയം',
          timeframe: 'ഘട്ടം 01',
          title: 'GPS-രഹിത സിഗ്നൽ പഠനം',
          description:
            'ഭൂമിക്കടിയിലും ഇൻഡോറിലും സാറ്റലൈറ്റ് സിഗ്നൽ നഷ്ടം പഠിച്ച് sub-GHz SX1278 LoRa ബീക്കണുകൾ തിരഞ്ഞെടുക്കുന്നു.',
          deliverables: ['മൾട്ടിപാത്ത് പഠനം', 'RF ലിങ്ക് ബജറ്റ്', 'ആങ്കർ ജ്യാമിതി'],
        },
        {
          step: '02',
          phase: 'ഡിസൈൻ',
          timeframe: 'ഘട്ടം 02',
          title: 'ആങ്കർ നോഡും IMU ഹാർഡ്‌വെയറും',
          description:
            'SX1278 LoRa, MPU6050 6-ആക്സിസ് IMU, HMC5883L മാഗ്നെറ്റോമീറ്റർ, OLED ഡിസ്‌പ്ലേ എന്നിവ ഉൾപ്പെടുത്തിയ ESP32 സ്കീമാറ്റിക്സ് രൂപകൽപ്പന ചെയ്യുന്നു.',
          deliverables: ['Proteus സർക്യൂട്ട്', 'LoRa നോഡ് BOM', 'IMU കാലിബ്രേഷൻ'],
        },
        {
          step: '03',
          phase: 'നിർമ്മാണം',
          timeframe: 'ഘട്ടം 03',
          title: 'ട്രൈലാറ്ററേഷനും Kalman ഫിൽട്ടറിംഗും',
          description:
            'ലോഗരിതമിക് RSSI പാത്ത്-ലോസ് ദൂര ഗണനം, 2D ട്രൈലാറ്ററേഷൻ, MATLAB/Python Kalman സ്മൂത്തിംഗ് എന്നിവ നടപ്പിലാക്കുന്നു.',
          deliverables: ['പാത്ത്-ലോസ് മോഡൽ', 'Kalman ഫിൽട്ടർ', 'OLED ടെലിമെട്രി UI'],
        },
        {
          step: '04',
          phase: 'പരിശോധന',
          timeframe: 'പരിശോധനാ ഘട്ടം',
          title: 'ഓഫ്-ഗ്രിഡ് ഫീൽഡ് പൊസിഷനിംഗ്',
          description:
            'തടസ്സങ്ങളുള്ള മേഖലകളിൽ കോർഡിനേറ്റ് കൃത്യത പരിശോധിക്കുകയും ബീക്കണുകളുടെ ബാറ്ററി ക്ഷമത ക്രമീകരിക്കുകയും ചെയ്യുന്നു.',
          deliverables: ['ഫീൽഡ് ട്രാജക്ടറി', 'കൃത്യതാ റിപ്പോർട്ട്', 'ബാറ്ററി ട്യൂണിംഗ്'],
        },
      ],
    },
  },
};

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  en: EN_TRANSLATIONS,
  ml: ML_TRANSLATIONS,
};

export function getLocalizedReadingTime(id: ProjectId, lang: Language): string {
  const minutes = getProjectReadingMinutes(id);
  const suffix = TRANSLATIONS[lang].works.minReadSuffix;
  return `${minutes} ${suffix}`;
}
