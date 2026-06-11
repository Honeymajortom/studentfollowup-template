// Frontend validation helpers — mirrors backend Joi rules so errors surface before a round-trip.

export const isValidMobile = (v) => /^[6-9]\d{9}$/.test((v || "").trim());
export const isValidEmail  = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());

export function validateStudentForm(form) {
  const e = {};
  if (!form.full_name?.trim())
    e.full_name = "Full name is required";
  if (!form.mobile?.trim())
    e.mobile = "Mobile number is required";
  else if (!isValidMobile(form.mobile))
    e.mobile = "Enter a valid 10-digit Indian mobile (starts with 6–9)";
  if (form.parent_mobile && !isValidMobile(form.parent_mobile))
    e.parent_mobile = "Enter a valid 10-digit Indian mobile";
  if (form.email && !isValidEmail(form.email))
    e.email = "Enter a valid email address";
  if (!form.course_id)
    e.course_id = "Please select a course";
  if (!form.counselor_id)
    e.counselor_id = "Please assign a counselor";
  if (form.total_fees !== "" && form.total_fees !== undefined) {
    if (isNaN(Number(form.total_fees)) || Number(form.total_fees) <= 0)
      e.total_fees = "Total fees must be a positive number";
  }
  return e;
}

export function validateLeadForm(form) {
  const e = {};
  if (!form.name?.trim())
    e.name = "Name is required";
  if (!form.mobile?.trim())
    e.mobile = "Mobile number is required";
  else if (!isValidMobile(form.mobile))
    e.mobile = "Enter a valid 10-digit Indian mobile (starts with 6–9)";
  if (form.email && !isValidEmail(form.email))
    e.email = "Enter a valid email address";
  return e;
}

export function validateFollowupForm(form) {
  const e = {};
  if (!form.student_id)
    e.student_id = "Please select a student";
  if (!form.scheduled_at)
    e.scheduled_at = "Scheduled date & time is required";
  return e;
}

export function validateCompleteForm(form) {
  const e = {};
  if (!form.outcome?.trim())
    e.outcome = "Please select a call outcome";
  if (!form.status)
    e.status = "Please select a status";
  return e;
}

// Returns true if the errors object has any keys
export const hasErrors = (e) => Object.keys(e).length > 0;
