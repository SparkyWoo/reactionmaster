// Logger utility for Reaction Master
// Only logs in development mode for better performance in production

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type GameComponent = 'SimpleTap' | 'DirectionSwipe' | 'MovingTarget' | 'ChainReaction';

interface LogMetadata {
  component?: GameComponent;
  gameId?: number;
  timestamp?: number;
  [key: string]: any;
}

class Logger {
  private static formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = metadata?.timestamp || Date.now();
    const component = metadata?.component ? `[${metadata.component}]` : '';
    const gameId = metadata?.gameId ? `(Game ${metadata.gameId})` : '';
    return `[${new Date(timestamp).toISOString()}][${level.toUpperCase()}]${component}${gameId} ${message}`;
  }

  private static log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!__DEV__) return;

    const formattedMessage = this.formatMessage(level, message, metadata);
    const metadataObj = { ...metadata };
    delete metadataObj.component;
    delete metadataObj.gameId;
    delete metadataObj.timestamp;

    switch (level) {
      case 'debug':
        console.log(formattedMessage, Object.keys(metadataObj).length ? metadataObj : '');
        break;
      case 'info':
        console.info(formattedMessage, Object.keys(metadataObj).length ? metadataObj : '');
        break;
      case 'warn':
        console.warn(formattedMessage, Object.keys(metadataObj).length ? metadataObj : '');
        break;
      case 'error':
        console.error(formattedMessage, Object.keys(metadataObj).length ? metadataObj : '');
        break;
    }
  }

  static debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
  }

  static info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  static warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  static error(message: string, metadata?: LogMetadata): void {
    this.log('error', message, metadata);
  }

  // Game-specific logging methods
  static gameStart(component: GameComponent, gameId: number): void {
    this.info('Game started', { component, gameId });
  }

  static gameComplete(component: GameComponent, gameId: number, score: number, penalties: number): void {
    this.info('Game completed', { component, gameId, score, penalties });
  }

  static gestureDetected(component: GameComponent, gestureType: string, metadata?: LogMetadata): void {
    this.debug(`Gesture detected: ${gestureType}`, { component, ...metadata });
  }

  static gestureError(component: GameComponent, error: string, metadata?: LogMetadata): void {
    this.error(`Gesture error: ${error}`, { component, ...metadata });
  }

  static stateTransition(component: GameComponent, fromState: string, toState: string): void {
    this.debug('State transition', { component, fromState, toState });
  }
}

export default Logger; 