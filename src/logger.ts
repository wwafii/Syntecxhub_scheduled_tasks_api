export const logJobExecution = (
  jobName: string,
  status: 'SUCCESS' | 'FAILURE',
  details?: string
) => {
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] JOB: ${jobName} | STATUS: ${status}`);
  if (details) {
    console.error(`  DETAILS: ${details}`);
  }
};