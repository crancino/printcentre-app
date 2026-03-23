# Troubleshooting Guide - PrintCentre App

## Installation Steps

### 1. Deploy (Already Done ✅)
\\\powershell
forge deploy
\\\
Status: COMPLETED - Version 2.1.0 deployed successfully

### 2. Install to Jira Site (Do This Now)

**Run in your PowerShell terminal (not in Rovo):**
\\\powershell
cd C:\wamp64\www\forge\princentre-app
forge install
\\\

**Follow the prompts:**
- Select product: **Jira**
- Select site: **iitodp.atlassian.net**

### 3. Find the Button in Jira

After installation:

1. Go to any issue in your Jira/JSM project:
   - Example: https://iitodp.atlassian.net/browse/MP-1
   
2. Look for "Print Request" button:
   - **Location 1:** Top-right toolbar (with Clone, Link, etc.)
   - **Location 2:** In the "..." (more actions) dropdown menu
   
3. The button should appear on ALL issues (no project restrictions currently)

### 4. If You Don't See the Button

**A. Verify Installation:**
\\\powershell
# In PowerShell terminal
forge install --upgrade
\\\

**B. Check in Jira Admin:**
1. Go to: https://iitodp.atlassian.net/plugins/servlet/upm
2. Search for "printcentre-app"
3. Verify it's enabled

**C. Browser Issues:**
- Hard refresh: Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)
- Clear browser cache
- Try incognito/private mode
- Try a different browser

**D. Check Logs:**
\\\powershell
forge logs
\\\
Look for any errors or warnings

### 5. Test the Button

Once you see the button:
1. Click "Print Request"
2. Check logs to see the event:
   \\\powershell
   forge logs
   \\\
3. You should see: "PrintCentre button clicked" in the logs

### 6. Common Issues

**Issue:** Button not visible
**Solutions:**
- Verify you're on an issue detail page (not issue list)
- Check if app is enabled in UPM (step 4B)
- Reinstall: \orge install --upgrade\

**Issue:** Button appears but nothing happens
**Solutions:**
- Check \orge logs\ for errors
- Verify the function handler is deployed

### 7. Next Steps

Once the button is working, we can add:
- Modal window UI
- Display conditions (show only in specific projects)
- Print functionality

## Quick Commands Reference

\\\powershell
# Deploy changes
forge deploy

# Install/update app
forge install --upgrade

# View real-time logs
forge logs

# Uninstall (if needed)
forge uninstall
\\\

