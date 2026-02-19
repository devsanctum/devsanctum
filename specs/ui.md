# UI Components — Primer React Reference

This document defines the standard Primer React patterns used across DevSanctum.
All UI must follow GitHub's design language. Do not use custom CSS when a Primer component or `sx` prop covers the need.

---

## Core Principles

- **Use Primer components first.** Only fall back to raw HTML or styled-components when no Primer component fits.
- **Use `sx` for one-off overrides.** Do not create wrapper styled-components for layout tweaks.
- **Use design tokens, not hardcoded values.** Colors: `fg.default`, `canvas.subtle`, `border.default`. Spacing: numeric scale (`1`–`6`). Font sizes: numeric scale (`0`–`6`).
- **Support light and dark themes.** Never hardcode hex colors. Primer's `ThemeProvider` handles theming.
- **Accessibility first.** All interactive elements need visible focus. Use semantic HTML (`as` prop). Provide `aria-label` for icon-only buttons.

---

## 1. Page Layout

Every page uses `PageLayout` as the root container. The `Header` is rendered in `MainLayout` and is global.

### Standard page (content only)

```tsx
import { PageLayout, Heading, Box } from '@primer/react';

<PageLayout containerWidth="xlarge">
  <PageLayout.Content>
    <Heading as="h1" sx={{ mb: 4 }}>Page Title</Heading>
    {/* page content */}
  </PageLayout.Content>
</PageLayout>
```

### Page with sidebar (e.g. settings, admin)

```tsx
<PageLayout containerWidth="xlarge">
  <PageLayout.Pane position="start" width="medium">
    {/* sidebar nav */}
  </PageLayout.Pane>
  <PageLayout.Content>
    {/* main content */}
  </PageLayout.Content>
</PageLayout>
```

### Page with header actions (title + button row)

```tsx
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
  <Heading as="h1">{title}</Heading>
  <Button variant="primary" leadingVisual={PlusIcon}>New Item</Button>
</Box>
```

---

## 2. Navigation

### Top-level app header (`MainLayout`)

Use `Header` from Primer. The app logo goes in the first `Header.Item`.
Navigation links go as additional `Header.Item` entries.

```tsx
import { Header } from '@primer/react';
import { MarkGithubIcon, BeakerIcon } from '@primer/octicons-react';

<Header>
  <Header.Item>
    <Header.Link href="/" sx={{ fontWeight: 'bold', gap: 2 }}>
      <MarkGithubIcon size={32} />
      DevSanctum
    </Header.Link>
  </Header.Item>
  <Header.Item>
    <Header.Link href="/workspaces">Workspaces</Header.Link>
  </Header.Item>
  <Header.Item full /> {/* spacer */}
  <Header.Item>
    {/* Avatar/user menu */}
  </Header.Item>
</Header>
```

### In-page tab navigation (`UnderlineNav`)

Use for switching between sub-sections of a page (e.g. Overview / Settings / Logs).

```tsx
import { UnderlineNav } from '@primer/react';

<UnderlineNav aria-label="Workspace tabs">
  <UnderlineNav.Item href="#overview" aria-current="page">Overview</UnderlineNav.Item>
  <UnderlineNav.Item href="#settings">Settings</UnderlineNav.Item>
  <UnderlineNav.Item href="#logs" counter={3}>Logs</UnderlineNav.Item>
</UnderlineNav>
```

### Sidebar navigation (`NavList`)

Use for settings/admin pages with a persistent left-hand nav.

```tsx
import { NavList } from '@primer/react';
import { GearIcon, PersonIcon } from '@primer/octicons-react';

<NavList>
  <NavList.Item href="/settings/profile" aria-current="page">
    <NavList.LeadingVisual><PersonIcon /></NavList.LeadingVisual>
    Profile
  </NavList.Item>
  <NavList.Item href="/settings/security">
    <NavList.LeadingVisual><GearIcon /></NavList.LeadingVisual>
    Security
  </NavList.Item>
  <NavList.Divider />
  <NavList.Group title="Admin">
    <NavList.Item href="/admin/users">User Management</NavList.Item>
    <NavList.Item href="/admin/audit">Audit Logs</NavList.Item>
  </NavList.Group>
</NavList>
```

