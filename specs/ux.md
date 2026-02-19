# UI/UX Specification — DevSanctum

This document defines the user experience principles, interaction patterns, and quality standards for all DevSanctum interfaces. Every feature implementation must follow these guidelines.

---

## 1. Core UX Principles

### 1.1 Clarity over cleverness
Every screen must answer three questions instantly:
- **Where am I?** — current page is always identifiable via title and active nav item.
- **What can I do here?** — primary action is always visible without scrolling.
- **What just happened?** — every user action produces visible, immediate feedback.

### 1.2 Progressive disclosure
Show only what is needed at each step. Reveal complexity on demand.
- Forms show advanced options in a collapsible section, not by default.
- Destructive actions require a confirmation step — never trigger on first click.
- Long lists are paginated or virtualized, not dumped entirely.

### 1.3 Forgiveness
Users make mistakes. The system must make them recoverable.
- Prefer soft-delete over hard-delete where possible.
- Provide undo for non-critical operations.
- Auto-save drafts in long forms (or warn on navigation away).
- Never lose user input on a failed form submission — preserve field values.

### 1.4 Consistency
- The same action always looks and behaves the same across pages.
- Vocabulary is consistent: do not mix "Workspace" and "Environment" in the same interface.
- Icon usage is consistent: the same icon always means the same thing.

---

## 2. Loading & Async States

Every data-fetching operation goes through four distinct states. All four must be handled.

| State | What to show |
|-------|-------------|
| **Loading** | Skeleton placeholders (not a blank page, not a spinner alone) |
| **Success** | The actual content |
| **Empty** | Purposeful empty state with explanation and a call to action |
| **Error** | Inline `Flash variant="danger"` with a retry action |

### Rules
- **Never show a blank screen.** Skeleton loading must match the shape of the content.
- **Never block the whole page** for a background operation. Use inline spinners or toast notifications.
- **Indicate progress** for operations longer than 300ms. Use `loading` prop on buttons to prevent double-submission.
- **Auto-retry** transient network errors silently once before showing the error state.

### Example pattern

```tsx
if (isLoading) return <WorkspaceListSkeleton />;
if (error) return <Flash variant="danger">{error.message} <Button onClick={retry}>Retry</Button></Flash>;
if (!data?.length) return <EmptyState ... />;
return <WorkspaceList items={data} />;
```

---

## 3. Feedback & Notifications

### Immediate feedback (< 1s)
- Button enters `loading` state on click.
- Form inputs show validation status on blur (not on every keystroke).

### Operation feedback (1–5s)
- Use an inline `Flash` banner at the top of the affected section.
- Auto-dismiss success flashes after 5 seconds.
- Error flashes persist until dismissed by the user.

### Background operation feedback (> 5s or async)
- Show a persistent status indicator (progress bar or spinner) in the relevant card/row.
- Update in-place when the operation completes — do not force a full page reload.

### Flash placement
- **Page-level** feedback: below the page `Heading`, above the content.
- **Form-level** feedback: above the submit button row.
- **Dialog-level** feedback: inside the dialog body, above the form.

### Do not use browser `alert()` or `confirm()`
Always use Primer's `Dialog` for confirmations and `Flash` for messages.

---

## 4. Forms

### Layout rules
- One column layout for forms narrower than 600px, two columns max for wider.
- Group related fields visually using spacing and optional `Heading` dividers.
- Required fields are marked with the `required` prop — do not use asterisks in labels.
- Place the primary CTA at the bottom right, cancel/secondary at the bottom left.

### Validation rules
- **Client-side validation** runs on blur, not on change (avoids annoying red errors while typing).
- **Server-side errors** are mapped back to individual fields using `FormControl.Validation`.
- The submit button is enabled at all times — do not disable until first submission attempt.
- Show a single `Flash variant="danger"` summary at the top for server errors that cannot be mapped to a field.

### Dangerous operations
Any action that destroys data or causes irreversible changes must:
1. Use a `variant="danger"` button.
2. Open a `Dialog` asking for explicit confirmation.
3. For high-impact actions (deleting a workspace with data): require the user to type the resource name to confirm.

```tsx
// High-impact confirmation pattern
<FormControl>
  <FormControl.Label>
    Type <strong>{workspace.name}</strong> to confirm deletion
  </FormControl.Label>
  <TextInput
    value={confirmValue}
    onChange={(e) => setConfirmValue(e.target.value)}
    block
  />
</FormControl>
<Button
  variant="danger"
  disabled={confirmValue !== workspace.name}
  onClick={handleDelete}
>
  Delete this workspace
</Button>
```

---

## 5. Navigation & Information Architecture

### Hierarchy
```
App Header (global)
└── Section (UnderlineNav or NavList sidebar)
    └── Page (Heading + content)
        └── Sub-section (anchored Heading or Accordion)
```

### Rules
- Maximum **2 levels** of navigation visible at a time.
- Active page is always highlighted in nav (`aria-current="page"`).
- Breadcrumbs are shown on detail pages (3+ levels deep).
- Back navigation uses the browser back button — do not add redundant "Back" links unless the flow is a multi-step wizard.

