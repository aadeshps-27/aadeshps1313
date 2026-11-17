import heroAbstractImg from '../assets/images/abstract_hero_architecture_1794645779005.jpg';
import vectorAtelierImg from '../assets/images/project_vector_atelier_1794644199666.jpg';
import roboticsAbstractImg from '../assets/images/abstract_robotics_kinematics_1794645780497.jpg';
import rfAbstractImg from '../assets/images/abstract_rf_waveforms_1794645779400.jpg';

export type ProjectCategory = 'all' | 'design' | 'robotics' | 'rf';

export type ProjectId = 'creative' | 'robot' | 'geolocation';

export interface ProjectSummary {
  id: ProjectId;
  filterCategory: Exclude<ProjectCategory, 'all'>;
  indexNumber: string;
  title: string;
  subtitle: string;
  discipline: string;
  year: string;
  summary: string;
  tools: string[];
  image: string;
  imageAlt: string;
  metrics: { label: string; value: string }[];
  specs: { label: string; value: string }[];
  constraints: string[];
}

export interface ExperienceItem {
  index: string;
  kind: 'role' | 'education';
  role: string;
  organization: string;
  location: string;
  period: string;
  description: string;
  focus: string[];
}

export const PROFILE = {
  name: 'Aadesh P S',
  shortName: 'Aadesh',
  location: 'Kerala, India',
  role: 'Creative Developer & Applied Electronics Engineer',
  education: "Master's in Applied Electronics",
  availability: 'Open for select commissions & product teams',
  email: 'aadeshps2015@gmail.com',
  whatsappDisplay: '+91 88938 09997',
  whatsappHref: 'https://wa.me/918893809997',
  linkedinHref: 'https://www.linkedin.com/in/aadeshps27/',
  instagramHref: 'https://www.instagram.com/_aadeshps/',
  heroImage: heroAbstractImg,
  heroImageAlt:
    'Abstract modernist geometric composition of sweeping obsidian, travertine, and cinnabar arcs',
  portraitImage: '/assets/aistudio/file_00000000e600820bbd42f9184960f74d_24f90d41.png',
  portraitImageAlt:
    'Stylized geometric vector portrait illustration of Aadesh P S surrounded by concentric orbital lines',
};

export const DISCIPLINES: {
  number: string;
  title: string;
  detail: string;
  filter: Exclude<ProjectCategory, 'all'>;
}[] = [
  {
    number: '01',
    title: 'Graphics & Vector Art',
    detail: 'Illustrator · Affinity Suite · Identity',
    filter: 'design',
  },
  {
    number: '02',
    title: 'Full-Stack Web Apps',
    detail: 'React · TypeScript · Node.js',
    filter: 'design',
  },
  {
    number: '03',
    title: 'Robotics & IoT',
    detail: 'UGV Hardware · Embedded C · Sensors',
    filter: 'robotics',
  },
  {
    number: '04',
    title: 'RF Geo-Location',
    detail: 'LoRa SX1278 · RSSI · Kalman Filter',
    filter: 'rf',
  },
];

