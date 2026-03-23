# Installation and Testing Steps

## Current Status
✅ **App Deployed**: Version 3.1.0 to development environment
✅ **Code Fixed**: Portal panel now has complete upload UI
⚠️ **Needs Installation**: App must be installed/reinstalled to Jira

## Installation Steps

### Option 1: Install Fresh (if not installed before)
```bash
cd C:\wamp64\www\forge\princentre-app
forge install
```
When prompted:
- Select your Jira site
- Confirm installation

### Option 2: Reinstall (if already installed)
```bash
cd C:\wamp64\www\forge\princentre-app
forge uninstall
forge install
```

### Option 3: Check Existing Installation
```bash
forge install --list
```

## After Installation

### 1. Clear Browser Cache
**IMPORTANT**: The modal might still appear empty due to browser cache!

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

**OR** Hard refresh the Jira page:
- `Ctrl + F5` (Windows)
- `Ctrl + Shift + R` (Windows/Linux)

### 2. Test the Upload Modal

1. Go to your Jira Service Management portal
2. Open any request
3. Click "Upload to PrintCentre" button
4. **Expected result**: Modal should show:
   - Title: "PDF Print files"
   - Request info (e.g., "Request: SD-123")
   - Blue button: "📎 PDF Upload"
   - Cancel and Submit buttons

### 3. If Modal is Still Empty

**Check Browser Console** (F12):
1. Open the modal
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Look for errors (red text)
5. Take a screenshot and share the errors

**Common Issues:**

**Error: "Cannot find module '@forge/bridge'"**
- This means ES6 modules are working correctly
- The issue might be with the CDN React loading

**Error: "React is not defined"**
- React CDN failed to load
- Check network tab for failed requests

**No errors but modal is empty:**
- Check "Network" tab in DevTools
- Look for `index.js` and `index.html` 
- Verify they loaded successfully (status 200)

### 4. Debug Mode

To see detailed logs:
```bash
forge logs --follow
```

Open the modal and watch for any backend errors.

## What Changed in Version 3.1.0

1. **index.js**: Complete rewrite with inline Azure upload logic
2. **index.html**: Kept as ES6 module (same as portal-action)
3. All upload functionality now inline in one file

## If You See the Upload Interface

Once the modal shows correctly:

1. Click "📎 PDF Upload"
2. Select a PDF file
3. Click "Submit"
4. Check browser console for any upload errors
5. Verify the SAS_URL is set:
   ```bash
   forge variables list
   ```

## Set SAS_URL (If Not Done Yet)

```bash
forge variables set SAS_URL
```

Paste your Azure SAS URL when prompted.

## Still Having Issues?

Please provide:
1. Screenshot of the empty modal
2. Screenshot of browser console (F12)
3. Output of `forge install --list`
4. Output of `forge logs` when opening the modal

---
**Last Updated**: March 18, 2026
**App Version**: 3.1.0
