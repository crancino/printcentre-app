// Use Forge Bridge API - no React needed for simple UI
async function initApp() {
    const AP = window.AP;
    
    // Simple vanilla JS approach - no React, no CSP issues
    const root = document.getElementById('root');
    const [issue, setIssue] = React.useState(null);
    const [files, setFiles] = React.useState([]);
    const [uploading, setUploading] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [selectedFiles, setSelectedFiles] = React.useState([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        async function loadIssueData() {
            try {
                const context = await invoke('getContext');
                setIssue(context);
                
                // Check if this is a Print request type in PS project
                const projectKey = context?.extension?.project?.key;
                const requestTypeId = context?.extension?.request?.typeId;
                
                const allowedProjectKeys = ['PS'];
                const allowedRequestTypeIds = ['437', '436', '438', '441', '439', '434', '435', '440', '470'];
                
                // If not in allowed project or request type, show error message
                if (!allowedProjectKeys.includes(projectKey) || !allowedRequestTypeIds.includes(String(requestTypeId))) {
                    setMessage(`This panel is only available for Print request types in the PS project. Current project: ${projectKey}, Request Type ID: ${requestTypeId}`);
                    return;
                }
                
                const issueKey = context?.extension?.issue?.key;
                if (issueKey) {
                    const result = await invoke('getFiles', { issueKey });
                    setFiles(result.files || []);
                }
            } catch (error) {
                console.error('Error loading issue data:', error);
                setMessage('Error loading data');
            }
        }
        loadIssueData();
    }, []);

    const handleFileChange = (newFiles) => {
        setSelectedFiles(newFiles);
    };

    const uploadLargeFileToAzure = async (file, fileName, sasUrl) => {
        const chunkSize = 4 * 1024 * 1024; // 4 MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        const blockIds = [];

        // Validate and parse the SAS URL
        let containerUrl;
        try {
            containerUrl = new URL(sasUrl);
        } catch (urlError) {
            throw new Error(`Invalid SAS URL format: ${sasUrl}`);
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

    const handleSubmit = async () => {
        if (selectedFiles.length === 0) {
            setMessage('Please select at least one file');
            return;
        }

        setIsSubmitting(true);
        setMessage('Uploading files...');

        try {
            const issueKey = issue.extension.issue.key;
            
            // Get SAS URL
            const sasUrl = await invoke('getSasUrl');
            if (!sasUrl) {
                throw new Error('SAS URL not configured. Please contact administrator.');
            }

            // Upload files to Azure using chunked upload
            for (const file of selectedFiles) {
                const fileName = `[${issueKey}] - ${file.name}`;
                await uploadLargeFileToAzure(file, fileName, sasUrl);
            }
            
            // Post comment to issue
            const fileNames = selectedFiles.map(f => f.name).join(', ');
            await invoke('PostComment', {
                content: fileNames,
                key: issueKey
            });

            setMessage('Files uploaded successfully!');
            setSelectedFiles([]);
            
            // Reload files list
            const result = await invoke('getFiles', { issueKey });
            setFiles(result.files || []);
            
            setTimeout(() => {
                view.close();
            }, 2000);
            
        } catch (error) {
            console.error('Upload error:', error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        view.close();
    };

    // FileAttachment component inline
    const FileAttachment = ({ onFileChange }) => {
        const [localFiles, setLocalFiles] = React.useState([]);
        const fileInputRef = React.useRef(null);

        const handleFileChange = (event) => {
            const newFiles = Array.from(event.target.files);
            setLocalFiles((prevFiles) => {
                const updatedFiles = [...prevFiles, ...newFiles];
                onFileChange(updatedFiles);
                return updatedFiles;
            });
        };

        const handleRemoveFile = (index, event) => {
            event.preventDefault();
            event.stopPropagation();
            setLocalFiles((prevFiles) => {
                const updatedFiles = prevFiles.filter((_, i) => i !== index);
                onFileChange(updatedFiles);
                return updatedFiles;
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };

        const handleButtonClick = () => {
            fileInputRef.current?.click();
        };

        return h('div', { style: { marginBottom: '20px' } }, [
            h('div', { key: 'upload-wrapper', style: { marginBottom: '16px' } }, [
                h('input', {
                    key: 'file-input',
                    type: 'file',
                    multiple: true,
                    accept: '.pdf,application/pdf',
                    ref: fileInputRef,
                    onChange: handleFileChange,
                    style: { display: 'none' }
                }),
                h('button', {
                    key: 'upload-btn',
                    onClick: handleButtonClick,
                    style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#0052CC',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                    }
                }, '📎 PDF Upload')
            ]),
            localFiles.length > 0 && h('ul', {
                key: 'file-list',
                style: {
                    listStyleType: 'none',
                    padding: 0,
                    margin: '16px 0 0 0'
                }
            }, localFiles.map((file, index) =>
                h('li', {
                    key: index,
                    style: {
                        margin: '8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px',
                        backgroundColor: '#F4F5F7',
                        borderRadius: '3px'
                    }
                }, [
                    h('span', { key: 'filename', style: { wordBreak: 'break-word', maxWidth: '80%' } },
                        `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`),
                    h('button', {
                        key: 'remove-btn',
                        onClick: (event) => handleRemoveFile(index, event),
                        style: {
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            color: '#42526E',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }
                    }, '🗑️ Remove')
                ])
            ))
        ]);
    };

    // Check if we should display the panel based on project and request type
    const projectKey = issue?.extension?.project?.key;
    const requestTypeId = issue?.extension?.request?.typeId;
    const allowedProjectKeys = ['PS'];
    const allowedRequestTypeIds = ['437', '436', '438', '441', '439', '434', '435', '440', '470'];
    const isAllowed = allowedProjectKeys.includes(projectKey) && allowedRequestTypeIds.includes(String(requestTypeId));

    // If not allowed, return completely empty div (invisible panel)
    if (issue && !isAllowed) {
        return h('div', { style: { display: 'none' } });
    }

    return h('div', { style: { padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' } }, [
        h('h2', { key: 'title', style: { marginTop: 0 } }, 'PDF Print files'),
        
        issue && h('div', {
            key: 'issue-info',
            style: {
                padding: '12px',
                backgroundColor: '#f4f5f7',
                borderRadius: '4px',
                marginBottom: '20px'
            }
        }, [
            h('strong', { key: 'label' }, 'Request: '),
            h('span', { key: 'key' }, issue.extension.issue.key)
        ]),

        h(FileAttachment, { key: 'file-attachment', onFileChange: handleFileChange }),

        message && h('div', {
            key: 'message',
            style: {
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: message.includes('Error') ? '#ffebe6' : '#e3fcef',
                color: message.includes('Error') ? '#de350b' : '#006644',
                borderRadius: '4px',
                border: `1px solid ${message.includes('Error') ? '#ffbdad' : '#abf5d1'}`
            }
        }, message),

        h('div', { key: 'actions', style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' } }, [
            h('button', {
                key: 'cancel',
                onClick: handleCancel,
                style: {
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                }
            }, 'Cancel'),
            h('button', {
                key: 'submit',
                onClick: handleSubmit,
                disabled: isSubmitting || selectedFiles.length === 0,
                style: {
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: isSubmitting || selectedFiles.length === 0 ? '#ccc' : '#0052CC',
                    color: 'white',
                    cursor: isSubmitting || selectedFiles.length === 0 ? 'not-allowed' : 'pointer'
                }
            }, isSubmitting ? 'Uploading...' : 'Submit')
        ])
    ]);
};

const root = createRoot(document.getElementById('root'));
root.render(h(App));
