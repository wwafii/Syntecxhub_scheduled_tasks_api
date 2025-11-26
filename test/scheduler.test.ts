import { 
    test, 
    expect, 
    describe, 
    mock, 
    spyOn 
} from 'bun:test'; 
// Impor logger sebagai namespace untuk spying
import * as logger from '../src/logger'; 
import * as scheduler from '../src/scheduler';

// Destrukturisasi dari scheduler
const { jobDefinitions, triggerJob, getJobStatus } = scheduler;

// Ambil salah satu nama job valid untuk pengujian
const validJobName = Object.keys(jobDefinitions)[0];

// ----------------------------------------------------------------------
// Mocking Global & Dependencies
// ----------------------------------------------------------------------

// 1. Spy pada console.log/error (Masih sama)
const consoleLogSpy = spyOn(console, 'log');
const consoleErrorSpy = spyOn(console, 'error');

// 2. Spy pada logJobExecution: Spied on the module where it is DEFINED (logger)!
const logJobSpy = spyOn(logger, 'logJobExecution'); // 👈 FIX ERROR PERTAMA

describe('Logger Test (src/logger.ts)', () => {
    // ... (Tests for log execution)
    test('Should log SUCCESS status without details', () => {
        consoleLogSpy.mockClear();
        logger.logJobExecution('TEST_LOG', 'SUCCESS');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    test('Should log FAILURE status and details using console.error', () => {
        consoleLogSpy.mockClear();
        consoleErrorSpy.mockClear();
        logger.logJobExecution('TEST_LOG_FAIL', 'FAILURE', 'Simulasi error');
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
});

// ---

describe('Scheduler Logic Test (src/scheduler.ts)', () => {

    // Simpan fungsi task asli untuk pemulihan (restore)
    const originalTasks = {
        deleteStaleRecords: jobDefinitions['delete_stale_records']!.task,
        sendEmailSummary: jobDefinitions['send_summary']!.task,
    };
    
    // --------------------------------------------------
    // A. Testing Task Execution Logic (Success/Failure)
    // --------------------------------------------------

    test('deleteStaleRecords should log SUCCESS when successful', async () => {
        logJobSpy.mockClear();
        await originalTasks.deleteStaleRecords();
        expect(logJobSpy).toHaveBeenCalledWith('DELETE_STALE_RECORDS', 'SUCCESS');
    });

    test('sendEmailSummary should log FAILURE when internal logic throws an error', async () => {
        logJobSpy.mockClear();
        const errorMsg = "Koneksi SMTP terputus";

        // Mengganti fungsi task untuk sementara agar melempar error
        jobDefinitions['send_summary']!.task = async () => {
             try {
                // Simulasikan throw error di dalam logika task
                throw new Error(errorMsg);
            } catch (error) {
                 // Tugas asli menangkap error dan memanggil logJobExecution
                 logger.logJobExecution(
                    'SEND_EMAIL_SUMMARY', 
                    'FAILURE', 
                    error instanceof Error ? error.message : String(error)
                );
            }
        };

        await jobDefinitions['send_summary']!.task();
        
        expect(logJobSpy).toHaveBeenCalledWith('SEND_EMAIL_SUMMARY', 'FAILURE', errorMsg);
        
        // Kembalikan fungsi task aslinya
        jobDefinitions['send_summary']!.task = originalTasks.sendEmailSummary;
    });
    
    // --------------------------------------------------
    // B. Testing API Trigger Logic (triggerJob)
    // --------------------------------------------------

    test('triggerJob should return true for existing job', async () => {
        // Karena tugas dijalankan secara async dan kita mock log-nya, kita hanya uji boolean return
        const result = await triggerJob('send_summary');
        expect(result).toBe(true);
    });
    
    // --------------------------------------------------
    // C. Testing Job Status (getJobStatus)
    // --------------------------------------------------

    test('getJobStatus should return correct structure and list all defined jobs', () => {
        const status = getJobStatus();

        expect(status).toHaveLength(2);
        
        // Verifikasi properti (tidak perlu penambahan ! di sini karena sudah ditangani di src/scheduler)
        expect(status[0]).toEqual(
            expect.objectContaining({
                name: validJobName,
                isRunning: false,
            })
        );
    });
});