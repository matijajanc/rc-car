import { loadConfig } from './config';
import { CarLink } from './link';
import { Logger } from './logger';
import { SerialCarLink } from './serial';
import { CarSimulator } from './simulator';
import { startBridge } from './server';

/**
 * Verbose tracing can be turned on three ways, in priority order:
 *   - `--verbose` / `-v` on the command line (e.g. `npm run dev -- --verbose`)
 *   - the bare `npm run dev --verbose` form: npm eats the flag but exposes it
 *     to the script as npm_config_loglevel=verbose
 *   - `VERBOSE=true` in the environment / .env (handled by loadConfig)
 */
function wantsVerbose(argv: string[], env: NodeJS.ProcessEnv): boolean {
  if (argv.includes('--verbose') || argv.includes('-v')) {
    return true;
  }
  return (env.npm_config_loglevel ?? '').toLowerCase() === 'verbose';
}

async function main(): Promise<void> {
  const config = loadConfig();
  const verbose = config.verbose || wantsVerbose(process.argv.slice(2), process.env);
  // Verbose implies debug-level output so the per-frame traces actually show.
  const logLevel = verbose ? 'debug' : config.logLevel;
  const logger = new Logger({ level: logLevel, dir: config.logDir });

  const link: CarLink = config.simulate
    ? new CarSimulator({ logger: (message) => logger.debug('sim', 'event', { msg: message }) })
    : new SerialCarLink({
        path: config.serialPath,
        baudRate: config.serialBaud,
        logger: (event, fields) => logger.info('serial', event, fields),
      });

  logger.info('server', 'starting', {
    simulate: config.simulate,
    serialPath: config.simulate ? undefined : config.serialPath,
    logDir: config.logDir,
    verbose,
  });

  const bridge = await startBridge(config, link, { logger, verbose });

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
