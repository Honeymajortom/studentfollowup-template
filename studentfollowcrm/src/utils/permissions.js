// Maps each route/page id → roles that are allowed to access it.
// Used by both the sidebar (to hide nav items) and route guards (to block direct URL access).
export const PAGE_ROLES = {
  dashboard:       ["admin", "counselor", "trainer", "accountant"],
  students:        ["admin", "counselor", "trainer", "accountant"],
  "student-profile": ["admin", "counselor", "trainer", "accountant"],
  "add-student":   ["admin", "counselor"],
  "edit-student":  ["admin", "counselor"],
  leads:           ["admin", "counselor"],
  "lead-profile":  ["admin", "counselor"],
  followups:       ["admin", "counselor"],
  whatsapp:        ["admin", "counselor"],
  fees:            ["admin", "counselor", "accountant"],
  courses:         ["admin", "counselor", "trainer"],
  attendance:      ["admin", "counselor", "trainer"],
  reports:         ["admin", "counselor", "accountant"],
  staff:           ["admin"],
  settings:        ["admin", "counselor", "trainer", "accountant"],
};

export function canAccess(role, page) {
  return PAGE_ROLES[page]?.includes(role) ?? false;
}
