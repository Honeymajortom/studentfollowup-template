# EduFollow CRM — Improvement Roadmap

## Status Legend
- [ ] Todo
- [x] Done
- [~] In Progress

---

## Step 1 — Complete the Leads Module
**Goal:** Make the Leads page fully functional end-to-end.

### Tasks
- [x] Route `/leads` and sidebar nav item wired in `App.jsx` and `Sidebar.jsx`
- [x] `leads.api.js` with full CRUD + convert endpoint
- [x] `Leads.jsx` — list, filters, pagination, add/edit modal, convert-to-student modal
- [x] Fix `reload()` bug — ignores active filters (courseF, statusF, counselorF) after saving a lead
- [x] Create `LeadProfile.jsx` page — the View (Eye) button navigates to `/lead-profile/:id` which has no route
- [x] Add `/lead-profile/:id` route to `App.jsx`
- [x] Backend: `migrations/add_leads_table.sql` — leads table, indexes, auto lead_code trigger
- [x] Backend: `migrations/run_leads.js` — standalone migration runner
- [x] Backend: `controllers/leads.controller.js` — list, getOne, create, update, remove, convert, timeline
- [x] Backend: `routes/leads.routes.js` — all routes with auth + role guards
- [x] Backend: lead Joi schemas added to `middleware/validate.js`
- [x] Backend: `/api/leads` registered in `routes/index.js`

---

## Step 2 — Role-Based UI Gating
**Goal:** Show/hide menu items and pages based on the logged-in user's role (admin, counselor, trainer, accountant).

### Tasks
- [x] Read role from `AuthContext` — `user.role` already available
- [x] Define a permission map — `src/utils/permissions.js` with `PAGE_ROLES` + `canAccess()`
- [x] Guard sidebar `NAV` items — `Sidebar.jsx` filters to `visibleNav` based on role
- [x] Redirect unauthorised direct URL access — `RoleGuard` component in `App.jsx` wraps all restricted routes

---

## Step 3 — Dashboard Date-Range Filter
**Goal:** Allow counselors to filter dashboard KPIs and charts by date range (today / this week / this month / custom).

### Tasks
- [x] Add a date-range picker component to the Dashboard header — Today / This Week / This Month / Last Month / Custom
- [x] Pass `from` / `to` query params to the backend dashboard API — backend already supported it
- [x] Update Recharts data to reflect the selected range — both KPI and admissions chart re-fetch on range change

---

## Step 4 — Client-Side Form Validation
**Goal:** Catch simple input errors (empty required fields, invalid phone, bad email) before a server round-trip.

### Tasks
- [x] Add validation helpers — `src/utils/validate.js` with `isValidMobile`, `isValidEmail`, `validateStudentForm`, `validateLeadForm`, `validateFollowupForm`, `validateCompleteForm`, `hasErrors`
- [x] Extend `FormField` — new `error` prop renders inline red message; `hint` still shows when no error
- [x] `AddStudent.jsx` — validates full_name, mobile (format), parent_mobile (format), email (format), course, counselor, total_fees; errors clear per-field on edit
- [x] `Leads.jsx` `LeadFormModal` — validates name, mobile (format), email (format)
- [x] `Followups.jsx` complete modal — validates outcome (required), status (required)
- [x] `Followups.jsx` Add Follow-up modal — replaced placeholder with real form (student picker, type, datetime, notes); validates student + scheduled_at
- [x] Disable submit buttons when errors exist (Save Student, Add Lead, Schedule Follow-up)

---

## Step 5 — In-App Follow-Up Reminder Notifications
**Goal:** Surface pending follow-up reminders inside the app without requiring the counselor to leave.

### Tasks
- [x] Backend: `GET /api/followups/notifications` — today's + overdue non-completed follow-ups; counselors see only their own, admins see all
- [x] `src/hooks/useNotifications.js` — polls every 60s, silent on error, exposes `{ items, count, loading, refetch }`
- [x] `Navbar.jsx` — live count badge (red number, grayed dot when 0), dropdown with per-item type icon + overdue label + time, outside-click closes, "View all" navigates to /followups

