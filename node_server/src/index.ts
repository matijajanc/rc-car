import { loadConfig } from './config';
import { CarLink } from './link';
import { Logger } from './logger';
import { SerialCarLink } from './serial';
import { CarSimulator } from './simulator';
import { startBridge } from './server';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = new Logger({ level: config.logLevel, dir: config.logDir });

  const link: CarLink = config.simulate
    ? new CarSimulator({ logger: (message) => logger.debug('sim', 'event', { msg: message }) })
    : new SerialCarLink({ path: config.serialPath, baudRate: config.serialBaud });

  logger.info('server', 'starting', {
    simulate: config.simulate,
    serialPath: config.simulate ? undefined : config.serialPath,
    logDir: config.logDir,
  });

  const bridge = await startBridge(config, link, { logger });

  const shutdown = (signal: string): void => {
    logger.info('server', 'shutdown', { signal });
    bridge
      .close()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        logger.error('server', 'shutdown_error', { msg: String(error) });
        process.exit(1);
      });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  // The logger may not exist yet if config/instantiation failed.
  console.error('[server] failed to start:', error);
  process.exit(1);
});
