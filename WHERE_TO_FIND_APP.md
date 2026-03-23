# Finding Your Forge App in JSM After Installation

## Where to Find the App:

### 1. In a JSM Request (Issue View):

Since we're using the 'jira:issueAction' module, the app will appear as a button in the issue view.

**Steps to find it:**

1. Go to your JSM project (MP project based on your manifest)
2. Open any request/issue
3. Look in the top-right area of the issue for action buttons
4. You should see a button labeled "Print Request"

The button location will be:
- Near other issue actions (like "Clone", "Link", etc.)
- In the "..." (more actions) menu if there are many actions

### 2. If You Don't See It:

**Check these:**

a) **Project Scope:**
   - The app might only show in specific projects
   - Currently no project restrictions in manifest
   - Should show in ALL Jira/JSM projects

b) **Issue Type:**
   - Should work on all issue types
   - Test on a JSM request

c) **Permissions:**
   - Make sure you have permission to view the issue
   - The app uses read:jira-work scope

d) **Browser Refresh:**
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Clear browser cache
   - Try incognito mode

### 3. Verify Installation:

Check if the app is installed:
\\\powershell
forge install --list
\\\

Or go to:
**Jira Settings → Apps → Manage Apps**
- Look for "printcentre-app"
- Check if it's enabled

### 4. Check Logs:

To see if the app is working:
\\\powershell
forge logs
\\\

Then click the button in Jira - you should see logs appear.

### 5. Typical Location in JSM:

For JSM Request View:
- Open a request in your service project
- Look in the top toolbar area
- The "Print Request" button should be visible

## Example Path:

https://iitodp.atlassian.net/browse/MP-123  (replace with actual issue key)
→ Look for "Print Request" button in the issue toolbar