---

## Step 6 — Bulk Actions on Lists ✅
**Goal:** Let staff perform common operations on multiple records at once.

### Tasks
- [x] Checkbox column on Students and Fees tables
- [x] "Assign counselor" bulk action on Students
- [x] "Mark as received" bulk action on Fees list
- [x] Select-all / deselect-all toggle in table header

---

## Step 7 — WhatsApp Message Templates ✅
**Goal:** Standardise outbound WhatsApp messages with pre-defined templates.

### Tasks
- [x] Template definitions (fee reminder, demo invite, enrollment confirmation) — seeded in DB; admin can create/edit/delete via UI
- [x] Template picker in the WhatsApp send modal — full-page rich cards + dropdown in Quick Send sidebar
- [x] Variable substitution (student name, fee amount, date) — live preview with sample values in cards, send modal, and template editor

---

## Step 8 — Empty States with CTAs ✅
**Goal:** Replace blank tables with helpful prompts that guide the user to the next action.

### Tasks
- [x] `EmptyState` component extended with optional `action` prop — renders a CTA button
- [x] Students — no filters: "No students yet" + "+ Add Student" → /add-student; filters active: "No students match your filters" + "Clear Filters"
- [x] Leads — no filters: "No leads found" + "+ Add Lead" → opens add modal; filters active: text-only
- [x] Fees — "No fee records yet" + explanation + "+ Add a Student" → /add-student
- [x] Follow-ups — "No follow-ups yet" / "No {tab} follow-ups" + "+ Schedule Follow-up" → opens add modal
- [x] Attendance — no course selected: "Select a course to begin"; no students in course: "No students in this course" + "Go to Students" → /students

---

## Step 9 — Mobile Responsiveness ✅
**Goal:** Ensure table-heavy pages work on tablets and phones.

### Tasks
- [x] `useIsMobile(breakpoint)` hook — subscribes to `matchMedia` change events
- [x] `Layout.jsx` — mobile backdrop overlay; sidebar toggle becomes drawer open/close on mobile; main content full-width
- [x] `Sidebar.jsx` — `mobile` + `mobileOpen` props; fixed-position overlay drawer with slide-in animation on mobile; icon-only collapse preserved on desktop
- [x] `global.css` — `.hide-mobile` / `.hide-tablet` utility classes; `.stats-grid` responsive (4→2 cols at ≤767px and ≤1023px); tighter modal + page padding on mobile
- [x] `Students.jsx` — card-based layout (`StudentCard`) on mobile; table on desktop; bulk select works in both views
- [x] `Fees.jsx` — card-based layout (`FeeCard`) on mobile; Total / Paid / Due 3-column mini grid per card; table on desktop
- [x] `stats-grid` class applied to Fees and WhatsApp stats strips for responsive reflow

---

## Step 10 — Export to CSV / PDF ✅
**Goal:** Let staff download lists for offline use or printing.

### Tasks
- [x] `services/export.service.js` — `studentsToCSV`, `feesToCSV`, `studentsToPDF`, `feesToPDF`; PDF uses PDFKit with branded header, alternating-row table, colour-coded status cells; CSV includes all key fields with proper escaping
- [x] `GET /api/students/export?format=csv|pdf&search=&status=&course_id=&fees_status=` — respects all active filters, streams file with correct Content-Disposition
- [x] `GET /api/fees/export?format=csv|pdf&status=&course_id=` — same pattern; PDF footer shows collected / pending totals
- [x] `ExportMenu` shared component — dropdown button with outside-click close; shows "📄 Export CSV" and "📑 Export PDF" options; loading state while downloading
- [x] Export button on Students page passes active filters to export endpoint
- [x] Export button on Fees page triggers download
