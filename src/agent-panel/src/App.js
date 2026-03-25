import React, {useEffect, useState, useCallback} from 'react';
import {invoke, view} from '@forge/bridge';
import styled from 'styled-components';
import Button, { ButtonGroup } from '@atlaskit/button';
import Form, { FormFooter, FormHeader, Field } from '@atlaskit/form';
import {
    BUTTON_LABEL_SUBMIT,
    ERROR_MESSAGE_CONFIGURATION,
    ERROR_MESSAGE_UPLOAD_FAILED,
    SUCCESS_MESSAGE_UPLOAD,
    INFO_MESSAGE_UPLOADING,
    ERROR_MESSAGE_POST_COMMENT_FAILED,
    BANNER_TITLE_SUCCESS,
    BANNER_TITLE_ERROR,
    FIELD_LABEL_PDF_UPLOAD,
    FIELD_DESCRIPTION_PDF_UPLOAD
} from './errorMessages';
import FileAttachment from './FileAttachment';
import Banner from '@atlaskit/banner';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import SuccessIcon from '@atlaskit/icon/glyph/check-circle';
import Spinner from '@atlaskit/spinner';

const Content = styled.div`
    margin: ${({isIssueView}) => isIssueView ? '24px 24px 0' : 0};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    form {
        overflow-y: auto;
        padding-right: 10px;
        height: 500px;
    }
`;

const ProgressContainer = styled.div`
    margin: 16px 0;
    padding: 16px;
    background-color: #f4f5f7;
    border-radius: 4px;
`;

const ProgressBarContainer = styled.div`
    width: 100%;
    height: 8px;
    background-color: #dfe1e6;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 8px;
`;

const ProgressBarFill = styled.div`
    height: 100%;
    background-color: #0052cc;
    transition: width 0.3s ease;
    border-radius: 4px;
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
    const [context, setContext] = useState(undefined);
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentFileName, setCurrentFileName] = useState('');
    const [bannerMessage, setBannerMessage] = useState(null);
    const [bannerType, setBannerType] = useState('');

    useEffect(() => {
        view.theme.enable();
        invoke('getContext').then(setContext);
    }, []);

    const showBanner = (message, type) => {
        setBannerMessage(message);
        setBannerType(type);
        setTimeout(() => {
            setBannerMessage(null);
            setBannerType('');
        }, 5000);
    };

    const uploadLargeFileToAzure = async (file, fileName, sasUrl, onProgress) => {
        const chunkSize = 4 * 1024 * 1024;
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

            const blockId = btoa(`block-${String(i).padStart(6, '0')}`);
            blockIds.push(blockId);

            const uploadUrl = `${baseUrl}/${encodeURIComponent(fileName)}?comp=block&blockid=${encodeURIComponent(blockId)}&${sasToken.slice(1)}`;

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': 'application/octet-stream'
                },
                body: chunk
            });

            if (!response.ok) {
                throw new Error(`Failed to upload chunk ${i + 1}/${totalChunks}`);
            }

            if (onProgress) {
                const progress = Math.round(((i + 1) / totalChunks) * 100);
                onProgress(progress);
            }
        }

        const blockListXml = `<?xml version="1.0" encoding="utf-8"?>
            <BlockList>${blockIds.map(id => `<Latest>${id}</Latest>`).join('')}</BlockList>`;

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
            throw new Error('Failed to commit file blocks');
        }
    };

    const uploadFiles = async (file, fileName) => {
        try {
            const sasUrl = await invoke('getSasUrl');
            
            if (!sasUrl || typeof sasUrl !== 'string' || sasUrl.trim() === '') {
                throw new Error(ERROR_MESSAGE_CONFIGURATION);
            }
            
            await uploadLargeFileToAzure(file, fileName, sasUrl, (progress) => {
                setUploadProgress(progress);
            });
            
            console.log(`File ${fileName} uploaded successfully`);
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const postCommentToIssue = async (issueKey, fileNames) => {
        try {
            const commentText = `PDF files uploaded to Azure Blob Storage:\n${fileNames.map(name => `• ${name}`).join('\n')}`;
            await invoke('PostComment', { issueKey, commentText });
            console.log('Comment posted successfully');
        } catch (error) {
            console.error('Error posting comment:', error);
            throw new Error(ERROR_MESSAGE_POST_COMMENT_FAILED);
        }
    };

    const onSubmit = useCallback(async (formData) => {
        if (!files || files.length === 0) {
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        
        const issueKey = context?.extension?.issue?.key;
        const uploadedFileNames = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setCurrentFileName(file.name);
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `${issueKey}_${timestamp}_${file.name}`;
                
                await uploadFiles(file, fileName);
                uploadedFileNames.push(file.name);
                
                setUploadProgress(0);
            }

            await postCommentToIssue(issueKey, uploadedFileNames);
            
            showBanner(SUCCESS_MESSAGE_UPLOAD, 'success');
            setFiles([]);
            setCurrentFileName('');
            
        } catch (error) {
            console.error('Error during upload:', error);
            showBanner(error.message || ERROR_MESSAGE_UPLOAD_FAILED, 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setCurrentFileName('');
        }
    }, [files, context]);

    const handleFilesChange = useCallback((newFiles) => {
        setFiles(newFiles);
    }, []);

    if (!context) {
        return <div>Loading...</div>;
    }

    return (
        <Content isIssueView={true}>
            {bannerMessage && (
                <Banner
                    icon={bannerType === 'success' ? <SuccessIcon label="Success" primaryColor="#36B37E" /> : <WarningIcon label="Error" primaryColor="#DE350B" />}
                    appearance={bannerType === 'success' ? 'announcement' : 'error'}
                >
                    {bannerMessage}
                </Banner>
            )}

            <Form onSubmit={onSubmit}>
                {({formProps}) => (
                    <form {...formProps}>
                        <FormHeader title="PDF Attachments" />
                        
                        <Field 
                            name="pdfFiles" 
                            label={FIELD_LABEL_PDF_UPLOAD}
                            isRequired
                        >
                            {() => (
                                <>
                                    <p style={{fontSize: '12px', color: '#6B778C', marginTop: '4px'}}>
                                        {FIELD_DESCRIPTION_PDF_UPLOAD}
                                    </p>
                                    <FileAttachment
                                        files={files}
                                        onFilesChange={handleFilesChange}
                                        isDisabled={isUploading}
                                    />
                                </>
                            )}
                        </Field>

                        {isUploading && (
                            <ProgressContainer>
                                <ProgressLabel>
                                    <span>Uploading: {currentFileName}</span>
                                    <ProgressStatus>{uploadProgress}%</ProgressStatus>
                                </ProgressLabel>
                                <ProgressBarContainer>
                                    <ProgressBarFill style={{ width: `${uploadProgress}%` }} />
                                </ProgressBarContainer>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    marginTop: '12px',
                                    fontSize: '14px',
                                    color: '#5E6C84'
                                }}>
                                    <Spinner size="small" />
                                    <span style={{ marginLeft: '8px' }}>{INFO_MESSAGE_UPLOADING}</span>
                                </div>
                            </ProgressContainer>
                        )}

                        <FormFooter>
                            <ButtonGroup>
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
                )}
            </Form>
        </Content>
    );
}

export default App;
