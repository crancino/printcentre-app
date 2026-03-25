// @forge/bridge is loaded globally via script tag in HTML
const { invoke } = window.ForgeBridge;

const { createElement: h } = React;
const { createRoot } = ReactDOM;

function AgentPanel() {
    const [issue, setIssue] = React.useState(null);
    const [files, setFiles] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedFiles, setSelectedFiles] = React.useState([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        async function loadIssueData() {
            try {
                const context = await invoke('getContext');
                setIssue(context);
                
                const issueKey = context?.extension?.issue?.key;
                if (issueKey) {
                    const result = await invoke('getFiles', { issueKey });
                    setFiles(result.files || []);
                }
            } catch (error) {
                console.error('Error loading issue data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadIssueData();
    }, []);

    const handleFileChange = (files) => {
        setSelectedFiles(files);
        setMessage('');
    };

    const uploadLargeFileToAzure = async (file, fileName, sasUrl) => {
        const chunkSize = 4 * 1024 * 1024; // 4MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        const blockIds = [];

        const [baseUrl, sasToken] = sasUrl.split('?');

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
                throw new Error(`Failed to upload block ${i}: ${response.statusText}`);
            }
        }

        // Commit all blocks
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
            throw new Error(`Failed to commit blocks: ${commitResponse.statusText}`);
        }
    };

    const handleSubmit = async () => {
        if (selectedFiles.length === 0) {
            setMessage('Please select at least one file');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            const sasUrl = await invoke('getSasUrl');
            
            // Upload files to Azure
            for (const file of selectedFiles) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `${issue.extension.issue.key}_${timestamp}_${file.name}`;
                await uploadLargeFileToAzure(file, fileName, sasUrl);
            }

            setMessage(`Successfully uploaded ${selectedFiles.length} file(s)!`);
            setSelectedFiles([]);
            
            // Reload files list
            const issueKey = issue?.extension?.issue?.key;
            if (issueKey) {
                const result = await invoke('getFiles', { issueKey });
                setFiles(result.files || []);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setSelectedFiles([]);
        setMessage('');
    };

    // FileAttachment component
    const FileAttachment = ({ onFileChange }) => {
        const fileInputRef = React.useRef(null);

        const handleFileSelect = (e) => {
            const files = Array.from(e.target.files);
            onFileChange(files);
        };

        const handleButtonClick = () => {
            fileInputRef.current?.click();
        };

        return h('div', { key: 'upload-wrapper', style: { marginBottom: '16px' } }, [
            h('input', {
                key: 'file-input',
                ref: fileInputRef,
                type: 'file',
                multiple: true,
                accept: '.pdf',
                onChange: handleFileSelect,
                style: { display: 'none' }
            }),
            h('button', {
                key: 'upload-btn',
                onClick: handleButtonClick,
                style: {
                    padding: '8px 16px',
                    backgroundColor: '#0052CC',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                }
            }, selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Choose PDF files'),
            selectedFiles.length > 0 && h('div', {
                key: 'file-list',
                style: { marginTop: '8px', fontSize: '14px', color: '#666' }
            }, selectedFiles.map(f => f.name).join(', '))
        ]);
    };

    if (loading) {
        return h('div', { style: { padding: '20px' } }, 'Loading...');
    }

    return h('div', { style: { padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' } }, [
        h('h3', { key: 'title', style: { marginTop: 0 } }, 'PDF Attachments'),
        
        h('div', { key: 'info', style: { padding: '10px', backgroundColor: '#f4f5f7', borderRadius: '4px', marginBottom: '16px' } }, [
            h('strong', { key: 'label' }, 'Issue: '),
            h('span', { key: 'key' }, issue?.extension?.issue?.key || 'Unknown')
        ]),

        // Upload section
        h('div', { key: 'upload-section', style: { marginBottom: '20px', padding: '16px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fafbfc' } }, [
            h('h4', { key: 'upload-title', style: { marginTop: 0, marginBottom: '12px' } }, 'Upload Files'),
            h(FileAttachment, { key: 'file-attachment', onFileChange: handleFileChange }),
            
            message && h('div', {
                key: 'message',
                style: {
                    padding: '12px',
                    marginBottom: '12px',
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
                    disabled: isSubmitting,
                    style: {
                        padding: '8px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.6 : 1
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
        ]),

        // Files list section
        files.length === 0 
            ? h('p', { key: 'no-files', style: { color: '#666', fontStyle: 'italic' } }, 
                'No files uploaded yet.')
            : h('div', { key: 'files-section' }, [
                h('h4', { key: 'files-title' }, `Uploaded Files (${files.length})`),
                h('div', { key: 'files-list', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                    files.map((file, idx) => 
                        h('div', { 
                            key: idx, 
                            style: { 
                                padding: '12px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px',
                                backgroundColor: '#fafbfc'
                            } 
                        }, [
                            h('div', { key: 'name', style: { fontWeight: 'bold', marginBottom: '4px' } }, file.name),
                            h('div', { 
                                key: 'meta', 
                                style: { fontSize: '12px', color: '#666' } 
                            }, `Uploaded: ${new Date(file.uploadedAt).toLocaleString()}`)
                        ])
                    )
                )
            ])
    ]);
}

const root = createRoot(document.getElementById('root'));
root.render(h(AgentPanel));
