# Post-Deployment Instructions - Version 2.2.0

## ✅ Successfully Deployed!

### What Changed:

**v2.2.0 includes:**
- ✅ jira:issueAction module (button in agent view)
- ✅ jira:issuePanel module (panel in both agent and customer portal views)
- ✅ Extensive debugging with console logs

### Upgrade Installation

**Run in PowerShell terminal:**
\\\powershell
cd C:\wamp64\www\forge\princentre-app
forge install --upgrade
\\\

Select:
- Site: iitodp-ai-sandbox.atlassian.net

### Where to Find the App

#### 1. AGENT VIEW
URL: \https://iitodp-ai-sandbox.atlassian.net/browse/PS-10782\

You should see:
- **Button:** "Print Request" in the top toolbar (with Clone, Link, etc.)
- **Panel:** "Print Request" panel on the right sidebar

#### 2. CUSTOMER PORTAL VIEW
URL: \https://iitodp-ai-sandbox.atlassian.net/servicedesk/customer/portal/43/PS-10782\

You should see:
- **Panel:** "Print Request" panel visible in the issue view

### Testing & Debugging

1. **Click the button/panel**
   - In agent view: Click "Print Request" button
   - In either view: Interact with the panel

2. **Check Forge logs:**
   \\\powershell
   forge logs
   \\\
   
   Look for:
   \\\
   === PrintCentre App Loaded ===
   Event: {...}
   Handler executed successfully
   \\\

3. **If still not visible:**
   - Hard refresh browser (Ctrl+F5)
   - Clear browser cache
   - Check app is enabled: https://admin.atlassian.com/s/780e35ee-58dd-45cf-af68-d842d66415a4/user-connected-apps/tab/installed
   - Try incognito/private mode

### Troubleshooting

**Still can't see it?**

Run this to check module info:
\\\powershell
forge lint
\\\

Reinstall completely:
\\\powershell
forge uninstall
forge install
\\\

### Next Steps

Once you can see and click the button/panel:
1. Confirm logs show the click event
2. We'll add the modal window UI
3. We'll add the print functionality

