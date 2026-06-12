import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';

/**
 * Shared navigation ref so components rendered OUTSIDE the navigator (the
 * connection dot, which is overlaid at the app root) can still navigate.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
