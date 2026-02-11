/**
 * Convert a cron expression to a human-readable string.
 * Supports common patterns but not all edge cases.
 */
export function formatCronExpression(cron: string): string {
  const parts = cron.trim().split(/\s+/);

  if (parts.length !== 5) {
    return cron; // Return original if not standard 5-part cron
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Every minute
  if (cron === "* * * * *") {
    return "Every minute";
  }

  // Every N minutes
  if (minute.startsWith("*/") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const interval = minute.substring(2);
    return `Every ${interval} minutes`;
  }

  // Every N hours at specific minute
  if (!minute.includes("*") && hour.startsWith("*/") && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const interval = hour.substring(2);
    const minuteStr = minute === "0" ? "" : ` at :${minute.padStart(2, "0")}`;
    return `Every ${interval} hours${minuteStr}`;
  }

  // Hourly at specific minute
  if (!minute.includes("*") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Hourly at :${minute.padStart(2, "0")}`;
  }

  // Daily at specific time
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const formattedHour = parseInt(hour, 10);
    const period = formattedHour >= 12 ? "PM" : "AM";
    const displayHour = formattedHour > 12 ? formattedHour - 12 : formattedHour === 0 ? 12 : formattedHour;
    return `Daily at ${displayHour}:${minute.padStart(2, "0")} ${period}`;
  }

  // Weekdays at specific time
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth === "*" && month === "*" && dayOfWeek === "1-5") {
    const formattedHour = parseInt(hour, 10);
    const period = formattedHour >= 12 ? "PM" : "AM";
    const displayHour = formattedHour > 12 ? formattedHour - 12 : formattedHour === 0 ? 12 : formattedHour;
    return `Every weekday at ${displayHour}:${minute.padStart(2, "0")} ${period}`;
  }

  // Weekends at specific time
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth === "*" && month === "*" && (dayOfWeek === "0,6" || dayOfWeek === "6,0")) {
    const formattedHour = parseInt(hour, 10);
    const period = formattedHour >= 12 ? "PM" : "AM";
    const displayHour = formattedHour > 12 ? formattedHour - 12 : formattedHour === 0 ? 12 : formattedHour;
    return `Every weekend at ${displayHour}:${minute.padStart(2, "0")} ${period}`;
  }

  // Specific day of week
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth === "*" && month === "*" && !dayOfWeek.includes("*") && !dayOfWeek.includes("/")) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNames = dayOfWeek.split(",").map(d => days[parseInt(d, 10)]).join(", ");
    const formattedHour = parseInt(hour, 10);
    const period = formattedHour >= 12 ? "PM" : "AM";
    const displayHour = formattedHour > 12 ? formattedHour - 12 : formattedHour === 0 ? 12 : formattedHour;
    return `Every ${dayNames} at ${displayHour}:${minute.padStart(2, "0")} ${period}`;
  }

  // Every N days at specific time
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth.startsWith("*/") && month === "*" && dayOfWeek === "*") {
    const interval = dayOfMonth.substring(2);
    const formattedHour = parseInt(hour, 10);
    const period = formattedHour >= 12 ? "PM" : "AM";
    const displayHour = formattedHour > 12 ? formattedHour - 12 : formattedHour === 0 ? 12 : formattedHour;
    return `Every ${interval} days at ${displayHour}:${minute.padStart(2, "0")} ${period}`;
  }

  // Weekly on specific day (using step notation like */7 or 0/7)
  if (!minute.includes("*") && !hour.includes("*") && dayOfMonth === "*" && month === "*" && dayOfWeek.includes("/")) {
    const match = dayOfWeek.match(/^(\d+)\/(\d+)$/);
    if (match) {
      const startDay = parseInt(match[1], 10);
      const interval = parseInt(match[2], 10);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = days[startDay];
      const formattedHour = parseInt(hour, 10);
      const period = formattedHour >= 12 ? "PM" : "AM";
      const displayHour = formattedHour > 12 ? formattedHour - 12 : formattedHour === 0 ? 12 : formattedHour;

      if (interval === 7) {
        return `Every ${dayName} at ${displayHour}:${minute.padStart(2, "0")} ${period}`;
      } else if (interval === 14) {
        return `Every other ${dayName} at ${displayHour}:${minute.padStart(2, "0")} ${period}`;
      }
    }
  }

  // Monthly on specific day
  if (!minute.includes("*") && !hour.includes("*") && !dayOfMonth.includes("*") && month === "*" && dayOfWeek === "*") {
    const formattedHour = parseInt(hour, 10);
    const period = formattedHour >= 12 ? "PM" : "AM";
    const displayHour = formattedHour > 12 ? formattedHour - 12 : formattedHour === 0 ? 12 : formattedHour;
    const day = parseInt(dayOfMonth, 10);
    const suffix = getDayOrdinalSuffix(day);
    return `Monthly on the ${day}${suffix} at ${displayHour}:${minute.padStart(2, "0")} ${period}`;
  }

  // Fallback: return original cron expression
  return cron;
}

function getDayOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  const lastDigit = day % 10;
  if (lastDigit === 1) return "st";
  if (lastDigit === 2) return "nd";
  if (lastDigit === 3) return "rd";
  return "th";
}

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
    });
  }
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format duration in milliseconds to human-readable format
 * Examples: "500ms", "7.5s", "7m 6s"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}
