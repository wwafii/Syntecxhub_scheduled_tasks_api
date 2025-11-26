// Ganti baris impor Anda dengan ini:
import * as cron from 'node-cron'; 
import { type ScheduledTask } from 'node-cron'; // Impor tipe secara terpisah
import { logJobExecution } from './logger';
// ...
// ---------------------------
// 1. DEFINISI TASK UTAMA
// ---------------------------

const deleteStaleRecords = async () => {
  const jobName = 'DELETE_STALE_RECORDS';
  try {
    console.log(`[TASK] Menjalankan ${jobName}...`);
    // --- Logika menghapus data basi Anda di sini ---
    await new Promise(resolve => setTimeout(resolve, 500)); 
    // ---------------------------------------------
    
    logJobExecution(jobName, 'SUCCESS');
  } catch (error) {
    // Error Catching: Mengambil pesan error secara aman
    logJobExecution(jobName, 'FAILURE', error instanceof Error ? error.message : String(error));
  }
};

const sendEmailSummary = async () => {
  const jobName = 'SEND_EMAIL_SUMMARY';
  try {
    console.log(`[TASK] Menjalankan ${jobName}...`);
    // --- Logika mengirim email summary Anda di sini ---
    await new Promise(resolve => setTimeout(resolve, 500)); 
    // ------------------------------------------------
    
    logJobExecution(jobName, 'SUCCESS');
  } catch (error) {
    logJobExecution(jobName, 'FAILURE', error instanceof Error ? error.message : String(error));
  }
};


// ---------------------------
// 2. LOGIKA SCHEDULER
// ---------------------------

export const jobDefinitions: Record<string, { schedule: string, task: () => Promise<void> }> = {
  // Contoh 1: Hapus data basi setiap hari pada jam 02:00:00
  'delete_stale_records': {
    schedule: '0 0 2 * * *', 
    task: deleteStaleRecords,
  },
  // Contoh 2: Kirim ringkasan email setiap 5 menit
  'send_summary': {
    schedule: '0 */5 * * * *', 
    task: sendEmailSummary,
  },
};

// Menggunakan tipe ScheduledTask yang diimpor dari node-cron
const scheduledTasks: Record<string, ScheduledTask> = {}; 

/**
 * Memulai penjadwal dan menjadwalkan semua job.
 */
export const startScheduler = () => {
  console.log('Scheduler dimulai. Menjadwalkan tugas...');
  
  // Menggunakan Object.keys() untuk iterasi yang aman dan tidak menghasilkan 'possibly undefined'
  for (const jobName of Object.keys(jobDefinitions)) {
    const def = jobDefinitions[jobName]!;
    
    const task = cron.schedule(def.schedule, () => {
      console.log(`[CRON] Memicu tugas terjadwal: ${jobName}`);
      def.task();
    }, { scheduled: true, runOnInit: false } as any);
    
    scheduledTasks[jobName] = task;
    console.log(`  - Job '${jobName}' dijadwalkan dengan interval: ${def.schedule}`);
  }
};

/**
 * Memicu job secara manual dan langsung mengeksekusinya.
 */
export const triggerJob = async (jobName: string): Promise<boolean> => {
  const job = jobDefinitions[jobName];
  if (job) {
    console.log(`[MANUAL] Memicu job: ${jobName}`);
    await job.task();
    return true;
  }
  return false;
};

/**
 * Mendapatkan status job untuk API listing.
 */
export const getJobStatus = () => {
  return Object.keys(jobDefinitions).map(name => {
    // 👈 Gunakan Non-Null Assertion di sini:
    const jobDef = jobDefinitions[name]!; 
    
    // Menggunakan Optional Chaining (?) sudah benar untuk scheduledTasks[name]
    const isRunning = scheduledTasks[name]?.getStatus() === 'running';

    return {
      name: name,
      schedule: jobDef.schedule, // 👈 Akses properti dari variabel yang sudah dijamin
      isRunning: isRunning,
    };
  });
};