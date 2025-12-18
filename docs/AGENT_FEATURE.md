# Autonomous In-App Browser/UI Action Agent

## Overview

The **PairMind AI Agent** is a fully autonomous in-app assistant that can execute real UI actions based on natural language commands. It operates within the existing SaaS application (PairMind.AI) and respects all role-based access control (RBAC) permissions.

## Features

### 🎯 Core Capabilities

1. **Natural Language Processing**
   - Understands conversational commands
   - Extracts dates, times, names, and other parameters
   - Provides intelligent suggestions when commands are ambiguous

2. **UI Automation**
   - Clicks buttons and navigates menus
   - Fills forms with extracted data
   - Submits data through existing UI workflows
   - Validates UI state before and after actions

3. **Role-Based Access Control**
   - Checks permissions before every action
   - Provides clear permission-denied messages
   - Only shows available actions based on user role

4. **Conflict Detection**
   - Checks for scheduling conflicts (appointments)
   - Validates data before submission
   - Prevents duplicate or conflicting entries

5. **Step-by-Step Feedback**
   - Shows progress for each action
   - Provides success/error/warning messages
   - Displays detailed summaries of completed actions

## UI Integration

### Layout Behavior

The agent integrates seamlessly with the existing application:

1. **Floating Chat Icon**: A Bot icon appears in the bottom-right corner
2. **Split View**: When opened, the layout splits:
   - **75%** → Main Application (fully functional)
   - **25%** → Agent Panel (right side)
3. **Responsive**: The main app resizes dynamically without reload
4. **Closeable**: Users can close the agent panel anytime

### Visual Design

- **Modern UI**: Gradient headers, smooth animations
- **Status Indicators**: Icons for success, error, warning, info
- **User Context**: Shows current user and role
- **Message Bubbles**: Distinct styling for user vs agent messages

## Supported Commands

### 📅 Appointments

#### Create Appointment
```
"Create an appointment tomorrow at 5 PM with John Doe"
"Schedule a meeting for today at 10:00 with Sarah"
"New appointment next week at 2 PM with Client X"
```

**Workflow:**
1. ✅ Check permissions (Super Admin / Tenant Admin only)
2. 🔍 Extract date, time, and customer name
3. ⚠️ Check for scheduling conflicts
4. 🧭 Navigate to Appointments page
5. 🖱️ Click "New Appointment" button
6. 📝 Fill form fields
7. 📤 Submit form
8. 🎉 Confirm success

#### List Appointments
```
"Show all appointments"
"List appointments"
"View my appointments"
```

**Output:**
- Total appointments
- Upcoming appointments
- Status breakdown (Confirmed, Pending, Cancelled)

#### Delete Appointment
```
"Delete appointment with John"
"Cancel meeting with Sarah"
"Remove appointment for John Doe"
```

**Workflow:**
1. ✅ Check permissions
2. 🔍 Find matching appointment
3. ⚠️ Request confirmation
4. ✅ Delete after user confirms with "yes"

### 🧭 Navigation

```
"Go to Dashboard"
"Navigate to Instances"
"Show Appointments page"
"Open Users"
"Go to Analytics"
"Navigate to Settings"
"Show MCP Providers"
```

**Features:**
- Permission checks before navigation
- Clear error messages for restricted pages
- Confirmation of successful navigation

### 🖥️ Instances

```
"List all instances"
"Show instances"
"View instances"
```

**Output:**
- Total instances
- Online/Offline count
- Navigates to Instances page

### 👥 Users

```
"Show users"
"List users"
"Navigate to Users"
```

**Requirements:**
- Super Admin or Tenant Admin role

## Permission Matrix

| Action | Super Admin | Tenant Admin | User | Read-Only |
|--------|-------------|--------------|------|-----------|
| Create Appointment | ✅ | ✅ | ❌ | ❌ |
| View Appointments | ✅ | ✅ | ✅ | ✅ |
| Delete Appointment | ✅ | ✅ | ❌ | ❌ |
| View Instances | ✅ | ✅ | ❌ | ✅ |
| Navigate Dashboard | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Access Tenants | ✅ | ❌ | ❌ | ❌ |

## Technical Implementation

### Architecture

```
Agent Component (Agent.tsx)
├── Natural Language Parser
│   ├── Intent Detection (create, edit, delete, navigate, etc.)
│   ├── Entity Recognition (appointment, instance, user, etc.)
│   └── Parameter Extraction (dates, times, names)
├── Command Handlers
│   ├── handleAppointmentCommand()
│   ├── handleNavigationCommand()
│   ├── handleInstanceCommand()
│   └── handleUserCommand()
├── UI Automation
│   ├── findElementByText() - Locate UI elements
│   ├── setReactInputValue() - Fill form fields
│   └── wait() - Timing control
└── Permission Checker
    └── AccessControlService integration
```

### Key Functions

#### `parseCommand(command: string): CommandIntent`
Parses natural language into structured intent:
```typescript
{
  action: 'create' | 'edit' | 'delete' | 'navigate' | 'view' | 'list',
  entity: 'appointment' | 'instance' | 'user' | 'tenant' | 'page',
  params: { date?: string, time?: string, name?: string }
}
```

#### `findElementByText(text: string, selector?: string): HTMLElement | null`
Locates UI elements by text content, preferring buttons and interactive elements.