export const PROJECTS: ProjectSummary[] = [
  {
    id: 'creative',
    filterCategory: 'design',
    indexNumber: '01',
    title: 'Digital Art & Vector Mastery',
    subtitle: 'Visual Craft, Brand Geometry & Web Interfaces',
    discipline: 'Visual Arts · UI/UX · Web Development',
    year: '2024 — Present',
    summary:
      'Exploring digital illustration and bezier vector precision alongside modern React architectures — crafting minimal, expressive visual systems where engineering discipline meets human intuition.',
    tools: ['Adobe Illustrator', 'Affinity Suite', 'React', 'TypeScript'],
    image: vectorAtelierImg,
    imageAlt:
      'High-contrast Swiss modernist geometric vector illustration print on textured cotton paper',
    metrics: [
      { label: 'Core Mediums', value: 'Vector, UI & Web' },
      { label: 'Primary Suite', value: 'Illustrator & Affinity' },
      { label: 'Focus', value: 'Human-First Systems' },
    ],
    specs: [
      { label: 'Vector Pipeline', value: 'Bezier Node Architecture' },
      { label: 'Frontend Stack', value: 'React · TypeScript · Tailwind' },
      { label: 'Motion Engine', value: 'GPU-Composited Transforms' },
      { label: 'Compliance', value: 'WCAG AA · Reduced Motion' },
    ],
    constraints: [
      'Maintain strict 60/30/10 visual budget without ornamental UI noise',
      'Prioritize human intuition over technical complexity across interactions',
      'Preserve optical hierarchy and balanced whitespace on all viewports',
    ],
  },
  {
    id: 'robot',
    filterCategory: 'robotics',
    indexNumber: '02',
    title: 'Military Spying Robot',
    subtitle: 'Unmanned Ground Vehicle for Hazardous Reconnaissance',
    discipline: 'Robotics · IoT · Embedded Systems',
    year: '2023',
    summary:
      'Compact mobile unmanned ground vehicle engineered for remote surveillance, live video transmission, and obstacle-aware navigation inside border zones, tunnels, and high-risk environments.',
    tools: ['Arduino / RPi', 'L298N Driver', 'Embedded C / Python', 'RF / Wi-Fi'],
    image: roboticsAbstractImg,
    imageAlt:
      'Abstract geometric Bauhaus print symbolizing autonomous robotics kinematics and sensor trajectories',
    metrics: [
      { label: 'Platform', value: 'Tracked UGV' },
      { label: 'Sensors', value: 'Night Vision & Ultrasonic' },
      { label: 'Control', value: 'Remote Wireless Link' },
    ],
    specs: [
      { label: 'Compute Core', value: 'Arduino / Raspberry Pi' },
      { label: 'Actuation', value: 'L298N H-Bridge Dual PWM' },
      { label: 'Sensor Array', value: 'Night Vision · Ultrasonic · IR' },
      { label: 'Telemetry', value: 'Dual RF & Wi-Fi Video Link' },
    ],
    constraints: [
      'Finite battery endurance under simultaneous traction and live optics load',
      'RF line-of-sight range and multipath signal attenuation inside tunnels',
      'Compact payload weight ceiling across rugged suspension kinematics',
    ],
  },
  {
    id: 'geolocation',
    filterCategory: 'rf',
    indexNumber: '03',
    title: 'Geo-Location Guidance System',
    subtitle: 'Off-Grid RF Positioning in GPS-Denied Environments',
    discipline: 'Applied Electronics · RF Communications',
    year: '2023',
    summary:
      'Satellite-independent positioning architecture utilizing SX1278 LoRa transceivers, RSSI logarithmic path-loss estimation, trilateration, and Kalman smoothing for mines, forests, and warehouses.',
    tools: ['ESP32', 'SX1278 LoRa', 'MPU6050 / HMC5883L', 'MATLAB & Python'],
    image: rfAbstractImg,
    imageAlt:
      'Abstract geometric fine art print of concentric radio frequency interference rings and triangulation vectors',
    metrics: [
      { label: 'Transceiver', value: 'SX1278 LoRa' },
      { label: 'Filtering', value: 'Kalman Trajectory' },
      { label: 'Dependency', value: 'Zero GPS Required' },
    ],
    specs: [
      { label: 'Controller & RF', value: 'ESP32 · SX1278 Sub-GHz' },
      { label: 'Inertial Fusion', value: 'MPU6050 + HMC5883L' },
      { label: 'Positioning', value: 'RSSI Log-Loss + Trilateration' },
      { label: 'Display', value: '0.96" OLED Local Telemetry' },
    ],
    constraints: [
      'Zero dependency on GPS satellites or cellular network backhaul',
      'Indoor multipath RSSI variance smoothed via Kalman trajectory fusion',
      'Low-power duty cycling required for sustained remote anchor nodes',
    ],
  },
];

export const EXPERIENCE: ExperienceItem[] = [
  {
    index: '01',
    kind: 'role',
    role: 'Creative Strategist',
    organization: 'Peoples Urban Development Group & Dashami Finance',
    location: 'Kerala, India',
    period: 'Current',
    description:
      'Directing digital brand presence, visual campaign assets, and multi-channel marketing strategies to drive measurable audience engagement and institutional growth.',
    focus: ['Brand Strategy', 'Visual Campaigns', 'Digital Growth'],
  },
  {
    index: '02',
    kind: 'role',
    role: 'Full-Stack Developer Intern',
    organization: 'Luminar Technolab',
    location: 'Kochi, India',
    period: '2023',
    description:
      'Architected responsive full-stack web interfaces and backend workflows, collaborating across product sprints with React, TypeScript, and Node.js.',
    focus: ['React & TypeScript', 'Node.js APIs', 'Responsive UI'],
  },
  {
    index: '03',
    kind: 'education',
    role: "Master's in Applied Electronics",
    organization: 'Postgraduate Research & Hardware Lab',
    location: 'Kerala, India',
    period: 'Foundation',
    description:
      'Specialized in RF communications, embedded microcontrollers, signal processing, and autonomous sensor-driven robotics — bridging physical hardware with human-centered software.',
    focus: ['Applied Electronics', 'RF & Telemetry', 'Embedded C / Python'],
  },
];

