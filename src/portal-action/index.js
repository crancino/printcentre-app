import { invoke, view } from '@forge/bridge';

const { createElement: h } = React;
const { createRoot } = ReactDOM;

function PortalAction() {
    const [issue, setIssue] = React.useState(null);
    const [files, setFiles] = React.useState([]);
    const [uploading, setUploading] = React.useState(false);
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
                setMessage('Error loading data');
            }
        }
        loadIssueData();
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage('Uploading...');
        
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target.result.split(',')[1];
                await invoke('uploadFile', {
                    issueKey: issue.extension.issue.key,
                    fileName: file.name,
                    fileData: base64,
                    mimeType: file.type
                });
                
                setMessage('File uploaded successfully!');
                
                // Reload files
                const result = await invoke('getFiles', { issueKey: issue.extension.issue.key });
                setFiles(result.files || []);
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    view.close();
                }, 2000);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage('Error uploading file: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        view.close();
    };

    return h('div', { style: { padding: '30px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '500px' } }, [
        h('h2', { key: 'title', style: { marginTop: 0, marginBottom: '20px' } }, 'Upload to PrintCentre'),
        
        issue && h('div', { key: 'issue-info', style: { marginBottom: '20px', padding: '12px', backgroundColor: '#f4f5f7', borderRadius: '4px' } }, [
            h('strong', { key: 'label' }, 'Request: '),
            h('span', { key: 'key' }, issue.extension.issue.key)
        ]),

        h('div', { key: 'upload-section', style: { marginBottom: '20px' } }, [
            h('label', { 
                key: 'label',
                style: { 
                    display: 'block', 
                    marginBottom: '10px',
                    fontWeight: '500' 
                } 
            }, 'Select file to upload:'),
            h('input', {
                key: 'file-input',
                type: 'file',
                onChange: handleFileUpload,
                disabled: uploading,
                style: { 
                    display: 'block', 
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                }
            })
        ]),

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

        files.length > 0 && h('div', { key: 'files-section', style: { marginBottom: '20px' } }, [
            h('h4', { key: 'files-title', style: { marginBottom: '10px' } }, 'Previously Uploaded Files:'),
            h('div', { key: 'files-list', style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
                files.map((file, idx) => 
                    h('div', { 
                        key: idx, 
                        style: { 
                            padding: '8px 12px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: '#fafbfc'
                        } 
                    }, file.name)
                )
            )
        ]),

        h('div', { key: 'actions', style: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' } }, [
            h('button', {
                key: 'close',
                onClick: handleClose,
                style: {
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                }
            }, 'Close')
        ])
    ]);
}

const root = createRoot(document.getElementById('root'));
root.render(h(PortalAction));
