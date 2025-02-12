import {clsx, type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";
import {Timestamp} from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hexToRgba = (hex: string, alpha: number) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const convertTimestampToDate = (timestamp: Timestamp): Date => {
  const milliseconds =
    timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
  return new Date(milliseconds);
};

export const convertDateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

export const formatTimeDifference = (timestamp: Timestamp): string => {
  const now = new Date();
  const timestampDate = convertTimestampToDate(timestamp);

  // Extract only the year, month, and day for comparison (ignoring time)
  const nowDateOnly = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const timestampDateOnly = new Date(
    timestampDate.getFullYear(),
    timestampDate.getMonth(),
    timestampDate.getDate()
  );

  const diffMs = timestampDateOnly.getTime() - nowDateOnly.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffDays === 0) {
    return "today";
  }

  // Handle past times
  if (diffDays < 0) {
    if (diffDays === -1) return "yesterday";
    if (diffDays > -7)
      return `${Math.abs(diffDays)} day${
        Math.abs(diffDays) === 1 ? "" : "s"
      } ago`;
    return `${Math.abs(diffWeeks)} week${
      Math.abs(diffWeeks) === 1 ? "" : "s"
    } ago`;
  }

  // Handle future times
  if (diffDays === 1) return "tomorrow";
  if (diffDays < 7) return `in ${diffDays} days`;

  // Handle next week references
  const daysUntilNextMonday = (1 - nowDateOnly.getDay() + 7) % 7 || 7; // Days until next Monday
  if (diffDays === daysUntilNextMonday) return "next Monday";

  return `in ${diffWeeks} week${diffWeeks === 1 ? "" : "s"}`;
};

export const getFaviconUrl = (url: string) => {
  const domain = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
};

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const formatDate = (date: Date | undefined): string => {
  if (!date) return "";

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month}, ${year}`;
};
