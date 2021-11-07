import Lifx from 'node-lifx-lan';
import scheduler from 'node-schedule';
import pino from 'pino';

const logger = pino();

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

    return `Rule ${cronLike}`;
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
    rule: new Rule({ hour: 9, minute: 0, tz: 'Europe/Moscow' }),
    fn: async () => {
      logger.info('switching lights on');
      await Lifx.turnOnFilter({
        filters,
        color,
        duration,
      });
    },
  },
  {
    rule: new Rule({ hour: 11, minute: 0, tz: 'Europe/Moscow' }),
    fn: async () => {
      logger.info('switching lights off');
      await Lifx.turnOffFilter({
        filters,
        color,
        duration,
      });
    },
  },
];

(async () => {
  const deviceList = await Lifx.discover();
  console.log(deviceList.map(e => e.deviceInfo.label));

  for (const { rule, fn } of jobs) {
    logger.info(rule.toString());
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