export const PROCESS_PILLARS = [
  {
    step: '01',
    title: 'Strategy',
    desc: 'Framing human requirements and physical constraints before writing a single line of code or drawing a bezier curve.',
  },
  {
    step: '02',
    title: 'Design',
    desc: 'Constructing crisp visual systems, vector identities, and tactile interfaces in Illustrator and Affinity.',
  },
  {
    step: '03',
    title: 'Engineering',
    desc: 'Building performant React frontends, Node.js services, and deterministic microcontroller hardware.',
  },
  {
    step: '04',
    title: 'Launch',
    desc: 'Testing under real-world edge conditions — from browser viewports to off-grid RF field tests.',
  },
];

export const CREATIVE_CASE_STUDY = {
  pillars: [
    {
      title: 'Graphics Design',
      description:
        'Creating structured visual concepts, editorial layouts, and identity systems that communicate immediately without visual noise.',
    },
    {
      title: 'Vector Art',
      description:
        'Precision-crafted digital illustrations built node-by-node in Adobe Illustrator and Affinity Designer with bold geometric character.',
    },
    {
      title: 'Web Development',
      description:
        'Translating expressive art direction into accessible, responsive, high-framerate React and TypeScript applications.',
    },
  ],
  philosophyTitle: 'Soulful Creations',
  philosophyStatement:
    'I believe that every digital product deserves a soul. My work focuses on finding that unique heartbeat — balancing analytical engineering rigor with expressive visual craft.',
  values: ['Intention', 'Empathy', 'Excellence'],
  craftNotes: [
    {
      label: 'Primary Vector Toolkit',
      value: 'Adobe Illustrator & Affinity Designer',
    },
    {
      label: 'UX Logic',
      value: 'Human intuition prioritized over technical complexity',
    },
    {
      label: 'Typographic Discipline',
      value: 'Hierarchy, optical rhythm, and deliberate whitespace',
    },
  ],
};

export const ROBOT_CASE_STUDY = {
  abstract:
    'A Military Spying Robot is an unmanned ground vehicle (UGV) designed to perform surveillance, reconnaissance, and intelligence-gathering operations in hazardous environments. Equipped with night-vision cameras, wireless communication modules, obstacle sensors, and remote-control mechanisms, it monitors inaccessible areas without risking human lives.',
  introduction:
    'Modern tactical operations increasingly rely on compact robotic systems to improve situational awareness before personnel enter unknown spaces. This platform traverses border zones, tunnels, and compromised structures to capture continuous visual and environmental telemetry.',
  subsystems: [
    { name: 'Night Vision', detail: 'Low-light optical capture for dark enclosures' },
    { name: 'Comm Modules', detail: 'Dual RF & Wi-Fi telemetry link' },
    { name: 'Obstacle Detection', detail: 'Ultrasonic & IR proximity array' },
    { name: 'Navigation', detail: 'GPS-assisted outdoor & manual indoor steer' },
  ],
  objectives: [
    'Remote real-time surveillance across obstructed terrain',
    'Low-latency live video transmission to operator station',
    'Safe reconnaissance during hazardous bomb-disposal checks',
    'Minimized risk to human personnel in unknown zones',
    'Compact, field-serviceable chassis architecture',
  ],
  hardwareComponents: [
    'Arduino / Raspberry Pi Compute Core',
    'High-torque DC Motors & L298N H-Bridge Driver',
    'Wireless Night-Vision Camera Module',
    'Wi-Fi / Long-Range RF Transceiver Modules',
    'Ultrasonic & Infrared Proximity Sensors',
    'GPS Module & High-Discharge Battery Pack',
    'Rugged Tracked Chassis & Suspension',
  ],
  softwareComponents: [
    'Embedded C & Python Control Firmware',
    'Arduino IDE & Linux Edge Runtime',
    'OpenCV / Image Processing Pipeline',
    'Custom Command & Telemetry Protocol',
    'Real-Time Video Stream Interface',
  ],
  workingSteps: [
    'Operator dispatches directional and gimbal commands from the remote control console.',
    'Wireless RF/Wi-Fi link relays packetized instructions to the onboard microcontroller.',
    'Microcontroller modulates PWM signals through the L298N motor driver for precise traction.',
    'Onboard camera captures continuous visual feed and streams frames back to the operator.',
    'Ultrasonic and IR sensors monitor forward clearance and flag collision hazards.',
  ],
  quadrants: [
    {
      title: 'Applications',
      items: ['Border surveillance', 'Tunnel inspection', 'Disaster response', 'Search and rescue'],
    },
    {
      title: 'Advantages',
      items: ['Reduced human risk', 'Real-time field intel', 'Compact & portable', 'Cost-effective build'],
    },
    {
      title: 'Limitations',
      items: ['Battery endurance window', 'RF line-of-sight range', 'Payload weight ceiling', 'Multipath interference'],
    },
    {
      title: 'Future Scope',
      items: ['On-device AI navigation', 'Multi-unit swarm relay', 'Thermal imaging payload', 'Articulated EOD arm'],
    },
  ],
  conclusion:
    'By combining optical sensing, obstacle telemetry, and resilient wireless actuation, compact reconnaissance UGVs enable safer intelligence gathering in hazardous areas while paving the way for autonomous field robotics.',
};

