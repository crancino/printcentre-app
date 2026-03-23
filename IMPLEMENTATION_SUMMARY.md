# PDF Upload Implementation Summary

## Overview
Successfully implemented PDF document upload functionality from `printcentre-upload` into `princentre-app`. The implementation allows users to upload PDF files to Azure Blob Storage directly from Jira Service Management portal.

## Changes Made

### 1. Resolver Functions (`src/resolver.js`)
Added two new resolver functions:

- **`PostComment`**: Creates a comment in the Jira issue with the list of uploaded documents and the user's name
- **`getSasUrl`**: Retrieves the Azure SAS URL from environment variables

### 2. Package Dependencies (`package.json`)
Updated dependencies to include:
- `@forge/bridge`: ^3.2.0 - For Forge Bridge API
- `@atlaskit/button`: ^17.2.0 - UI components
- `@atlaskit/form`: ^9.0.6 - Form components
- `@atlaskit/spinner`: ^17.0.0 - Loading indicators
- `@atlaskit/flag`: ^15.0.0 - Success/error messages
- `@atlaskit/banner`: ^12.0.0 - Warning banners
- `@atlaskit/modal-dialog`: ^12.0.0 - Modal dialogs
- `@atlaskit/icon`: ^22.0.0 - Icons
- `@azure/storage-blob`: ^12.26.0 - Azure Blob Storage SDK
- `react`: ^18 - React library
- `react-dom`: ^18 - React DOM
- `styled-components`: ^6.1.8 - CSS-in-JS styling

Version bumped from 1.0.0 to 2.0.0

### 3. Manifest Configuration (`manifest.yml`)
Updated permissions and runtime:

**Runtime:**
- Changed from `nodejs20.x` to `nodejs22.x`

**New Permissions:**
- Content styles: `unsafe-inline` (for styled-components)
- External fetch to Azure: `https://jiratoswitchprem.blob.core.windows.net`
- Additional scopes:
  - `write:jira-work`
  - `manage:jira-project`
  - `manage:jira-configuration`
  - `read:jira-user`
  - `manage:jira-webhook`

### 4. Portal Panel React Components

#### `src/portal-panel/App.js` (NEW)
Main application component with:
- PDF upload functionality with Azure Blob Storage integration
- Chunked upload for large files (4MB chunks)
- Progress tracking with visual progress bar
- PDF-only validation
- Success/error message handling
- Modal dialogs for errors
- Integration with Jira comments via `PostComment` resolver

#### `src/portal-panel/FileAttachment.js` (NEW)
File selection component featuring:
- Multiple file selection
- PDF-only acceptance (`.pdf` or `application/pdf`)
- File list display with size information
- Individual file removal
- Clean UI with styled-components

#### `src/portal-panel/errorMessages.js` (NEW)
Centralized error and UI text messages:
- Error titles and descriptions
- Button labels
- Form titles

#### `src/portal-panel/index.js` (UPDATED)
Simplified entry point that renders the App component

### 5. HTML Templates
Both `src/portal-panel/index.html` and `src/agent-panel/index.html` already include:
- React 18 UMD builds
- ReactDOM 18 UMD builds
- Proper root div for mounting

## Key Features

### PDF Upload Flow
1. User selects PDF files via FileAttachment component
2. Files are validated (PDF-only)
3. On submit, files are uploaded to Azure Blob Storage in 4MB chunks
4. Progress is displayed with percentage
5. After successful upload, a comment is posted to the Jira issue
6. Success message is shown to the user

### Azure Integration
- Files are uploaded to: `https://jiratoswitchprem.blob.core.windows.net/jira-to-switch`
- File naming convention: `[ISSUE-KEY] - filename.pdf`
- Uses SAS URL from environment variable `SAS_URL`
- Implements chunked upload for reliability with large files

### Error Handling
- Configuration errors (missing SAS_URL)
- Upload errors (network, Azure issues)
- Validation errors (non-PDF files)
- User-friendly error messages and modals

## Environment Variables Required

Set the following environment variable in your Forge app:

```bash
forge variables set --encrypt SAS_URL "your-azure-sas-url-here"
```

The SAS URL should have the following format:
```
https://jiratoswitchprem.blob.core.windows.net?sv=...&sig=...
```

## Deployment Instructions

1. **Install dependencies:**
   ```bash
   cd forge/princentre-app
   npm install
   ```

2. **Set environment variable:**
   ```bash
   forge variables set --encrypt SAS_URL "your-azure-sas-url"
   ```

3. **Build and deploy:**
   ```bash
   forge deploy
   ```

4. **Install to your site:**
   ```bash
   forge install
   ```

## Testing Checklist

- [ ] Upload single PDF file
- [ ] Upload multiple PDF files
- [ ] Try uploading non-PDF files (should show validation error)
- [ ] Verify progress bar updates during upload
- [ ] Check that Jira comment is created with file names
- [ ] Verify files appear in Azure Blob Storage with correct naming
- [ ] Test error handling (remove SAS_URL to test config error)
- [ ] Check agent panel shows uploaded files info
- [ ] Test on both issue panel and portal action contexts

## Architecture Notes

### Styled Components
The implementation uses `styled-components` for CSS-in-JS styling, providing:
- Scoped styles (no CSS conflicts)
- Dynamic styling based on props
- Clean component code

### React 18
Using modern React 18 features:
- `ReactDOM.createRoot()` for concurrent rendering
- Functional components with hooks
- `useEffect`, `useState`, `useCallback`

### Forge Bridge
Using `@forge/bridge` for:
- `invoke()`: Calling resolver functions
- `view.getContext()`: Getting issue/request context
- `view.close()`: Closing the modal/panel

## Files Modified

1. `forge/princentre-app/src/resolver.js` - Added PostComment and getSasUrl resolvers
2. `forge/princentre-app/package.json` - Added dependencies, bumped version
3. `forge/princentre-app/manifest.yml` - Updated permissions and runtime

## Files Created

1. `forge/princentre-app/src/portal-panel/App.js` - Main upload UI
2. `forge/princentre-app/src/portal-panel/FileAttachment.js` - File selector component
3. `forge/princentre-app/src/portal-panel/errorMessages.js` - UI text constants
4. `forge/princentre-app/IMPLEMENTATION_SUMMARY.md` - This document

## Next Steps

1. Run `npm install` in the `forge/princentre-app` directory
2. Set the `SAS_URL` environment variable
3. Deploy the updated app with `forge deploy`
4. Test the PDF upload functionality
5. Monitor logs with `forge logs` for any issues

## Compatibility

- Forge Runtime: Node.js 22.x
- React: 18.x
- Atlassian Forge API: 3.x
- Azure Storage Blob: 12.26.0

## Notes

- The original agent panel (`src/agent-panel/`) remains unchanged and continues to work with the storage-based file system
- The portal panel now supports both storage-based uploads (legacy) and Azure-based uploads (new)
- The implementation follows the same patterns as `printcentre-upload` for consistency
- All Azure uploads are logged in Jira comments for audit trail
