import Lifx from 'node-lifx-lan';
import scheduler from 'node-schedule';

const filters = [{
  group: {label: 'Bedroom',}
}];

const color = {css: 'white'};

const duration = 5000;

(async () => {
  const deviceList = await Lifx.discover()
  console.log(deviceList);

  const onJob = scheduler.scheduleJob({ hour: 9, minute: 47 }, async () => {
    console.log('switching lights on')
    await Lifx.turnOnFilter({
      filters,
      color,
      duration,
    });
  });

  const offJob = scheduler.scheduleJob({ hour: 9, minute: 49 }, async () => {
    console.log('switching lights off')
    await Lifx.turnOffFilter({
      filters,
      color,
      duration,
    });
  });

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, () => {
      console.log('exiting');
      Lifx.destroy();
      onJob.cancel();
      offJob.cancel();
    });
  });
})()

