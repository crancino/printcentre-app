import React, {useEffect, useState, useCallback} from 'react';
import {invoke, view} from '@forge/bridge';
import styled from 'styled-components';

// --- Replaced Imports (Using Atlassian Design System components) ---
import Form, {FormHeader, FormSection, FormFooter} from '@atlaskit/form';
import Button, {ButtonGroup} from '@atlaskit/button';
import Flag from '@atlaskit/flag';
import FlagGroup from '@atlaskit/flag/flag-group';
import Banner from '@atlaskit/banner';
// CORRECTED ICON IMPORTS for @atlaskit/icon@21
import AlertTriangleIcon from '@atlaskit/icon/glyph/warning';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import Spinner from '@atlaskit/spinner';
// ------------------------------------------------------------------

import FileAttachment from "./FileAttachment"; // Assuming this is also a React component
// import LoadingSpinner from "./LoadingSpinner"; // REMOVED: Replaced with Spinner
// import ModalPopup from "./ModalPopup"; // REMOVED: Replaced with Modal

import {
    ERROR_SAVING_TITLE,
    ERROR_SAVING_BODY,
    BUTTON_LABEL_SUBMIT,
    BUTTON_LABEL_CANCEL, TITLE_HEADER, BUTTON_LABEL_RETURN, ERROR_LOADING_TITLE, ERROR_LOADING_BODY
} from "./errorMessages";
import {BlobServiceClient} from "@azure/storage-blob";


const Content = styled.div`
    margin: ${({isIssueView}) => isIssueView ? '24px 24px 0' : 0};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    form {
        overflow-y: auto;
        padding-right: 10px;
        height: 500px;
    }
`;

// --- Atlassian UI Kit Progress Bar Styles ---
const ProgressContainer = styled.div`
    margin-top: 24px;
    padding: 16px;
    background-color: #F4F5F7;
    border-radius: 3px;
    border: 1px solid #DFE1E6;
`;

const ProgressBarWrapper = styled.div`
    width: 100%;
    margin-top: 8px;
`;

const ProgressBarTrack = styled.div`
    width: 100%;
    height: 8px;
    background-color: #EBECF0;
    border-radius: 3px;
    overflow: hidden;
`;

const ProgressBarFill = styled.div`
    height: 100%;
    background-color: #0052CC;
    width: ${props => props.progress}%;
    border-radius: 3px;
    transition: width 0.3s ease-in-out;
`;

const ProgressLabel = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 14px;
    color: #172B4D;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
`;

const ProgressStatus = styled.span`
    font-weight: 500;
    color: #172B4D;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
