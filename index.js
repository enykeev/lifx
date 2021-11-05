import Lifx from 'node-lifx-lan';
import scheduler from 'node-schedule';

class Rule extends scheduler.RecurrenceRule {
  constructor(opts) {
    super();

    for (const key in opts) {
      this[key] = opts[key];
    }
  }
}

const filters = [{
  group: {label: 'Bedroom',}
}];

const color = {css: 'white'};

const duration = 5000;

const jobs = [{
  rule: new Rule({ hour: 19, minute: 46, tz: 'Europe/Moscow' }),
  fn: async () => {
    console.log('switching lights on')
    await Lifx.turnOnFilter({
      filters,
      color,
      duration,
    });
  }
}, {
  rule: new Rule({ hour: 19, minute: 49, tz: 'Europe/Moscow' }),
  fn: async () => {
    console.log('switching lights off')
    await Lifx.turnOffFilter({
      filters,
      color,
      duration,
    });
  }
}];

(async () => {
  const deviceList = await Lifx.discover()
  console.log(deviceList.map(e => e.deviceInfo.label));

  for (const { rule, fn } of jobs) {
    scheduler.scheduleJob(rule, fn);
  }

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, () => {
      console.log('exiting');
      Lifx.destroy();
      for (const job of Object.values(scheduler.scheduledJobs)) {
        job.cancel()
      }
    });
  });
})()

