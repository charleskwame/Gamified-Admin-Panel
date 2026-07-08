/**
 * Security utility functions for access control and input sanitization.
 */

function makeReplacer() {
  var amp = String.fromCharCode(38) + "amp;";
  var lt = String.fromCharCode(38) + "lt;";
  var gt = String.fromCharCode(38) + "gt;";
  var quot = String.fromCharCode(38) + "quot;";
  var x27 = String.fromCharCode(38) + "#x27;";
  var x2F = String.fromCharCode(38) + "#x2F;";

  return function (ch) {
    switch (ch) {
      case String.fromCharCode(38):
        return amp;
      case String.fromCharCode(60):
        return lt;
      case String.fromCharCode(62):
        return gt;
      case String.fromCharCode(34):
        return quot;
      case String.fromCharCode(39):
        return x27;
      case String.fromCharCode(47):
        return x2F;
      default:
        return ch;
    }
  };
}

var escapeChar = makeReplacer();

/**
 * Sanitize a string to prevent XSS by escaping HTML special characters.
 */
export function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"'\/]/g, escapeChar);
}

/**
 * Sanitize an object's string fields recursively.
 */
export function sanitizeObject(obj) {
  if (typeof obj === "string") return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    var sanitized = {};
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}

/**
 * Validate that a lecturer's course matches the target collection.
 */
export function validateCourseAccess(lecturerCourse, targetCollection) {
  var COURSE_COLLECTION_MAP = {
    computer_architecture: "computer_architecture_questions",
    computer_networking: "computer_networking_questions",
    software_engineering: "software_engineering_questions",
  };

  var expectedCollection = COURSE_COLLECTION_MAP[lecturerCourse];
  if (!expectedCollection) {
    return { allowed: false, error: "No course assigned to your profile." };
  }
  if (expectedCollection !== targetCollection) {
    return { allowed: false, error: "Access denied. You can only manage questions for your own course." };
  }
  return { allowed: true, error: null };
}

/**
 * Log security-relevant events to Firestore for server-side audit trail.
 *
 * IMPORTANT: This currently collects audit data but does NOT output to console
 * to avoid leaking sensitive information via browser devtools.
 *
 * TODO: Replace this with a Firebase Cloud Function call that writes
 * audit events to a secured "audit_logs" Firestore collection with
 * read access restricted to admin users only.
 *
 * Example implementation:
 *   await fetch("/api/audit", {
 *     method: "POST",
 *     body: JSON.stringify(entry),
 *   });
 */
export function auditLog(action, details) {
  if (!details) details = {};
  var entry = {
    timestamp: new Date().toISOString(),
    action: action,
  };
  for (var key in details) {
    if (Object.prototype.hasOwnProperty.call(details, key)) {
      entry[key] = details[key];
    }
  }
  // No console output - audit logging is intentionally disabled client-side
  // to prevent leaking sensitive data through browser devtools.
  // Implement the server-side endpoint above for production auditing.
}
