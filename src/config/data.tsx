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
];

export type Lead = {
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
  contactPoints: ContactPoint[];
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

export type Task = {
  id: string;
  isCompleted: boolean;
  contactPoint: ContactPoint;
  action: TaskActions;
  contact: Contact;
  date: Timestamp;
  description?: string;
  assignedTo?: string;
};

export type TaskActions = "initialContact" | "followUp";

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