### Breadcrumbs

```tsx
import { Breadcrumbs } from '@primer/react';

<Breadcrumbs>
  <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
  <Breadcrumbs.Item href="/projects">Projects</Breadcrumbs.Item>
  <Breadcrumbs.Item selected>my-project</Breadcrumbs.Item>
</Breadcrumbs>
```

---

## 3. Forms

All form fields **must** be wrapped in `FormControl` to get label, caption, and validation handling.

### Text input

```tsx
import { FormControl, TextInput } from '@primer/react';

<FormControl>
  <FormControl.Label>Email address</FormControl.Label>
  <TextInput type="email" placeholder="you@example.com" block />
  <FormControl.Caption>We'll never share your email.</FormControl.Caption>
</FormControl>
```

### Input with validation error

```tsx
<FormControl>
  <FormControl.Label>Username</FormControl.Label>
  <TextInput value={value} onChange={...} validationStatus="error" block />
  <FormControl.Validation variant="error">Username is already taken.</FormControl.Validation>
</FormControl>
```

### Password input

```tsx
<FormControl>
  <FormControl.Label>Password</FormControl.Label>
  <TextInput type="password" block />
</FormControl>
```

### Textarea

```tsx
import { FormControl, Textarea } from '@primer/react';

<FormControl>
  <FormControl.Label>Description</FormControl.Label>
  <Textarea rows={4} block />
</FormControl>
```

### Select dropdown

```tsx
import { FormControl, Select } from '@primer/react';

<FormControl>
  <FormControl.Label>Docker Server</FormControl.Label>
  <Select block>
    <Select.Option value="">Select a server…</Select.Option>
    {servers.map((s) => (
      <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
    ))}
  </Select>
</FormControl>
```

### Checkbox

```tsx
import { FormControl, Checkbox } from '@primer/react';

<FormControl>
  <Checkbox id="pin" />
  <FormControl.Label htmlFor="pin">Pin this workspace</FormControl.Label>
  <FormControl.Caption>Pinned workspaces are never auto-destroyed.</FormControl.Caption>
</FormControl>
```

### Radio group

```tsx
import { FormControl, Radio } from '@primer/react';

<FormControl>
  <FormControl.Label>Visibility</FormControl.Label>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    <FormControl>
      <Radio name="visibility" value="private" defaultChecked />
      <FormControl.Label>Private</FormControl.Label>
    </FormControl>
    <FormControl>
      <Radio name="visibility" value="public" />
      <FormControl.Label>Public</FormControl.Label>
    </FormControl>
  </Box>
</FormControl>
```

### Form submit row

Destructive actions go right-aligned, cancel goes left.

```tsx
<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
  <Button onClick={onCancel}>Cancel</Button>
  <Button variant="primary" type="submit" loading={isSubmitting}>Save changes</Button>
</Box>
```

---

## 4. Buttons & Actions

### Variants

| Variant | Usage |
|---------|-------|
| `variant="primary"` | Main CTA per page (one per view) |
| `variant="default"` | Secondary actions |
| `variant="danger"` | Destructive actions (delete, revoke) |
| `variant="invisible"` | Tertiary/inline actions |

### With icon

```tsx
import { Button } from '@primer/react';
import { PlusIcon, TrashIcon } from '@primer/octicons-react';

<Button variant="primary" leadingVisual={PlusIcon}>New Workspace</Button>
<Button variant="danger" leadingVisual={TrashIcon}>Delete</Button>
```

### Icon-only button (always include `aria-label`)

```tsx
import { IconButton } from '@primer/react';
import { PencilIcon } from '@primer/octicons-react';

<IconButton icon={PencilIcon} aria-label="Edit" variant="invisible" />
```

### Loading state

