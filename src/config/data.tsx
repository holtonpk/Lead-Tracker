import {InstagramLogo2, LinkedInLogo, XLogo} from "@/components/icons";
import {DocumentReference} from "firebase/firestore";
import {
  CheckCircle,
  Circle,
  CalendarCheck,
  HelpCircle,
  Timer,
  CircleX,
  Frown,
  Mail,
  Phone,
  CircleEllipsis,
  Link,
} from "lucide-react";

export const ADMIN_USERS = [
  "DFXXsRtmfFUk8Vd7Y2LUS5rhY423",
  "LfoSX841aFViZB0FDqlJ5a4axWJ2",
  "KWfkeozhuHhq95XIkuhUhLYmSci1",
];

export type Lead = {
  apollo_id?: string;
  name: string;
  description: string;
  sourceId: string;
  website: string;
  linkedIn?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  score: number;
  // status: Statuses;
  contacts?: Contact[];
  lists: string[];
  source: string;
  id: string;
  tasks?: Task[];
  createdBy: string;
  completed?: Completed;
  people?: People[];
  organization_id?: string | null;
  apollo_lists?: string[];
};

type Completed = {
  type: "unqualified" | "callScheduled";
  date: Timestamp;
};

// deelete this later ================================
// export type LeadData = {
//   name: string;
//   description: string;
//   website: string;
//   linkedIn?: string;
//   notes?: string;
//   score: number;
//   status: Statuses;
//   source: string;
// };

// type Statuses =
//   | "uncontacted"
//   | "pendingResponse"
//   | "negativeResponse"
//   | "positiveResponse"
//   | "callScheduled"
//   | "closed";

//   type SourceData = [
//     "Spectrum Equity Portfolio",
//     "Random",
//     "Cult of pedagogy",
//     "Product Hunt",
//     "Swipe labs client",
//   ];
// +++++++++++++++++++++++++++++++++++++++

// export type Contact = {
//   firstName: string;
//   lastName: string;
//   contactPoint: ContactPoint;
//   role: string;
//   status:
//     | "uncontacted"
//     | "pendingResponse"
//     | "negativeResponse"
//     | "positiveResponse"
//     | "callScheduled"
//     | "closed";
// };

export type Contact = {
  id: string;
  name: string;
  role: string;
  photo_url?: string;
  contactPoints: ContactPoint[];
  apollo_id?: string;
};

export type ContactPoint = {
  type: string;
  value: string;
  id: string;
};

// type ContactPoint = {
//   type:
//     | "email"
//     | "phone"
//     | "linkedIn"
//     | "instagram"
//     | "x"
//     | "discord"
//     | "website form";
//   value: string;
//   contacted: boolean;
//   // contactedOn: Timestamp;
//   contactCopy: string;
// };

export type taskTemplate = {
  leads: Lead[];
  cadence: taskCadence;
  tasks: Task[];
};

type taskCadence = {
  startDate: Date;
  followUpTime: number;
  followUpVolume: number;
};

export type Task = {
  id: string;
  isCompleted: boolean;
  action: TaskActions;
  // contactId?: string;
  // contactPoints?: string[];
  contact: string;
  // contact: Contact;
  date: Timestamp;
  outreachCopy?: string;
  assignedTo?: string;
  taskCadence?: taskCadence;
};

export type TaskActions = "research" | "initialContact" | "followUp";

export type Roles = [
  "CEO",
  "Founder",
  "Co-Founder",
  "Social media manager",
  "Marketing manager",
  "CMO",
  "Other"
];

// needs to be dynamic -----------------------

export const RolesData = [
  "CEO",
  "Founder",
  "Co-Founder",
  "Social media manager",
  "Marketing manager",
  "CMO",
  "Other",
];

export const SourceData = [
  "Spectrum Equity Portfolio",
  "Random",
  "Cult of pedagogy",
  "Product Hunt",
  "Swipe labs client",
];

export type SourceType = {
  label: string;
  color: string;
  id: string;
};

export const SourceDataFull = [
  {label: "Swipe labs client", color: "#4F39F6"},
  {label: "Spectrum Equity Portfolio", color: "#FF5733"},
  {label: "Random", color: "#33A1FF"},
  {label: "Cult of pedagogy", color: "#28A745"},
  {label: "Product Hunt", color: "#FFC107"},
];
// --------------------------------------

