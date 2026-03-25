import React, {useState, useRef} from 'react';
import styled from 'styled-components';
import {TITLE_CUSTOM_UPLOAD} from "./errorMessages";
import Button from '@atlaskit/button';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import AttachmentIcon from '@atlaskit/icon/glyph/attachment';

const FileList = styled.ul`
    list-style-type: none;
    padding: 0;
    margin: 16px 0 0 0;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
`;

const FileListItem = styled.li`
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 8px;
    background-color: #F4F5F7;
    border-radius: 3px;
`;

const FileName = styled.span`
    word-break: break-word;
    max-width: 80%;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
`;

const UploadButtonWrapper = styled.div`
    margin-bottom: 16px;
`;

function FileAttachment({ onFilesChange }) {
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const newFiles = Array.from(event.target.files);
        
        // Use functional state update to combine files
        setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles, ...newFiles];
            // CRITICAL FIX: Pass the actual array of files to the parent component
            onFilesChange(updatedFiles);
            return updatedFiles;
        });
    };

    const handleRemoveFile = (index, event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Use functional state update to filter files
        setFiles((prevFiles) => {
            const updatedFiles = prevFiles.filter((_, i) => i !== index);
            // CRITICAL FIX: Pass the actual array of files to the parent component
            onFilesChange(updatedFiles);
            return updatedFiles;
        });

        // Reset input value to allow re-uploading the same file if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <UploadButtonWrapper>
                <input
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <Button 
                    appearance="primary"
                    onClick={handleButtonClick}
                    iconBefore={<AttachmentIcon label="Upload" />}
                >
                    {TITLE_CUSTOM_UPLOAD}
                </Button>
            </UploadButtonWrapper>
            <FileList>
                {files.map((file, index) => (
                    <FileListItem key={index}>
                        <FileName>
                            <AttachmentIcon label="File" size="small" />
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </FileName>
                        <Button 
                            appearance="subtle"
                            onClick={(event) => handleRemoveFile(index, event)}
                            iconBefore={<TrashIcon label="Remove" />}
                        >
                            Remove
                        </Button>
                    </FileListItem>
                ))}
            </FileList>
        </div>
    );
}

export default FileAttachment;