```tsx
<Button variant="primary" loading={isSubmitting} disabled={isSubmitting}>
  Deploy
</Button>
```

### Action Menu (dropdown)

```tsx
import { ActionMenu, ActionList } from '@primer/react';
import { KebabHorizontalIcon } from '@primer/octicons-react';

<ActionMenu>
  <ActionMenu.Anchor>
    <IconButton icon={KebabHorizontalIcon} aria-label="More options" variant="invisible" />
  </ActionMenu.Anchor>
  <ActionMenu.Overlay>
    <ActionList>
      <ActionList.Item onSelect={() => onEdit()}>Edit</ActionList.Item>
      <ActionList.Item onSelect={() => onDuplicate()}>Duplicate</ActionList.Item>
      <ActionList.Divider />
      <ActionList.Item variant="danger" onSelect={() => onDelete()}>Delete</ActionList.Item>
    </ActionList>
  </ActionMenu.Overlay>
</ActionMenu>
```

---

## 5. Data Display

### Card / bordered box

```tsx
<Box
  sx={{
    p: 4,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'border.default',
    borderRadius: 2,
    bg: 'canvas.default',
  }}
>
  {/* content */}
</Box>
```

### Item list (`ActionList` in display mode)

```tsx
import { ActionList } from '@primer/react';

<ActionList showDividers>
  {items.map((item) => (
    <ActionList.Item key={item.id} href={`/workspaces/${item.id}`}>
      <ActionList.LeadingVisual><ServerIcon /></ActionList.LeadingVisual>
      {item.name}
      <ActionList.Description variant="block">{item.description}</ActionList.Description>
      <ActionList.TrailingVisual>
        <Label variant={item.status === 'running' ? 'success' : 'secondary'}>
          {item.status}
        </Label>
      </ActionList.TrailingVisual>
    </ActionList.Item>
  ))}
</ActionList>
```

### Data table (`DataTable`)

```tsx
import { DataTable, Table } from '@primer/react/experimental';

<Table.Container>
  <DataTable
    aria-labelledby="table-title"
    data={rows}
    columns={[
      { header: 'Name', field: 'name', rowHeader: true },
      { header: 'Status', field: 'status', renderCell: (row) => <Label>{row.status}</Label> },
      { header: 'Created', field: 'createdAt', renderCell: (row) => formatDate(row.createdAt) },
    ]}
  />
</Table.Container>
```

### Labels & badges

```tsx
import { Label, CounterLabel } from '@primer/react';

// Status labels
<Label variant="success">Running</Label>
<Label variant="attention">Pending</Label>
<Label variant="danger">Failed</Label>
<Label variant="secondary">Stopped</Label>

// Counter badge
<CounterLabel>12</CounterLabel>
```

---

## 6. Feedback & Status

### Flash / Banner

```tsx
import { Flash } from '@primer/react';

<Flash variant="success">Workspace deployed successfully.</Flash>
<Flash variant="danger">Deployment failed. Check logs below.</Flash>
<Flash variant="warning">This action cannot be undone.</Flash>
<Flash variant="default">Operation in progress…</Flash>
```

### Loading state

```tsx
import { Spinner } from '@primer/react';

// Inline
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <Spinner size="small" />
  <Text>Loading workspaces…</Text>
</Box>

// Full page centered
<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
  <Spinner />
</Box>
```

### Empty state

```tsx
import { Box, Heading, Text, Button } from '@primer/react';
import { RocketIcon } from '@primer/octicons-react';

<Box sx={{ textAlign: 'center', py: 8 }}>
  <Box sx={{ mb: 3, color: 'fg.subtle' }}><RocketIcon size={48} /></Box>
  <Heading as="h3" sx={{ fontSize: 3, mb: 2 }}>No workspaces yet</Heading>
  <Text as="p" sx={{ color: 'fg.muted', mb: 4 }}>
    Deploy your first workspace to get started.
  </Text>
  <Button variant="primary" leadingVisual={PlusIcon}>New Workspace</Button>
</Box>
```

