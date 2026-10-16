export interface ZoomValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  error?: string;
}

/**
 * Validates and normalizes Zoom meeting and personal room URLs.
 * Supports:
 * - https://zoom.us/j/{meetingId}
 * - https://*.zoom.us/j/{meetingId}
 * - https://zoom.us/my/{personalLink}
 * - https://*.zoom.us/my/{personalLink}
 * - https://zoom.us/w/{webinarId}
 * - https://zoomgov.com/j/{meetingId}
 */
export function validateZoomLink(rawUrl: string | null | undefined): ZoomValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return {
      isValid: false,
      normalizedUrl: "",
      error: "Link Zoom tidak boleh kosong.",
    };
  }

  let trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: "",
      error: "Link Zoom tidak boleh kosong.",
    };
  }

  // Prepend https:// if protocol is missing (e.g. "zoom.us/j/123456789")
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let urlObj: URL;
  try {
    urlObj = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      normalizedUrl: "",
      error: "Format URL tidak valid. Pastikan tautan lengkap dan benar.",
    };
  }

  if (urlObj.protocol !== "https:" && urlObj.protocol !== "http:") {
    return {
      isValid: false,
      normalizedUrl: "",
      error: "Tautan harus menggunakan protokol HTTPS (misal: https://zoom.us/j/...)",
    };
  }

  const hostname = urlObj.hostname.toLowerCase();
  const isZoomHost =
    hostname === "zoom.us" ||
    hostname.endsWith(".zoom.us") ||
    hostname === "zoomgov.com" ||
    hostname.endsWith(".zoomgov.com");

  if (!isZoomHost) {
    return {
      isValid: false,
      normalizedUrl: "",
      error: "Tautan harus berasal dari domain resmi Zoom (misal: zoom.us atau [nama].zoom.us).",
    };
  }

  const pathname = urlObj.pathname;

  // Zoom Meeting ID: 9 to 11 digits (sometimes formatted with dashes, e.g. 939-291-2653)
  const isMeeting = /^\/j\/[\d-]{9,15}/i.test(pathname);
  // Zoom Personal Link (PMI vanity): /my/username
  const isPersonalLink = /^\/my\/[a-zA-Z0-9._-]{2,50}/i.test(pathname);
  // Zoom Webinar: /w/1234567890
  const isWebinar = /^\/w\/[\d-]{9,15}/i.test(pathname);
  // Zoom Web Client: /wc/1234567890/... or /wc/join/1234567890
  const isWebClient = /^\/wc\/(join\/)?[\d-]{9,15}/i.test(pathname);
  // Custom prefix: /custom/j/1234567890
  const isCustomPath = /^\/[a-zA-Z0-9_-]+\/j\/[\d-]{9,15}/i.test(pathname);

  if (!isMeeting && !isPersonalLink && !isWebinar && !isWebClient && !isCustomPath) {
    return {
      isValid: false,
      normalizedUrl: "",
      error: "Format tautan meeting Zoom tidak valid. Gunakan format https://zoom.us/j/[meeting-id] atau https://zoom.us/my/[personal-id]",
    };
  }

  // Force HTTPS
  urlObj.protocol = "https:";

  return {
    isValid: true,
    normalizedUrl: urlObj.toString(),
  };
}
