# 🤖 PairMind Agent - Quick Reference Card

## 🚀 Getting Started

1. Click the **Bot icon** (🤖) in bottom-right corner
2. Type your command in natural language
3. Press Enter or click Send
4. Watch the agent execute your request

---

## 📝 Common Commands

### Appointments

| Command | What It Does | Permission Required |
|---------|--------------|---------------------|
| `Create appointment tomorrow at 5 PM with John` | Creates new appointment | Super Admin, Tenant Admin |
| `List all appointments` | Shows appointment summary | All roles |
| `Delete appointment with John` | Deletes appointment (with confirmation) | Super Admin, Tenant Admin |

### Navigation

| Command | What It Does | Permission Required |
|---------|--------------|---------------------|
| `Go to Dashboard` | Navigate to Dashboard | All roles |
| `Show Appointments` | Navigate to Appointments | All roles |
| `Navigate to Instances` | Navigate to Instances | Super Admin, Tenant Admin, Read-Only |
| `Open Users` | Navigate to Users | Super Admin, Tenant Admin |
| `Go to Settings` | Navigate to Settings | All roles |

### Instances

| Command | What It Does | Permission Required |
|---------|--------------|---------------------|
| `List all instances` | Shows instance summary | Super Admin, Tenant Admin, Read-Only |

---

## 🎯 Command Patterns

### Creating Appointments

**Pattern**: `Create appointment [when] at [time] with [name]`

**Examples**:
```
Create appointment tomorrow at 5 PM with John Doe
Schedule meeting today at 10:00 with Sarah Johnson
New appointment next week at 2 PM with Client ABC
Book appointment for tomorrow at 9:30 AM with Dr. Smith
```

**Time Formats**:
- `5 PM` → 17:00
- `17:00` → 5:00 PM
- `5:30 PM` → 17:30
- `10:00` → 10:00 AM

**Date Formats**:
- `tomorrow` → Next day
- `today` → Current day
- `next week` → 7 days from now

---

## 🔐 Role Permissions

### Super Admin (Full Access)
✅ Create/delete appointments  
✅ View all pages  
✅ Manage users  
✅ Access tenants  
✅ View instances  

### Tenant Admin (Tenant Management)
✅ Create/delete appointments  
✅ View instances  
✅ Manage users  
❌ Access tenants  

### User (Limited Access)
✅ View appointments  
✅ Navigate allowed pages  
❌ Create/delete appointments  
❌ View instances  
❌ Manage users  

### Read-Only
✅ View appointments  
✅ View instances  
❌ Create/delete anything  
❌ Manage users  

---

## 💬 Message Types

| Icon | Type | Meaning |
|------|------|---------|
| ℹ️ | Info | Progress update, general information |
| ✅ | Success | Action completed successfully |
| ⚠️ | Warning | Conflict detected, confirmation needed |
| ❌ | Error | Permission denied, action failed |

---

## 🎨 UI Elements

### Agent Panel
- **Header**: Shows "PairMind Agent" with Bot icon
- **User Info**: Displays your name and role
- **Messages**: Chat conversation history
- **Input**: Type commands here
- **Send Button**: Submit your command

### Layout
- **Main App**: 75% width (left side)
- **Agent Panel**: 25% width (right side)
- **Floating Icon**: Click to open/close agent

---

## ⚡ Quick Tips

1. **Be Specific**: Include date, time, and name for appointments
2. **Check Permissions**: Agent will tell you if action is not allowed
3. **Confirm Deletions**: Type "yes" to confirm, "no" to cancel
4. **Natural Language**: Use conversational commands
5. **Watch Progress**: Agent shows each step it's performing

---

## 🐛 Troubleshooting

### "Permission Denied"
→ Your role doesn't allow this action. Check role permissions above.

### "Could not find button"
→ Ensure you're on the correct page. Try navigating first.

### "Conflict Detected"
→ Appointment already exists at that time. Choose different time.

### "Please specify..."
→ Command is missing information. Add more details.

---

## 📚 Need More Help?

- **Full Documentation**: See `/docs/AGENT_FEATURE.md`
- **Demo Guide**: See `/docs/AGENT_DEMO_GUIDE.md`
- **Examples**: See `/docs/AGENT_README.md`

---

## 🎯 Example Session

```
You: Create appointment tomorrow at 5 PM with John Doe

Agent: 🔍 Analyzing: "Create appointment tomorrow at 5 PM with John Doe"
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

You: List all appointments

Agent: 🔐 Checking permissions...
Agent: 🧭 Navigating to Appointments page...
Agent: 📅 Appointments Summary:
       
       • Total: 13
       • Upcoming: 9
       • Confirmed: 7
       • Pending: 2
       
       You are now viewing the Appointments page.
```

---

**Print this card for quick reference!** 🖨️
