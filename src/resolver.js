import Resolver from '@forge/resolver';
import api, { route, storage } from '@forge/api';

const resolver = new Resolver();

// Get the current context (issue details, etc.)
resolver.define('getContext', async (req) => {
    const context = req.context;
    
    // Check if this is an allowed project and request type
    const projectKey = context?.extension?.project?.key;
    const requestTypeId = context?.extension?.request?.typeId;
    
    const allowedProjectKeys = ['PS'];
    const allowedRequestTypeIds = ['437', '436', '438', '441', '439', '434', '435', '440', '470'];
    
    const isAllowed = allowedProjectKeys.includes(projectKey) && 
                      allowedRequestTypeIds.includes(String(requestTypeId));
    
    // Return context with authorization flag
    return {
        ...context,
        isAuthorized: isAllowed,
        projectKey,
        requestTypeId
    };
});

// Get files for a specific issue
resolver.define('getFiles', async (req) => {
    // Check authorization
    const projectKey = req.context?.extension?.project?.key;
    const requestTypeId = req.context?.extension?.request?.typeId;
    const allowedProjectKeys = ['PS'];
    const allowedRequestTypeIds = ['437', '436', '438', '441', '439', '434', '435', '440', '470'];
    
    if (!allowedProjectKeys.includes(projectKey) || !allowedRequestTypeIds.includes(String(requestTypeId))) {
        return { files: [], error: 'Unauthorized: This function is only available for Print request types in PS project' };
    }
    
    const { issueKey } = req.payload;
    
    try {
        const files = await storage.get(`files_${issueKey}`) || [];
        return { files };
    } catch (error) {
        console.error('Error getting files:', error);
        return { files: [] };
    }
});

// Upload a file for an issue
resolver.define('uploadFile', async (req) => {
    // Check authorization
    const projectKey = req.context?.extension?.project?.key;
    const requestTypeId = req.context?.extension?.request?.typeId;
    const allowedProjectKeys = ['PS'];
    const allowedRequestTypeIds = ['437', '436', '438', '441', '439', '434', '435', '440', '470'];
    
    if (!allowedProjectKeys.includes(projectKey) || !allowedRequestTypeIds.includes(String(requestTypeId))) {
        throw new Error('Unauthorized: This function is only available for Print request types in PS project');
    }
    
    const { issueKey, fileName, fileData, mimeType } = req.payload;
    
    try {
        // Get existing files
        const existingFiles = await storage.get(`files_${issueKey}`) || [];
        
        // Add new file
        const newFile = {
            name: fileName,
            mimeType: mimeType,
            data: fileData,
            uploadedAt: new Date().toISOString(),
            uploadedBy: req.context.accountId
        };
        
        existingFiles.push(newFile);
        
        // Save back to storage
        await storage.set(`files_${issueKey}`, existingFiles);
        
        return { success: true };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
});

/**
 * Create a comment in the Jira issue with the information of the documents that are going to be printed
 * @param payload.content names of the documents
 * @param payload.key issue key of the current issue
 * @return data Json with the information of the issue
 */
resolver.define('PostComment', async ({ payload, context }) => {
    try {
        const userAccountId = context.accountId;
        const userResponse = await api.asApp().requestJira(route`/rest/api/3/user?accountId=${userAccountId}`);
        const userData = await userResponse.json();
        const userName = userData.displayName;

        var bodyData = `{
    "body": {
      "content": [
        {
          "content": [
            {
              "text": "The following documents have been submitted for printing: ${payload.content} by ${userName}.",
              "type": "text"
            }
          ],
          "type": "paragraph"
        }
      ],
      "type": "doc",
      "version": 1
    }
    }`;
        // Using asUser() so the comment appears to be from the user, not the app
        const response = await api.asUser().requestJira(route`/rest/api/3/issue/${payload.key}/comment`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: bodyData
        });
        return response;
    } catch (error) {
        console.error('Error creating the comment:', error);
        throw error;
    }
});

/**
 * Get the SAS URL from Azure from the forge variables
 * @return SAS_URL from environment variables
 */
resolver.define('getSasUrl', async (req) => {
    return process.env.SAS_URL;
});

export const handler = resolver.getDefinitions();
