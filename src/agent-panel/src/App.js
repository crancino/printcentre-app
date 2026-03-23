import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

function App() {
    const [issue, setIssue] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
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

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
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

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <h3 style={{ marginTop: 0 }}>PDF Attachments</h3>
            
            <div style={{ padding: '10px', backgroundColor: '#f4f5f7', borderRadius: '4px', marginBottom: '16px' }}>
                <strong>Issue: </strong>
                <span>{issue?.extension?.issue?.key || 'Unknown'}</span>
            </div>

            {/* Upload section */}
            <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fafbfc' }}>
                <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Upload Files</h4>
                <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'block', marginBottom: '12px' }}
                />
                {selectedFiles.length > 0 && (
                    <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                        Selected: {selectedFiles.map(f => f.name).join(', ')}
                    </div>
                )}
                
                {message && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '12px',
                        backgroundColor: message.includes('Error') ? '#ffebe6' : '#e3fcef',
                        color: message.includes('Error') ? '#de350b' : '#006644',
                        borderRadius: '4px',
                        border: `1px solid ${message.includes('Error') ? '#ffbdad' : '#abf5d1'}`
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        style={{
                            display:'none',
                            padding: '8px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.6 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || selectedFiles.length === 0}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: isSubmitting || selectedFiles.length === 0 ? '#ccc' : '#0052CC',
                            color: 'white',
                            cursor: isSubmitting || selectedFiles.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? 'Uploading...' : 'Submit'}
                    </button>
                </div>
            </div>

            {/* Files list section */}
            <div>
                <h4>Uploaded Files</h4>
                {files.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No files uploaded yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {files.map((file, idx) => (
                            <div key={idx} style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: '#fafbfc'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{file.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