### URL design
- URLs are bookmarkable and shareable for every meaningful view.
- Filters and search queries are reflected in the URL search params.
- Dialog/modal state is **not** reflected in the URL (use React state).

### Multi-step flows (wizards)
Use a step indicator for flows with 3+ steps:
- Show total number of steps and current position.
- Allow navigating back to previous steps without losing data.
- Do not auto-advance on step completion — require explicit "Next" action.

---

## 6. Tables & Lists

### When to use which
| Pattern | Use when |
|---------|----------|
| `ActionList` | < 20 items, each clickable/navigable, varying metadata |
| `DataTable` | Tabular data, sortable columns, bulk selection needed |
| Card grid | Visual items (templates, images) where shape matters |

### Table rules
- Every table must have an **empty state** (never render an empty `<table>`).
- Provide column sorting for any column that is likely to be compared.
- Show **row count** in the section heading or table caption.
- Long tables are paginated at 25 items per page by default.
- Row actions go in an `ActionMenu` in the last column — do not add multiple icon buttons per row.

### List rules
- Show `ActionList.Description` for metadata, not as a separate column.
- Use `Label` for status — not text strings or coloured dots alone.
- Group items when there is a natural categorization (`ActionList.Group`).

---

## 7. Accessibility

### Keyboard navigation
- All interactive elements are reachable via `Tab`.
- Dialogs trap focus and restore it on close.
- Dropdown menus are navigable with arrow keys (Primer handles this).
- Custom keyboard shortcuts (if any) are documented and do not conflict with browser defaults.

### Colour & contrast
- Never use colour as the only differentiator. Combine with icon, label text, or shape.
- Status indicators always combine a `Label` with text, not just a coloured dot.
- Do not use `fg.subtle` for interactive elements — only for decorative/secondary text.

### Screen readers
- All `IconButton` elements have `aria-label`.
- Images and decorative icons use `aria-hidden={true}`.
- Dynamic content updates use `aria-live="polite"` for non-critical updates, `aria-live="assertive"` for errors.
- Tables have `aria-labelledby` pointing to their heading.

### Focus management
- After a dialog closes, focus returns to the trigger element.
- After a form is submitted and the view changes, focus moves to the new heading.
- After an item is deleted from a list, focus moves to the next item or the empty state.

---

## 8. Responsive Design

### Breakpoints (Primer defaults)
| Name | Width |
|------|-------|
| `narrow` | < 544px |
| `regular` | 544–1012px |
| `wide` | > 1012px |

### Rules
- All pages are usable on `narrow` — no horizontal scrolling.
- Sidebar (`PageLayout.Pane`) collapses on narrow. Provide `UnderlineNav` as a fallback if needed.
- Tables collapse to a card-list view on narrow using responsive rendering.
- Touch targets are minimum 44×44px.

### Responsive `sx` syntax
```tsx
// Show row on regular+, column on narrow
<Box sx={{ display: 'flex', flexDirection: ['column', 'row'], gap: 2 }}>
```

---

## 9. Performance Perception

- **Optimistic UI:** update the list immediately on create/delete, then confirm with server. Roll back on error.
- **Debounce** search inputs at 300ms before firing API requests.
- **Lazy load** routes using `React.lazy` + `Suspense` to keep initial bundle small.
- **Avoid layout shift:** skeleton placeholders must match the height of the loaded content.
- Long-running backend operations (container provisioning) use **polling** or **server-sent events** — never block the UI.

---

## 10. Error Handling

### Error categories

| Type | Handling |
|------|---------|
| Network failure | Retry once silently, then show `Flash variant="danger"` with retry button |
| 401 Unauthorized | Redirect to `/login` preserving the intended URL in `?redirect=` |
| 403 Forbidden | Show inline message explaining the missing permission — do not redirect |
| 404 Not Found | Show inline empty/not-found state within the page context |
| 422 Validation | Map errors to form fields via `FormControl.Validation` |
| 500 Server Error | Show `Flash variant="danger"` with a support reference if available |

### Error messages
- Be specific: *"The workspace name is already taken."* not *"Invalid input."*
- Suggest a fix: *"Choose a different name or delete the existing workspace."*
- Never expose internal error codes, stack traces, or database messages to the user.

---

## 11. Tone & Microcopy

- Use **sentence case** for all labels, headings, and buttons. Not Title Case.
- Button labels are **verbs**: *"Deploy"*, *"Save changes"*, *"Delete workspace"* — not *"OK"* or *"Submit"*.
- Empty state copy explains **why** it is empty and **what to do**: *"No workspaces yet. Deploy one to get started."*
- Confirmation dialogs state the **consequence**, not a vague question: *"This will permanently delete all data in this workspace."*
- Avoid jargon. Prefer *"stopped"* over *"terminated"*, *"connecting"* over *"initialising tunnel"*.
