import { Hono } from 'hono';
import { startScheduler, getJobStatus, triggerJob } from './scheduler';

const app = new Hono();

// Endpoint untuk LIST jadwal tugas
app.get('/jobs', (c) => {
  const status = getJobStatus();
  return c.json({
    message: 'Daftar tugas terjadwal',
    jobs: status,
  });
});

// Endpoint untuk TRIGGER tugas secara manual
app.post('/jobs/:name/trigger', async (c) => {
  const jobName = c.req.param('name');
  
  const success = await triggerJob(jobName);
  
  if (success) {
    return c.json({ 
      message: `Job '${jobName}' berhasil dipicu secara manual. Cek log untuk hasilnya.` 
    });
  } else {
    c.status(404);
    return c.json({ 
      error: `Job '${jobName}' tidak ditemukan.` 
    });
  }
});

// Jalankan scheduler saat aplikasi dimulai
startScheduler();

// Eksport aplikasi Hononya untuk dijalankan oleh Bun
export default app;