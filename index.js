import Lifx from 'node-lifx-lan';
import scheduler from 'node-schedule';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});

class Rule extends scheduler.RecurrenceRule {
  constructor(opts) {
    super();

    for (const key in opts) {
      this[key] = opts[key];
    }
  }

  toString() {
    const { year, month, date, dayOfWeek, hour, minute, second, tz } = this;
    const cronLike = [year, month, date, dayOfWeek, hour, minute, second, tz].map(e => (e != null ? e : '*')).join(' ');

    return `[Rule ${cronLike}]`;
  }
}

const filters = [
  {
    group: { label: 'Bedroom' },
  },
];

const color = { css: 'white' };

const duration = 5000;

const jobs = [
  {
    rule: new Rule({ hour: 8, minute: 0, tz: 'Europe/Moscow' }),
    fn: async () => {
      const deviceList = await Lifx.discover();
      const devices = deviceList.map(e => e.deviceInfo.label);
      logger.info(`Switching lights ON on: ${devices.join(', ')}`);
      await Lifx.turnOnFilter({
        filters,
        color,
        duration,
      });
    },
  },
  {
    rule: new Rule({ hour: 10, minute: 0, tz: 'Europe/Moscow' }),
    fn: async () => {
      const deviceList = await Lifx.discover();
      const devices = deviceList.map(e => e.deviceInfo.label);
      logger.info(`Switching lights OFF on: ${devices.join(', ')}`);
      await Lifx.turnOffFilter({
        filters,
        color,
        duration,
      });
    },
  },
];

(async () => {
  for (const { rule, fn } of jobs) {
    logger.info(`Job registered: ${rule.toString()}`);
    scheduler.scheduleJob(rule, fn);
  }

  [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, () => {
      logger.info(`Recieving ${eventType}. Exiting...`);
      Lifx.destroy();
      for (const job of Object.values(scheduler.scheduledJobs)) {
        job.cancel();
      }
    });
  });
})();
