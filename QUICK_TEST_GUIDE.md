# Quick Test Guide - PrintCentre App

## Prerequisites
✅ App deployed to development environment (v3.0.0)
⚠️ **IMPORTANT**: Set the SAS_URL environment variable before testing

## Set Environment Variable
```bash
cd C:\wamp64\www\forge\princentre-app
forge variables set --environment development SAS_URL
# Paste your Azure SAS URL when prompted
```

Your SAS URL should look like:
```
https://jiratoswitchprem.blob.core.windows.net/jira-to-switch?sv=2022-11-02&ss=b&srt=sco&sp=rwdlac&st=...&sig=...
```

## Test 1: Customer Portal Upload (Main Feature)

### Steps:
1. **Go to your Jira Service Management portal** (customer view)
2. **Open any request** or create a new one
3. **Look for "Upload to PrintCentre" button** - should appear in the request actions
4. **Click the button** - a modal should open
5. **You should see:**
   - Title: "PDF Print files"
   - Request information (e.g., "Request: SD-123")
   - Blue button: "📎 PDF Upload"
   - Cancel and Submit buttons at the bottom

6. **Click "📎 PDF Upload"**
   - File picker should open
   - Select one or more PDF files

7. **Verify files appear in the list:**
   - Should show: 📄 filename.pdf (XX.XX KB)
   - Each file should have a "🗑️ Remove" button

8. **Click "Submit"**
   - Should show "Uploading files..." message
   - After upload completes: "Files uploaded successfully!"
   - Modal should auto-close after 2 seconds

9. **Verify in Jira:**
   - Open the issue
   - Check for a new comment listing the uploaded files

10. **Verify in Azure:**
    - Go to your Azure Storage account
    - Navigate to the "jira-to-switch" container
    - Look for files named: `[SD-123] - yourfile.pdf`

## Test 2: Agent Panel View

### Steps:
1. **Open Jira (agent/admin view)**
2. **Open an issue** where files were uploaded
3. **Look for "Print Request" panel** on the right side
4. **You should see:**
   - If no files uploaded: "No files uploaded yet. Customers can upload files via the service portal."
   - If files uploaded: List of files with names and timestamps

## Common Issues & Solutions

### Issue: Modal is empty or shows error
**Solution:** Check browser console for errors. Most likely the SAS_URL is not set.

### Issue: "SAS URL not configured" error
**Solution:** 
```bash
forge variables set --environment development SAS_URL
```

### Issue: Upload fails with 403 or 404
**Solution:** 
- Verify your SAS URL is valid and not expired
- Check Azure permissions (should allow read, write, delete, list, add, create)
- Container name should be "jira-to-switch"

### Issue: Can't find "Upload to PrintCentre" button
**Solution:**
- Make sure you're in a Jira Service Management project (not regular Jira)
- View must be in the customer portal, not agent view
- The app must be installed on the site

### Issue: Agent panel shows "No files uploaded yet" even after upload
**Solution:**
- Current implementation uploads to Azure, not Forge storage
- The panel shows files from Forge storage (needs update)
- Check Azure storage instead for now

## Verify Deployment
```bash
cd C:\wamp64\www\forge\princentre-app
forge install --site <your-site>.atlassian.net
```

## View Logs (if issues occur)
```bash
forge logs --follow
```

## Expected File Structure in Azure
```
jira-to-switch/
├── [SD-123] - document1.pdf
├── [SD-456] - document2.pdf
└── [SD-789] - presentation.pdf
```

## Success Criteria
✅ Modal opens with upload interface  
✅ Files can be selected and listed  
✅ Upload to Azure succeeds  
✅ Comment is posted to Jira issue  
✅ Files appear in Azure Storage  
✅ No console errors  

## If Everything Works
You're ready to deploy to production:
```bash
forge deploy --environment production
forge install --site <your-production-site>.atlassian.net --environment production
```