#### `setReactInputValue(element: HTMLInputElement, value: string)`
Sets values on React-controlled inputs by triggering proper events.

### State Management

The agent integrates with the global store (`useGlobal()`):
- `user` - Current user and role
- `appointments` - Appointment data
- `instances` - Instance data
- `navigate()` - Page navigation
- `setAppointments()` - Update appointments
- `addNotification()` - Show notifications

## Safety & Constraints

### Non-Negotiables

1. ✅ **No Backend Modifications**: Agent only uses existing UI
2. ✅ **Permission Enforcement**: All actions respect RBAC
3. ✅ **Confirmation for Destructive Actions**: Delete requires "yes" confirmation
4. ✅ **UI State as Source of Truth**: Relies on visible UI elements
5. ✅ **Existing Design Language**: Matches application theme
6. ✅ **Reversible Actions**: All actions can be undone through existing UI

### Error Handling

- **Permission Denied**: Clear message with role information
- **Element Not Found**: Helpful error with context
- **Conflict Detection**: Warns before creating duplicates
- **Form Validation**: Checks required fields before submission

## User Experience

### Message Types

1. **Info** (ℹ️): General information, progress updates
2. **Success** (✅): Action completed successfully
3. **Warning** (⚠️): Conflicts, confirmations needed
4. **Error** (❌): Permission denied, action failed

### Conversation Flow Example

```
User: "Create an appointment tomorrow at 5 PM with John Doe"

Agent: 🔍 Analyzing: "Create an appointment tomorrow at 5 PM with John Doe"
Agent: 🔐 Checking permissions...
Agent: ✅ Permission verified
Agent: 📋 Appointment Details:
       • Customer: John Doe
       • Date: 2025-12-19
       • Time: 17:00
Agent: 🔍 Checking for scheduling conflicts...
Agent: ✅ No conflicts found
Agent: 🧭 Navigating to Appointments page...
Agent: 🖱️ Looking for "New Appointment" button...
Agent: ✅ Found button, clicking...
Agent: 📝 Filling appointment form...
Agent: ✅ Filled 3 form fields
Agent: 📤 Submitting form...
Agent: 🎉 Success!

       Appointment created:
       • Customer: John Doe
       • Date: 2025-12-19
       • Time: 17:00
```

## Future Enhancements

### Planned Features

1. **Edit Appointments**: Modify existing appointments
2. **Instance Management**: Create, edit, delete instances
3. **User Management**: Add, edit, remove users
4. **Bulk Operations**: "Delete all pending appointments"
5. **Smart Scheduling**: "Find next available slot"
6. **Calendar Integration**: "Sync with Google Calendar"
7. **Advanced Queries**: "Show appointments for next week"
8. **Multi-step Workflows**: Complex operations with multiple steps

### Extensibility

The agent is designed to be easily extended:

```typescript
// Add new command handler
const handleNewEntityCommand = async (intent: CommandIntent) => {
    // 1. Check permissions
    // 2. Validate parameters
    // 3. Navigate to page
    // 4. Interact with UI
    // 5. Confirm success
};

// Register in processCommand()
if (intent.entity === 'new_entity') {
    await handleNewEntityCommand(intent);
}
```

## Testing

### Manual Testing Checklist

- [ ] Create appointment as Super Admin
- [ ] Create appointment as Tenant Admin
- [ ] Try create appointment as User (should fail)
- [ ] Create appointment with conflict (should warn)
- [ ] Delete appointment with confirmation
- [ ] Navigate to restricted page (should fail)
- [ ] List appointments
- [ ] View instances
- [ ] Test all date formats (tomorrow, today, next week)
- [ ] Test all time formats (5 PM, 17:00, 5:30 PM)

### Test Commands

```bash
# Appointments
"Create appointment tomorrow at 5 PM with John"
"List all appointments"
"Delete appointment with John"

# Navigation
"Go to Dashboard"
"Navigate to Instances"
"Show Users"

# Instances
"List all instances"

# Edge Cases
"Create appointment" (missing details)
"Delete appointment" (missing name)
"Go to Tenants" (as non-admin)
```

## Troubleshooting

### Common Issues

**Issue**: "Could not find button"
- **Cause**: UI structure changed or page not loaded
- **Solution**: Ensure page is fully rendered, check button text

**Issue**: "Permission Denied"
- **Cause**: User role lacks required permission
- **Solution**: Log in with appropriate role

**Issue**: "Could not identify form fields"
- **Cause**: Form structure changed
- **Solution**: Update field detection logic in `handleCreateAppointment()`

## Code Location

- **Agent Component**: `/components/Agent.tsx`
- **Layout Integration**: `/components/Layout.tsx` (lines 363-385)
- **Types**: `/types.ts`
- **Services**: `/services.ts` (AccessControlService)
- **Store**: `/store.tsx`

## Success Criteria

✅ **Implemented Features:**
- [x] Natural language command parsing
- [x] Role-based permission checks
- [x] UI element interaction (click, fill, submit)
- [x] Conflict detection for appointments
- [x] Step-by-step execution feedback
- [x] Split layout (25% agent, 75% app)
- [x] Floating chat icon
- [x] Confirmation for destructive actions
- [x] Navigation with permission checks
- [x] Real-time UI updates
- [x] Notification integration
- [x] Error handling and recovery

The agent successfully operates the application via chat commands, updates the UI in real-time, and behaves identically to manual usage while being fully automated.
