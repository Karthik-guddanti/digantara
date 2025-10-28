import cron from 'node-cron';
import parser from 'cron-parser';

class JobScheduler {
    constructor(jobService) {
        this.jobService = jobService;
        this.tasks = new Map();
    }

    scheduleJob(job) {
        const task = cron.schedule(job.schedule, async () => {
            const now = new Date();
            const nextRun = this.calculateNextRun(job.schedule);
            
            console.log(`
Job Status:
-----------
Name: ${job.job_name}
Last Run: ${now.toISOString()}
Next Run: ${nextRun.toISOString()}
-----------`);

            await this.jobService.updateNextRun(job.id, nextRun);
        });

        this.tasks.set(job.id, task);
    }

    calculateNextRun(schedule) {
        const interval = parser.parseExpression(schedule);
        return interval.next().toDate();
    }

    async start() {
        console.log('Starting job scheduler...');
        const activeJobs = await this.jobService.getActiveJobs();
        if (activeJobs && activeJobs.length > 0) {
            activeJobs.forEach(job => this.scheduleJob(job));
            console.log(`${activeJobs.length} active jobs scheduled.`);
        }
    }

    getStatus() {
        return {
            runningTasks: this.tasks.size,
            taskIds: Array.from(this.tasks.keys()),
        };
    }

    async shutdown() {
        console.log('Shutting down job scheduler...');
        this.tasks.forEach((task, jobId) => {
            task.stop();
            console.log(`Stopped task for job ID: ${jobId}`);
        });
        this.tasks.clear();
        console.log('All scheduler tasks stopped.');
    }
}

export default JobScheduler;