`;


function App() {
    // Progress is now used for the 'percentage' label
    const [uploadProgress, setUploadProgress] = useState(0); 
    const [isUploading, setIsUploading] = useState(false);
    const [extensionData, setExtensionData] = useState(null);
    const [files, setFiles] = useState([]);
    
    // State to force reset FileAttachment component
    const [fileAttachmentKey, setFileAttachmentKey] = useState(0); 
    
    // States for success message display (using Flags)
    const [flags, setFlags] = useState([]);
    const [validationError, setValidationError] = useState(null); 

    const [isOpenSave, setIsOpenSave] = useState(false)
    const openModalSave = useCallback(() => setIsOpenSave(true), [])
    const closeModalSave = useCallback(() => setIsOpenSave(false), [])
    
    const [isOpenAzureComments, setIsOpenAzureComments] = useState(false);
    const openModalAzureComments = useCallback(() => setIsOpenAzureComments(true), [])
    const closeModalAzureComments = useCallback(() => {
        // Only close the view if the user is in a state to proceed (not mid-upload error)
        if (!isUploading) view.close();
        setIsOpenAzureComments(false)
    }, [isUploading])

    useEffect(() => {
        view.getContext().then(({extension}) => {
            setExtensionData(extension);
        });
    }, []);

    const formValueSubmit = useCallback(async (value) => {
        try {
            return await view.submit(value);
        } catch (e) {
            return openModalSave()
        }
    }, [openModalSave]);

    /**
     * Helper to add a success flag after upload.
     */
    const addSuccessFlag = (message) => {
        const id = Date.now();
        const newFlag = (
            <Flag
                key={id}
                id={id}
                icon={<CheckCircleIcon label="Success" primaryColor="#00B386" />}
                title="Upload Complete"
                description={message}
                actions={[{ content: 'Dismiss', onClick: () => handleDismissFlag(id) }]}
            />
        );
        setFlags(currentFlags => [newFlag]);
    };

    const handleDismissFlag = (id) => {
        setFlags(currentFlags => currentFlags.filter(flag => flag.props.id !== id));
    };

    /**
     * Add the files to Azure blob storage, then create a comment and save the names of the files in the issue
     */
    const onSubmit = async () => {
        if (files.length === 0) return;

        setValidationError(null); // Clear any lingering validation errors
        setFlags([]); // Hide previous success alert/flags
        setIsUploading(true); // Start uploading state
        setUploadProgress(0); // Reset progress bar

        var textField = generateTextField();
        
        try {
            for (const file of files) {
                const fileName = `[${isIssueView ? extensionData.issue.key : extensionData.request.key}] - ${file.name}`;
                await uploadFiles(file, fileName); // This updates uploadProgress
            }
        
            // After all files are uploaded successfully
            if (isIssueView) {
                await invoke('PostComment',  {content: textField, key: extensionData.issue.key});
                await formValueSubmit(textField);
            } else {
                await invoke('PostComment',  {content: textField, key: extensionData.request.key});
            }
            
            // Final SUCCESS state setup for the permanent alert
            setIsUploading(false);
            setUploadProgress(100); // Final state is 100%
            addSuccessFlag(`Successfully uploaded ${files.length} PDF file(s) and posted a comment.`);
            
            // *** Clear the files state in App.js and reset FileAttachment component ***
            await setFiles([]);
            setFileAttachmentKey(prevKey => prevKey + 1); 

        } catch (e) {
            console.log("Error during upload or comment creation: " + e);
            setIsUploading(false);
            
            // Check if the error is related to missing/invalid SAS URL
            const errorMessage = e?.message || String(e);
            if (errorMessage.includes('SAS_URL') || errorMessage.includes('Invalid URL')) {
                // Show a more specific error message for configuration issues
                const id = Date.now();
                const configErrorFlag = (
                    <Flag
                        key={id}
                        id={id}
                        icon={<AlertTriangleIcon label="Configuration Error" primaryColor="#FF5630" />}
                        title="Configuration Error"
                        description="The SAS_URL environment variable is not configured. Please set the SAS_URL environment variable in your Forge app settings."
                        actions={[{ content: 'Dismiss', onClick: () => handleDismissFlag(id) }]}
                        appearance="error"
                    />
                );
                setFlags([configErrorFlag]);
                return;
            }
            
            // This is a critical error, open the Azure ModalPopup replacement
            return openModalAzureComments(); 
        }
    };

    /**
     * Upload a File directly to Azure Blob storage
     * @param file File selected by the users
     * @param fileName File name with the information of the Key
     */

    const uploadLargeFileToAzure = async (file, fileName, sasUrl) => {
        const chunkSize = 4 * 1024 * 1024; // 4 MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        const blockIds = [];

        // Validate and parse the SAS URL
        let containerUrl;
        try {
            containerUrl = new URL(sasUrl);
        } catch (urlError) {
            throw new Error(`Invalid SAS URL format: ${sasUrl}. Please check your SAS_URL environment variable.`);
        }
        
        const baseUrl = `${containerUrl.origin}/jira-to-switch`;
        const sasToken = containerUrl.search;

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const blockId = btoa(`block-${i.toString().padStart(6, '0')}`);
            blockIds.push(blockId);

            const uploadUrl = `${baseUrl}/${encodeURIComponent(fileName)}?comp=block&blockid=${encodeURIComponent(blockId)}&${sasToken.slice(1)}`;
            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                },
                body: chunk
            });
            
            // Update progress state
            setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));

            
            if (!response.ok) {
                throw new Error(`Failed to upload block ${i}: ${response.statusText}`);
            }
        }

        // Commit block list
        
        const blockListXml = `<?xml version="1.0" encoding="utf-8"?>
            <BlockList>
            ${blockIds.map(id => `<Latest>${id}</Latest>`).join('\n')}
            </BlockList>`;


        const commitUrl = `${baseUrl}/${encodeURIComponent(fileName)}?comp=blocklist&${sasToken.slice(1)}`;
        const commitResponse = await fetch(commitUrl, {
            method: 'PUT',
            headers: {
                'x-ms-blob-content-type': 'application/pdf',
                'Content-Type': 'application/xml'
            },
            body: blockListXml
        });

        if (!commitResponse.ok) {
            throw new Error(`Failed to commit block list: ${commitResponse.statusText}`);
        }
    };

    const uploadFiles = async (file, fileName) => {
        try {
            const sasUrl = await invoke('getSasUrl');
            
            // Validate SAS URL before attempting to use it
            if (!sasUrl || typeof sasUrl !== 'string' || sasUrl.trim() === '') {
                throw new Error('SAS_URL environment variable is not set or is invalid. Please configure the SAS_URL environment variable in your Forge app settings.');
            }
            
            // Removed setUploadProgress from arguments, using the state setter directly
            await uploadLargeFileToAzure(file, fileName, sasUrl); 
            
            return null;
        } catch (error) {
            console.log("ERROR -> " + error.message);
            throw error; // Re-throw the error to be caught by onSubmit's try/catch
        }
    };

    /**
     * Generate the string with all the files names
     * @return String with the names of the files selected
     */
    const generateTextField = () => {
        // Use modern Array.join() for cleaner code
        return files.map(file => file.name).join(', ');
    };

    // ... handleOnBlur is fine as-is

    /**
     * Helper function to check if a file is a PDF, accounting for missing MIME type or name.
     */
    const isPDF = (file) => {
        if (!file || typeof file !== 'object') return false; 
        
        const pdfMimeType = 'application/pdf';

        // 1. Check MIME type (preferred)
        if (file.type && typeof file.type === 'string' && file.type === pdfMimeType) {
            return true;
        }
        
        // 2. Fallback check using file extension
        if (file.name && typeof file.name === 'string') {
            const lowerCaseName = file.name.toLowerCase();
            if (lowerCaseName.endsWith('.pdf')) {
                return true;
            }
        }
        
        return false;
    };

    /**
     * Handle the file change from the FileAttachment component.
     * Implements PDF-only validation and updates the files state.
     * @param selectedFiles files array passed directly from FileAttachment
     */
    const handleFileChange = (selectedFiles) => {
        setValidationError(null); // Clear previous errors on new file selection
        setFlags([]); // Hide success alert on new file selection
        
        // Safety check: ensure we received an array of files
        if (!Array.isArray(selectedFiles)) {
            setFiles([]); 
            return;
        }

        const filesArray = selectedFiles;
        
        // Filter files using the robust isPDF check
        const invalidFiles = filesArray.filter(file => !isPDF(file));
        const validFiles = filesArray.filter(file => isPDF(file));

        if (invalidFiles.length > 0) {
            const invalidNames = invalidFiles.map(file => file.name || 'Unknown File').join(', ');
            setValidationError(
                `Only PDF files are allowed. The following files were ignored: ${invalidNames}`
            );
        }
        
        setFiles(validFiles);
    };

    const isIssueView = extensionData?.renderContext && extensionData.renderContext === 'issue-view';

    if (!extensionData) {
        // --- UI KIT CHANGE: Replaced custom LoadingSpinner with Atlassian Spinner ---
        return <center style={{ marginTop: '20px' }}><Spinner size="large" /></center>
    }


    return (
        <Content isIssueView={isIssueView}>
            <Form onSubmit={onSubmit}>
                {({formProps}) => {
                    return (
                        <form {...formProps}>
                            <FormHeader title={TITLE_HEADER}/>
                            <p>Click on the <b>upload button</b> to submit PDF files for printing</p>
                            
                            {/* --- UI KIT CHANGE: PDF Validation Error Display using Banner --- */}
                            {validationError && (
                                <Banner 
                                    icon={<AlertTriangleIcon label="Warning" />} 
                                    appearance="warning"
                                >
                                    {validationError}
                                </Banner>
                            )}
                            
                            <FormSection>
                                <FileAttachment 
                                    key={fileAttachmentKey}
                                    onFileChange={handleFileChange}
                                />
                            </FormSection>
                            
                            {/* --- UI KIT CHANGE: Progress Bar using Atlassian Design System --- */}
                            {isUploading && (
                                <ProgressContainer>
                                    <ProgressLabel>
                                        <span>Uploading files to Azure...</span>
                                        <ProgressStatus>{uploadProgress}%</ProgressStatus>
                                    </ProgressLabel>
                                    <ProgressBarWrapper>
                                        <ProgressBarTrack>
                                            <ProgressBarFill progress={uploadProgress} />
                                        </ProgressBarTrack>
                                    </ProgressBarWrapper>
                                </ProgressContainer>
                            )}

                            <FormFooter>
                                <ButtonGroup>
                                    {/* --- UI KIT CHANGE: Button is disabled during upload --- */}
                                    <Button 
                                        type="submit" 
                                        appearance="primary" 
                                        isDisabled={files.length === 0 || isUploading}
                                        isLoading={isUploading}
                                    >
                                        {BUTTON_LABEL_SUBMIT}
                                    </Button>
                                </ButtonGroup>
                            </FormFooter>
                        </form>
                    )
                }}
            </Form>
            
            {/* --- UI KIT CHANGE: Permanent Success Message (Replaced with FlagGroup) --- */}
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                <FlagGroup>{flags}</FlagGroup>
            </div>


            {/* --- UI KIT CHANGE: ModalPopup Replacement for Azure Errors --- */}
            <ModalTransition>
                {isOpenAzureComments && (
                    <Modal onClose={closeModalAzureComments}>
                        <ModalHeader>
                            <ModalTitle>{ERROR_LOADING_TITLE}</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                            <p>{ERROR_LOADING_BODY}</p>
                        </ModalBody>
                        <ModalFooter>
                            <ButtonGroup>
                                <Button 
                                    appearance="primary" 
                                    onClick={closeModalAzureComments}
                                >
                                    {BUTTON_LABEL_RETURN}
                                </Button>
                            </ButtonGroup>
                        </ModalFooter>
                    </Modal>
                )}
            </ModalTransition>

            {/* --- UI KIT CHANGE: ModalPopup Replacement for Save Errors --- */}
            <ModalTransition>
                {isOpenSave && (
                    <Modal onClose={closeModalSave}>
                        <ModalHeader>
                            <ModalTitle appearance="warning">{ERROR_SAVING_TITLE}</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                            <p>{ERROR_SAVING_BODY}</p>
                        </ModalBody>
                        <ModalFooter>
                            <ButtonGroup>
                                <Button 
                                    appearance="warning" 
                                    onClick={closeModalSave}
                                >
                                    {BUTTON_LABEL_RETURN}
                                </Button>
                            </ButtonGroup>
                        </ModalFooter>
                    </Modal>
                )}
            </ModalTransition>
        </Content>
    );
}

export default App;