export const ContactTypeData = [
  {
    label: "LinkedIn",
    value: "linkedIn",
    icon: LinkedInLogo,
  },
  {
    label: "Email",
    value: "email",
    icon: Mail,
  },
  {
    label: "Phone",
    value: "phone",
    icon: Phone,
  },
  {
    label: "URL",
    value: "url",
    icon: Link,
  },
  {
    label: "Instagram",
    value: "instagram",
    icon: InstagramLogo2,
  },
  {
    label: "X",
    value: "x",
    icon: XLogo,
  },
  {
    label: "Other",
    value: "other",
    icon: CircleEllipsis,
  },
];

type Statuses =
  | "uncontacted"
  | "pendingResponse"
  | "negativeResponse"
  | "positiveResponse"
  | "callScheduled"
  | "closed";

export type Status = {
  label: string;
  id: Statuses;
  icon: any;
  color: string;
};

export type List = {
  name: string;
  description: string;
  id: string;
  color: string;
};

interface Timestamp {
  nanoseconds: number;
  seconds: number;
}

export const TagColors = [
  "#64748b",
  "#a1a1aa",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
];

export const LeadStatuses: Status[] = [
  {
    label: "Uncontacted",
    id: "uncontacted",
    icon: <Circle className="h-4 w-4 text-gray-600" />,
    color: "#697282",
  },
  {
    label: "Pending response",
    id: "pendingResponse",
    icon: <Timer className="h-4 w-4 text-yellow-400" />,
    color: "#FDC700",
  },
  {
    label: "Negative response",
    id: "negativeResponse",
    icon: <Frown className="h-4 w-4 text-red-600" />,
    color: "#E8000B",
  },
  {
    label: "Positive response",
    id: "positiveResponse",
    icon: <CheckCircle className="h-4 w-4 text-green-600" />,
    color: "#00A73D",
  },
  {
    label: "Call Scheduled",
    id: "callScheduled",
    icon: <CalendarCheck className="h-4 w-4 text-blue-600" />,
    color: "#155DFC",
  },

  {
    label: "Closed",
    id: "closed",
    icon: <CircleX className="h-4 w-4 text-red-600" />,
    color: "#E8000B",
  },
];

export type People = {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url: string;
  title: string;
  email_status: string;
  photo_url: string;
  twitter_url: string | null;
  github_url: string | null;
  facebook_url: string | null;
  extrapolated_email_confidence: string | null;
  headline: string;
  email: string;
  organization_id: string;
  employment_history: EmploymentHistory[];
  state: string;
  city: string;
  country: string;
  organization: Organization;
  departments: string[];
  subdepartments: string[];
  seniority: string;
  functions?: string[];
  intent_strength?: string | null;
  show_intent?: boolean;
  email_domain_catchall?: boolean;
  revealed_for_current_team?: boolean;
};

type Organization = {
  id: string;
  name: string;
  website_url: string;
  linkedin_url: string;
  twitter_url: string | null;
  facebook_url: string | null;
  primary_phone: {
    number: string;
    source: string;
    sanitized_number: string;
  };
  alexa_ranking?: number | null;
  phone?: string;
  linkedin_uid?: string;
  founded_year?: number;
  logo_url?: string;
  primary_domain?: string;
  sanitized_phone?: string;
  languages?: string[];
  functions?: string[];
  intent_strength?: string | null;
  show_intent?: boolean;
  email_domain_catchall?: boolean;
  revealed_for_current_team?: boolean;
};

type EmploymentHistory = {
  _id: string;
  created_at: string | null;
  current: boolean;
  degree: string | null;
  description: string | null;
  emails: string[] | null;
  end_date: string | null;
  grade_level: string | null;
  kind: string | null;
  major: string | null;
  organization_id: string | null;
  organization_name: string;
  raw_address: string | null;
  start_date: string | null;
  title: string;
  updated_at: string | null;
  id: string;
  key: string;
  languages?: string[];
  phone?: string;
  alexa_ranking?: number;
  linkedin_uid?: string;
  founded_year?: number;
  logo_url?: string;
  primary_domain?: string;
};
