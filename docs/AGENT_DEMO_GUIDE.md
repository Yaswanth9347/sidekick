# PairMind AI Agent - Demo Guide

## Quick Start

### 1. Launch the Application

The application should already be running at `http://localhost:5173`

### 2. Login

Use one of these test accounts to see different permission levels:

**Super Admin** (Full Access)
- Email: `super@admin.com`
- Can: Create/delete appointments, view all pages, manage everything

**Tenant Admin** (Tenant Management)
- Email: `admin@company.com`
- Can: Create/delete appointments, manage users, view instances

**Regular User** (Limited Access)
- Email: `user@company.com`
- Can: View appointments only (cannot create/delete)

### 3. Open the Agent

1. Look for the **floating Bot icon** in the bottom-right corner
2. Click it to open the Agent panel
3. The app will split: 75% main app, 25% agent panel

## Demo Script

### Demo 1: Create Appointment (Success Flow)

**Login as**: Super Admin or Tenant Admin

**Commands to try:**
```
Create an appointment tomorrow at 5 PM with John Doe
```

**What happens:**
1. ✅ Permission check passes
2. 📋 Shows appointment details
3. 🔍 Checks for conflicts
4. 🧭 Navigates to Appointments page
5. 🖱️ Clicks "New Appointment"
6. 📝 Fills the form
7. 📤 Submits
8. 🎉 Success message + notification

**Alternative commands:**
```
Schedule a meeting today at 10:00 with Sarah Johnson
New appointment next week at 2 PM with Client ABC
Create appointment for tomorrow at 9:30 AM with Dr. Smith
```

### Demo 2: Permission Denied (Error Flow)

**Login as**: Regular User

**Command:**
```
Create an appointment tomorrow at 3 PM with Jane
```

**What happens:**
1. 🔐 Permission check
2. ⛔ **Permission Denied** message
3. Shows user's role and required permissions
4. No action taken

### Demo 3: Conflict Detection

**Login as**: Super Admin

**Step 1:** Create first appointment
```
Create appointment tomorrow at 5 PM with Alice
```

**Step 2:** Try to create conflicting appointment
```
Create appointment tomorrow at 5 PM with Bob
```

**What happens:**
1. ✅ Permission check passes
2. 🔍 Conflict detected!
3. ⚠️ Warning message showing existing appointment
4. Suggests alternatives
5. No duplicate created

### Demo 4: List Appointments

**Command:**
```
Show all appointments
```

**Output:**
```
📅 Appointments Summary:

• Total: 12
• Upcoming: 8
• Confirmed: 6
• Pending: 2

You are now viewing the Appointments page.
```

### Demo 5: Delete Appointment (with Confirmation)

**Command:**
```
Delete appointment with John
```

**What happens:**
1. 🔐 Permission check
2. 🔍 Finds matching appointment
3. ⚠️ Shows confirmation dialog with details
4. Waits for "yes" or "no"

**Type:** `yes`

**Result:**
```
✅ Appointment with John Doe has been deleted.
```

### Demo 6: Navigation

**Commands to try:**
```
Go to Dashboard
Navigate to Instances
Show Analytics
Open Settings
Go to Users
```

**Features:**
- Permission checks before navigation
- Clear error for restricted pages
- Confirmation of successful navigation

### Demo 7: View Instances

**Login as**: Super Admin or Tenant Admin

**Command:**
```
List all instances
```

**Output:**
```
🖥️ Instances Overview:

• Total: 8
• Online: 6
• Offline: 2

You are now viewing the Instances page.
```

## Advanced Demo Scenarios

### Scenario 1: Multi-Step Workflow

```
1. "Go to Appointments"
2. "List all appointments"
3. "Create appointment tomorrow at 2 PM with New Client"
4. "List all appointments" (see the new one)
```

### Scenario 2: Error Recovery

```
1. "Create appointment" (missing details)
   → Agent asks for clarification
2. "Create appointment tomorrow at 5 PM with John"
   → Success
```

### Scenario 3: Permission Boundaries

**As Regular User:**
```
1. "Go to Dashboard" → ✅ Success
2. "Go to Instances" → ⛔ Permission Denied
3. "Show appointments" → ✅ Success
4. "Create appointment" → ⛔ Permission Denied
```

## Natural Language Variations

The agent understands many ways to express the same intent:

### Create Appointment
- "Create an appointment..."
- "Schedule a meeting..."
- "Add new appointment..."
- "Book an appointment..."
- "New meeting with..."

### Time Expressions
- "tomorrow" → Next day
- "today" → Current day
- "next week" → 7 days from now
- "5 PM" → 17:00
- "17:00" → 5:00 PM
- "5:30 PM" → 17:30

### Navigation
- "Go to Dashboard"
- "Navigate to Instances"
- "Show me Appointments"
- "Open Settings page"

## Testing Checklist

### ✅ Basic Functionality
- [ ] Agent panel opens/closes
- [ ] Layout splits correctly (75/25)
- [ ] Messages display properly
- [ ] User info shows current role

### ✅ Appointments
- [ ] Create appointment (Super Admin)
- [ ] Create appointment (Tenant Admin)
- [ ] Create fails (Regular User)
- [ ] Conflict detection works
- [ ] List appointments
- [ ] Delete with confirmation

### ✅ Navigation
- [ ] Navigate to allowed pages
- [ ] Block restricted pages
- [ ] Show permission errors

### ✅ Permissions
- [ ] Super Admin: Full access
- [ ] Tenant Admin: Tenant access
- [ ] User: Read-only
- [ ] Clear error messages

### ✅ UI/UX
- [ ] Smooth animations
- [ ] Clear message types (info/success/error/warning)
- [ ] Proper icons
- [ ] Responsive layout
- [ ] Auto-scroll to latest message

## Troubleshooting

### Agent not opening?
- Check if Bot icon is visible in bottom-right
- Refresh the page
- Check browser console for errors

### Commands not working?
- Ensure you're logged in
- Check your role permissions
- Try more specific commands
- Look for error messages in chat

### Form not filling?
- Ensure you're on the correct page
- Check if modal is open
- Try the command again
- Check browser console

## Demo Tips

1. **Start Simple**: Begin with basic navigation commands
2. **Show Permissions**: Demonstrate different roles
3. **Highlight Conflicts**: Show intelligent conflict detection
4. **Emphasize Safety**: Show confirmation for delete
5. **Natural Language**: Use varied command phrasings
6. **Error Handling**: Show what happens when things go wrong

## Example Demo Flow (5 minutes)

**Minute 1**: Introduction
- Show the floating Bot icon
- Open the agent panel
- Explain the split layout

**Minute 2**: Basic Commands
- "Go to Dashboard"
- "Show appointments"
- Demonstrate navigation

**Minute 3**: Create Appointment
- "Create appointment tomorrow at 5 PM with Demo User"
- Show step-by-step execution
- Point out permission checks

**Minute 4**: Permissions
- Switch to Regular User
- Try to create appointment
- Show permission denied message

**Minute 5**: Advanced Features
- Show conflict detection
- Demonstrate delete with confirmation
- List appointments

## Success Indicators

✅ **User can:**
- Open/close agent panel
- Issue natural language commands
- See step-by-step execution
- Understand permission restrictions
- Complete tasks without manual UI interaction

✅ **System:**
- Respects all RBAC rules
- Detects conflicts
- Provides clear feedback
- Updates UI in real-time
- Handles errors gracefully

---

**Ready to demo!** The agent is fully functional and ready to showcase autonomous UI automation with proper permission controls.
