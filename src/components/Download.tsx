import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';

interface Download {
  progress: number;
  isPaused: boolean;
}

const Download: React.FC = () => {
  const [downloads, setDownloads] = useState<Record<string, Download>>({});
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (!window.ipcRenderer) return;

    window.ipcRenderer.on('download-start', (event, downloadId: string) => {
      setDownloads((prevDownloads) => ({
        ...prevDownloads,
        [downloadId]: { progress: 0, isPaused: false },
      }));
    });

    window.ipcRenderer.on(
      'download-progress',
      (event, { downloadId, receivedBytes, totalBytes }: { downloadId: string; receivedBytes: number; totalBytes: number }) => {
        const percent = totalBytes ? Math.round((receivedBytes / totalBytes) * 100) : 0;
        setDownloads((prevDownloads) => ({
          ...prevDownloads,
          [downloadId]: { ...prevDownloads[downloadId], progress: percent },
        }));
      }
    );

    window.ipcRenderer.on('download-complete', (event, { downloadId, savePath }) => {
      toast.current?.show({ severity: 'success', summary: 'İndirme Tamamlandı', detail: `Dosya: ${savePath}` });
      setDownloads((prevDownloads) => {
        const updatedDownloads = { ...prevDownloads };
        delete updatedDownloads[downloadId];
        return updatedDownloads;
      });
    });

    window.ipcRenderer.on('download-cancelled', (event, downloadId: string) => {
      toast.current?.show({ severity: 'warn', summary: 'İndirme İptal Edildi' });
      setDownloads((prevDownloads) => {
        const updatedDownloads = { ...prevDownloads };
        delete updatedDownloads[downloadId];
        return updatedDownloads;
      });
    });

    window.ipcRenderer.on('download-error', (event, message: string) => {
      toast.current?.show({ severity: 'error', summary: 'İndirme Hatası', detail: message });
    });

    window.ipcRenderer.on('download-status', (event, { downloadId, message }) => {
      toast.current?.show({ severity: 'info', summary: message });
    });
  }, []);

  const downloadFile = (url: string) => {
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('download-file', url);
    }
  };

  const handlePause = (downloadId: string) => {
    if (window.ipcRenderer && downloads[downloadId]) {
      window.ipcRenderer.send(`pause-download-${downloadId}`);
      setDownloads((prevDownloads) => ({
        ...prevDownloads,
        [downloadId]: { ...prevDownloads[downloadId], isPaused: true },
      }));
    }
  };

  const handleResume = (downloadId: string) => {
    if (window.ipcRenderer && downloads[downloadId]) {
      window.ipcRenderer.send(`resume-download-${downloadId}`);
      setDownloads((prevDownloads) => ({
        ...prevDownloads,
        [downloadId]: { ...prevDownloads[downloadId], isPaused: false },
      }));
    }
  };

  const handleCancel = (downloadId: string) => {
    if (window.ipcRenderer && downloads[downloadId]) {
      window.ipcRenderer.send(`cancel-download-${downloadId}`);
    }
  };

  return (
    <div className="App">
      <Toast ref={toast} />
      <h2>Dosya İndirici</h2>
      <Button
        label="İndir"
        icon="pi pi-download"
        onClick={() => downloadFile('https://file-examples.com/storage/fef4e75e176737761a179bf/2017/04/file_example_MP4_1920_18MG.mp4')}
      />
      <div style={{ marginTop: '20px' }}>
        {Object.keys(downloads).map((downloadId) => (
          <div key={downloadId} className="download-item">
            {downloads[downloadId].progress >= 0 && <ProgressBar value={downloads[downloadId].progress} />}
            <div className="button-group">
              <Button
                label={downloads[downloadId].isPaused ? 'Devam Ettir' : 'Duraklat'}
                icon={`pi ${downloads[downloadId].isPaused ? 'pi-play' : 'pi-pause'}`}
                onClick={() =>
                  downloads[downloadId].isPaused ? handleResume(downloadId) : handlePause(downloadId)
                }
              />
              <Button label="İptal Et" icon="pi pi-times" onClick={() => handleCancel(downloadId)} className="p-button-danger" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Download;
