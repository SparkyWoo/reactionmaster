import * as Haptics from 'expo-haptics';

export enum GameErrorType {
  INVALID_REACTION = 'invalid_reaction',
  INVALID_DIMENSIONS = 'invalid_dimensions',
  INVALID_INPUT = 'invalid_input',
  GAME_INTERRUPTED = 'game_interrupted',
  NETWORK_ERROR = 'network_error',
}

export interface GameError {
  type: GameErrorType;
  message: string;
  metadata?: Record<string, unknown>;
}

interface ErrorHandlerOptions {
  showFeedback?: boolean;
  logError?: boolean;
}

export function handleGameError(
  error: GameError,
  options: ErrorHandlerOptions = { showFeedback: true, logError: true }
): void {
  // Always log errors in development
  if (__DEV__ || options.logError) {
    console.warn(
      `Game Error: [${error.type}] ${error.message}`,
      error.metadata ?? {}
    );
  }

  // Provide haptic feedback for user-facing errors
  if (options.showFeedback) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  // Handle specific error types
  switch (error.type) {
    case GameErrorType.INVALID_REACTION:
      // Invalid reactions are expected during gameplay
      // Just provide feedback, no need for additional handling
      break;

    case GameErrorType.INVALID_DIMENSIONS:
      // Log screen dimensions for debugging
      if (__DEV__) {
        console.warn('Invalid dimensions:', error.metadata);
      }
      break;

    case GameErrorType.GAME_INTERRUPTED:
      // Could trigger game reset or cleanup
      break;

    case GameErrorType.NETWORK_ERROR:
      // Could trigger retry logic or offline mode
      break;

    default:
      // Unknown errors should always be logged
      console.error('Unhandled game error:', error);
  }
}

// Helper function to create typed game errors
export function createGameError(
  type: GameErrorType,
  message: string,
  metadata?: Record<string, unknown>
): GameError {
  return { type, message, metadata };
} 