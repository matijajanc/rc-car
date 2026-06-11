import { loadConfig } from './config';
import { CarLink } from './link';
import { SerialCarLink } from './serial';
import { CarSimulator } from './simulator';
import { startBridge } from './server';

async function main(): Promise<void> {
  const config = loadConfig();

  const link: CarLink = config.simulate
    ? new CarSimulator()
    : new SerialCarLink({ path: config.serialPath, baudRate: config.serialBaud });

  if (config.simulate) {
    console.log('[server] SIMULATE mode — no hardware required.');
  } else {
    console.log(`[server] serial mode — ${config.serialPath} @ ${config.serialBaud} baud`);
  }

  const bridge = await startBridge(config, link);

  const shutdown = (signal: string): void => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    bridge
      .close()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        console.error('[server] error during shutdown:', error);
        process.exit(1);
      });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  console.error('[server] failed to start:', error);
  process.exit(1);
});