### Skeleton loading placeholder

```tsx
import { SkeletonBox, SkeletonText } from '@primer/react/experimental';

<Box sx={{ p: 4 }}>
  <SkeletonText size="titleSmall" maxWidth={200} />
  <Box sx={{ mt: 2 }}>
    <SkeletonText lines={3} />
  </Box>
</Box>
```

---

## 7. Overlays & Dialogs

### Confirmation dialog

```tsx
import { Dialog, Button } from '@primer/react';

<Dialog
  title="Delete workspace?"
  onClose={() => setOpen(false)}
  isOpen={isOpen}
  footerButtons={[
    { content: 'Cancel', onClick: () => setOpen(false) },
    { content: 'Delete', variant: 'danger', onClick: onConfirm },
  ]}
>
  <Text>This will permanently destroy <strong>{workspace.name}</strong> and all its data.</Text>
</Dialog>
```

### Form dialog (create / edit)

```tsx
<Dialog
  title="Create Project"
  onClose={onClose}
  isOpen={isOpen}
  footerButtons={[
    { content: 'Cancel', onClick: onClose },
    { content: 'Create', variant: 'primary', onClick: handleSubmit, loading: isSubmitting },
  ]}
>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <FormControl>
      <FormControl.Label>Project name</FormControl.Label>
      <TextInput value={name} onChange={(e) => setName(e.target.value)} block autoFocus />
    </FormControl>
  </Box>
</Dialog>
```

---

## 8. Typography

```tsx
import { Heading, Text } from '@primer/react';

// Page title
<Heading as="h1">Workspaces</Heading>

// Section title
<Heading as="h2" sx={{ fontSize: 3, mb: 2 }}>Active Environments</Heading>

// Body text
<Text as="p">Description text here.</Text>

// Muted / caption
<Text sx={{ color: 'fg.muted', fontSize: 0 }}>Last updated 3 minutes ago</Text>

// Inline code
<Text sx={{ fontFamily: 'mono', fontSize: 0, bg: 'canvas.subtle', px: 1, borderRadius: 1 }}>
  npm install
</Text>
```

---

## 9. Icons

Always import from `@primer/octicons-react`. Use the `size` prop (16 default, 24 medium, 32 large).

```tsx
import { ServerIcon, PlusIcon, TrashIcon, GearIcon, CheckIcon } from '@primer/octicons-react';

// Standalone icon with muted color
<Box sx={{ color: 'fg.subtle' }}><ServerIcon size={24} /></Box>

// Icon inside a Button — use leadingVisual or trailingVisual props
<Button leadingVisual={PlusIcon}>Add</Button>
```

---

## 10. Responsive Layout Rules

- **Max content width:** `xlarge` for main pages, `medium` for forms/settings.
- **Spacing:** use multiples of 4px — `sx={{ p: 3 }}` = 12px, `sx={{ p: 4 }}` = 16px.
- **Stack vertically on mobile:** always use `flexDirection: ['column', 'row']` array syntax for responsive flex.
- **Sidebar collapses on mobile:** `PageLayout.Pane` hides automatically; add a fallback `UnderlineNav` if needed.

---

## 11. Patterns by Feature

| Feature | Layout | Key components |
|---------|--------|---------------|
| Login / Register | Centered card, no sidebar | `Box` (centered), `FormControl`, `TextInput`, `Button primary` |
| Dashboard | `PageLayout` full-width | `Box` grid, `ActionList`, `Label`, `Heading` |
| List page | `PageLayout` + optional pane | `DataTable` or `ActionList`, empty state, `Button primary` (top right) |
| Detail page | `PageLayout` + pane | `UnderlineNav`, `Box` cards, `ActionMenu` |
| Settings page | `PageLayout` + `NavList` pane | `NavList`, `FormControl`, submit row |
| Admin page | `PageLayout` + `NavList` pane | Same as settings + `DataTable`, `Label` variants |
| Confirmation flow | `Dialog` over current page | `Dialog` with danger footer button |
