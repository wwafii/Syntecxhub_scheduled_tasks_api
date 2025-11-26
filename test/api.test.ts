import { 
    test, 
    expect, 
    describe, 
    spyOn,     // Diimpor untuk fungsi spying
    beforeEach // Diimpor untuk fungsi hook
} from 'bun:test'; 
import app from '../src/index'; 
import * as scheduler from '../src/scheduler';

// Ambil salah satu nama job valid untuk pengujian
const validJobName = Object.keys(scheduler.jobDefinitions)[0]; 

describe('Hono API Endpoints Test', () => {
    
    // Spy pada triggerJob untuk mengisolasi tes dari eksekusi task sebenarnya
    const triggerJobSpy = spyOn(scheduler, 'triggerJob');
    
    beforeEach(() => {
        triggerJobSpy.mockClear();
        // Atur agar mock triggerJob mengembalikan true atau false sesuai keberadaan nama job
        triggerJobSpy.mockImplementation((name) => {
            return Promise.resolve(Object.keys(scheduler.jobDefinitions).includes(name));
        });
    });

    // ----------------------------------------------------
    // TEST 1: GET /jobs (Listing Job Status)
    // ----------------------------------------------------
    test('GET /jobs should return 200 and list all scheduled jobs', async () => {
        const req = new Request('http://localhost/jobs', { method: 'GET' });
        const res = await app.request(req);
        const data: any = await res.json(); 

        expect(res.status).toBe(200);
        expect(data.jobs).toHaveLength(Object.keys(scheduler.jobDefinitions).length);
        expect(data.jobs[0]).toEqual(
            expect.objectContaining({
                name: validJobName,
                isRunning: expect.any(Boolean),
            })
        );
    });

    // ----------------------------------------------------
    // TEST 2: POST /jobs/:name/trigger (Sukses)
    // ----------------------------------------------------
    test('POST /jobs/:name/trigger should return 200 and trigger the job manually', async () => {
        const req = new Request(`http://localhost/jobs/${validJobName}/trigger`, { method: 'POST' });
        const res = await app.request(req);
        const data: any = await res.json();

        expect(res.status).toBe(200);
        expect(triggerJobSpy).toHaveBeenCalledWith(validJobName); 
        expect(data.message).toContain(`Job '${validJobName}' berhasil dipicu secara manual.`);
    });
    
    // ----------------------------------------------------
    // TEST 3: POST /jobs/:name/trigger (Job Tidak Ada)
    // ----------------------------------------------------
    test('POST /jobs/:name/trigger should return 404 for non-existent job', async () => {
        const invalidJobName = 'non_existent_job';
        
        const req = new Request(`http://localhost/jobs/${invalidJobName}/trigger`, { method: 'POST' });
        const res = await app.request(req);
        const data: any = await res.json();

        expect(res.status).toBe(404);
        expect(triggerJobSpy).toHaveBeenCalledWith(invalidJobName);
        expect(data.error).toContain(`Job '${invalidJobName}' tidak ditemukan.`);
    });
});