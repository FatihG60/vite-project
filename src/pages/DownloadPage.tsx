import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

type Download = {
  id: string;
  url: string;
  status: string;
  progress: number; // byte olarak
  total: number; // byte olarak
  speed: number; // KB/s
  remainingTime: number; // saniye
};

const App: React.FC = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [inputURL, setInputURL] = useState('');
  const toast = useRef<any>(null);

  const startDownload = async (url: string) => {
    if (!url) {
      toast.current.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'URL boş olamaz!',
      });
      return;
    }

    const dest = `downloads/${url.split('/').pop()}`;
    const { id } = await window.electronAPI.startDownload({ url, dest });

    setDownloads([
      ...downloads,
      {
        id,
        url,
        status: 'in-progress',
        progress: 0,
        total: 0,
        speed: 0,
        remainingTime: 0,
      },
    ]);
  };

  const handlePause = (id: string) => {
    window.electronAPI.pauseDownload(id);
    updateDownloadStatus(id, 'paused');
  };

  const handleResume = (id: string) => {
    window.electronAPI.resumeDownload(id);
    updateDownloadStatus(id, 'in-progress');
  };

  const handleCancel = (id: string) => {
    window.electronAPI.cancelDownload(id);
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDownloadStatus = (id: string, status: string) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d))
    );
  };

  // Güncellemeler için Backend'den veri alınması
  useEffect(() => {
    const interval = setInterval(async () => {
      const updatedDownloads = await window.electronAPI.getDownloadStatuses();
      setDownloads(updatedDownloads);
    }, 1000); // Her saniye veri alınır

    return () => clearInterval(interval);
  }, []);

  const progressBodyTemplate = (rowData: Download) => {
    const percentage = Math.round((rowData.progress / rowData.total) * 100);
    return (
      <div>
        <ProgressBar value={percentage} />
        <small>{`${percentage || 0}%`}</small>
      </div>
    );
  };

  const speedBodyTemplate = (rowData: Download) => {
    return <span>{`${rowData.speed} KB/s`}</span>;
  };

  const timeBodyTemplate = (rowData: Download) => {
    const minutes = Math.floor(rowData.remainingTime / 60);
    const seconds = rowData.remainingTime % 60;
    return <span>{`${minutes} dk ${seconds} sn`}</span>;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Toast ref={toast} />
      <h2>Dosya İndirme Yöneticisi</h2>

      <div className="p-inputgroup" style={{ marginBottom: '1rem' }}>
        <InputText
          value={inputURL}
          onChange={(e) => setInputURL(e.target.value)}
          placeholder="İndirme URL'si"
        />
        <Button
          label="İndir"
          icon="pi pi-download"
          onClick={() => startDownload(inputURL)}
        />
      </div>

      <DataTable
        value={downloads}
        paginator
        rows={5}
        emptyMessage="Henüz indirme yapılmadı."
        responsiveLayout="scroll"
      >
        <Column field="url" header="URL" style={{ wordWrap: 'break-word' }} />
        <Column
          header="İlerleme"
          body={progressBodyTemplate}
          style={{ minWidth: '10rem' }}
        />
        <Column header="Hız" body={speedBodyTemplate} style={{ minWidth: '8rem' }} />
        <Column
          header="Kalan Süre"
          body={timeBodyTemplate}
          style={{ minWidth: '8rem' }}
        />
        <Column
          header="İşlemler"
          body={(rowData) => (
            <>
              <Button
                icon="pi pi-pause"
                className="p-button-rounded p-button-text"
                onClick={() => handlePause(rowData.id)}
              />
              <Button
                icon="pi pi-play"
                className="p-button-rounded p-button-text"
                onClick={() => handleResume(rowData.id)}
              />
              <Button
                icon="pi pi-times"
                className="p-button-rounded p-button-text p-button-danger"
                onClick={() => handleCancel(rowData.id)}
              />
            </>
          )}
          style={{ minWidth: '8rem' }}
        />
      </DataTable>
    </div>
  );
};

export default App;
