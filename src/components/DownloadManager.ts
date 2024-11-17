import fs from 'fs';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

type Download = {
  id: string;
  url: string;
  status: 'in-progress' | 'paused' | 'completed' | 'cancelled' | 'failed';
  progress: number; // indirilen veri miktarı (byte)
  total: number; // toplam dosya boyutu (byte)
  speed: number; // KB/s
  remainingTime: number; // saniye
  stream: fs.WriteStream;
  startTime: number; // zaman damgası (başlangıç)
  lastUpdateTime: number; // zaman damgası (son güncelleme)
};

const downloads: Record<string, Download> = {};

export async function download(url: string, dest: string): Promise<{ id: string }> {
  const id = uuidv4();
  const writeStream = fs.createWriteStream(dest);

  const response = await fetch(url);
  const total = Number(response.headers.get('content-length')) || 0;

  downloads[id] = {
    id,
    url,
    status: 'in-progress',
    progress: 0,
    total,
    speed: 0,
    remainingTime: 0,
    stream: writeStream,
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
  };

  response.body?.pipe(writeStream);

  response.body?.on('data', (chunk) => {
    const now = Date.now();
    const download = downloads[id];

    if (download) {
      download.progress += chunk.length;
      const elapsed = (now - download.lastUpdateTime) / 1000; // saniye cinsinden geçen süre
      download.speed = Math.round((chunk.length / 1024) / elapsed); // KB/s
      download.remainingTime = Math.round(
        (download.total - download.progress) / (download.speed * 1024)
      );
      download.lastUpdateTime = now;
    }
  });

  return new Promise((resolve, reject) => {
    response.body?.on('end', () => {
      downloads[id].status = 'completed';
      resolve({ id });
    });

    response.body?.on('error', (error) => {
      downloads[id].status = 'failed';
      reject(error);
    });
  });
}

export function pause(id: string): void {
  const download = downloads[id];
  if (download) {
    download.stream.pause();
    download.status = 'paused';
  }
}

export function resume(id: string): void {
  const download = downloads[id];
  if (download) {
    download.stream.resume();
    download.status = 'in-progress';
  }
}

export function cancel(id: string): void {
  const download = downloads[id];
  if (download) {
    download.stream.destroy();
    download.status = 'cancelled';
    delete downloads[id];
  }
}
