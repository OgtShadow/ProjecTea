function FilesWindow() {
  const files = 1;

  const fileIcons: Record<string, string> = {
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.png': '🖼️',
    '.gif': '🖼️',
    '.webp': '🖼️',
    '.pdf': '📄',
    '.txt': '📝',
    '.md': '📝',
    '.doc': '📄',
    '.docx': '📄',
    '.zip': '📦',
    '.tar': '📦',
    '.gz': '📦',
    '.mp3': '🎵',
    '.wav': '🎵',
    '.mp4': '🎬',
    '.avi': '🎬',
    '.mov': '🎬',
  };

  const getFileIcon = (filename: string): string => {
    const extension = '.' + filename.split('.').pop()?.toLowerCase();
    return fileIcons[extension] || '📁';
  };

  const handleFileClick = (file: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([file]));
    link.download = file;
    link.click();
  };

  return (
    <div className="files-window">
      <h2>Uploaded Files</h2>
      {files ? (
        <div className="files-grid">
          <div className="file-item" onClick={() => handleFileClick('file.txt')}>
            <span className="file-icon">{getFileIcon('file.txt')}</span>
            <span className="file-name">file.txt</span>
            <span className="file-size">0 KB</span>
          </div>
        </div>
      ) : (
        <p className="no-files">No files found in uploads directory.</p>
      )}
    </div>
  );
}

export default FilesWindow
