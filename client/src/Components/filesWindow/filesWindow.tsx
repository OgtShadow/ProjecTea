import React from 'react';
import apiFetch from '../../api';

function FilesWindow() {
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

  const handleFileClick = async (fileId: string) => {
    try {
      const response = await apiFetch(`/api/files/download/${fileId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = decodeURIComponent(fileId);
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Nie udało się pobrać pliku:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await apiFetch(`/api/files`);
      const data = await response.json();

      if (response.ok && data.files) {
        return data.files;
      }
      return [];
    } catch (error) {
      console.error('Nie udało się pobrać listy plików:', error);
      return [];
    }
  };

  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadFiles().then(setFiles);
    setLoading(false);
  }, []);

  type FileInfo = {
    name: string;
    size: number;
    uploadAt: Date;
  };

  const formatSize = (size: number): string => {
    return `${(size / 1024).toFixed(1)} KB`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="files-window">
      <h2>Uploaded Files</h2>
      {loading ? (
        <p>Ładowanie plików...</p>
      ) : files.length > 0 ? (
        <div className="files-grid">
          {files.map((file) => (
            <div
              key={file.name}
              className="file-item"
              onClick={() => handleFileClick(file.name)}
            >
              <span className="file-icon">{getFileIcon(file.name)}</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatSize(file.size)}</span>
              <span className="file-date">{formatDate(file.uploadAt)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-files">Brak plików lub błąd pobierania.</p>
      )}
    </div>
  );
}

export default FilesWindow