export const GEOLOCATION_CASE_STUDY = {
  abstract:
    'This research presents an off-grid geo-location guidance system utilizing Radio Frequency (RF) technology to provide accurate positioning and trajectory guidance in GPS-denied environments such as underground mines, dense forest canopies, and enclosed industrial facilities.',
  introduction:
    'Conventional satellite positioning performs reliably under open sky but degrades rapidly indoors, underground, or under intentional RF jamming. This architecture deploys stationary RF anchor beacons and analyzes Received Signal Strength Indication (RSSI) to triangulate position locally.',
  gpsLimitations: [
    'Severe signal attenuation underground and indoors',
    'Vulnerability to satellite jamming and spoofing',
    'Line-of-sight visibility requirements for optical backup',
    'Accumulated drift in standalone inertial dead-reckoning',
  ],
  rfCapabilities: [
    'Continuous local coordinate estimation without satellites',
    'LoRa SX1278 long-range sub-GHz propagation',
    'RSSI logarithmic path-loss distance modeling',
    'Kalman Filter smoothing for stable trajectory output',
  ],
  operationalFlow: [
    { step: '01', text: 'Reference anchor beacons broadcast periodic sub-GHz RF packets.' },
    { step: '02', text: 'Mobile rover node captures RSSI values across multiple anchors.' },
    { step: '03', text: 'Logarithmic path-loss model converts dBm strength into radial distance.' },
    { step: '04', text: '2D trilateration computes live (X, Y) coordinates inside the zone.' },
    { step: '05', text: 'Kalman Filter fuses IMU heading to smooth multipath jitter.' },
  ],
  hardwareTable: [
    { component: 'Controller', model: 'ESP32', purpose: 'Main compute, Wi-Fi & BLE telemetry' },
    { component: 'RF Transceiver', model: 'SX1278 LoRa', purpose: 'Long-range sub-GHz packet exchange' },
    { component: 'Motion Unit', model: 'MPU6050', purpose: '6-axis gyroscope & accelerometer' },
    { component: 'Magnetometer', model: 'HMC5883L', purpose: 'Magnetic heading reference' },
    { component: 'Display', model: 'OLED 0.96"', purpose: 'On-unit coordinate & RSSI readout' },
  ],
  softwareTools: ['Arduino IDE', 'MATLAB', 'Python', 'Proteus'],
  applications: [
    'Military reconnaissance in jammed zones',
    'Underground mining personnel tracking',
    'Emergency search & rescue operations',
    'Automated indoor warehouse robotics',
  ],
  advantages: [
    'Zero reliance on GPS satellites or cellular internet',
    'Jam-resistant sub-GHz RF beacon topology',
    'Low hardware BOM and rapid anchor deployment',
    'Energy-efficient duty cycling for battery nodes',
  ],
  roadmap: [
    { title: 'AI Calibration', desc: 'Adaptive path-loss exponent tuning per environment' },
    { title: 'UWB Integration', desc: 'Time-of-Flight ranging for centimeter-level precision' },
    { title: '3D Positioning', desc: 'Barometric and multi-plane altitude estimation' },
  ],
  conclusion:
    'Combining RSSI path-loss estimation, geometric trilateration, and Kalman filtering yields a practical, scalable alternative to GPS for robotics, mining, and emergency response in off-grid environments.',
};

const CASE_STUDY_CONTENT_MAP: Record<ProjectId, unknown> = {
  creative: CREATIVE_CASE_STUDY,
  robot: ROBOT_CASE_STUDY,
  geolocation: GEOLOCATION_CASE_STUDY,
};

function collectTextSegments(value: unknown, bucket: string[]): void {
  if (typeof value === 'string') {
    bucket.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextSegments(item, bucket);
    }
    return;
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) {
      collectTextSegments(entry, bucket);
    }
  }
}

export function getProjectReadingMinutes(id: ProjectId): number {
  const summaryProject = PROJECTS.find((p) => p.id === id);
  const caseStudy = CASE_STUDY_CONTENT_MAP[id];

  const segments: string[] = [];
  if (summaryProject) {
    segments.push(
      summaryProject.title,
      summaryProject.subtitle,
      summaryProject.summary,
      ...summaryProject.metrics.map((m) => `${m.label} ${m.value}`)
    );
  }
  collectTextSegments(caseStudy, segments);

  const wordCount = segments
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Deliberate technical/editorial reading pace (words per minute)
  const TECHNICAL_WPM = 130;
  return Math.max(1, Math.ceil(wordCount / TECHNICAL_WPM));
}

export function getProjectReadingTime(id: ProjectId): string {
  const minutes = getProjectReadingMinutes(id);
  return `${minutes} min read`;
}

