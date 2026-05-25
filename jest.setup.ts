// Jest setup — mocks for Expo native modules so component + hook tests
// can run without a device. Loaded via the `setupFilesAfterEach` config.

// expo-camera: provide useCameraPermissions hook + CameraView stub.
jest.mock("expo-camera", () => {
  const React = require("react");
  return {
    __esModule: true,
    useCameraPermissions: jest.fn(() => [
      { granted: true, status: "granted" },
      jest.fn(async () => ({ granted: true, status: "granted" })),
    ]),
    CameraView: React.forwardRef(({ children, ...rest }: any, ref: any) => {
      const { View } = require("react-native");
      return React.createElement(View, { ...rest, ref, testID: "camera-view" }, children);
    }),
  };
});

// expo-sensors: provide Accelerometer with addListener/setUpdateInterval/etc.
jest.mock("expo-sensors", () => {
  let listener: ((sample: { x: number; y: number; z: number }) => void) | null = null;
  return {
    __esModule: true,
    Accelerometer: {
      isAvailableAsync: jest.fn(async () => true),
      setUpdateInterval: jest.fn(),
      addListener: jest.fn((cb: typeof listener) => {
        listener = cb;
        return { remove: jest.fn(() => { listener = null; }) };
      }),
      removeAllListeners: jest.fn(() => { listener = null; }),
      // Test helper to emit a sample.
      __emit: (sample: { x: number; y: number; z: number }) => {
        listener?.(sample);
      },
    },
  };
});

// expo-location: provide permission + position helpers.
jest.mock("expo-location", () => {
  return {
    __esModule: true,
    Accuracy: { Balanced: 3 },
    getForegroundPermissionsAsync: jest.fn(async () => ({ granted: true, status: "granted" })),
    requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true, status: "granted" })),
    hasServicesEnabledAsync: jest.fn(async () => true),
    getCurrentPositionAsync: jest.fn(async () => ({
      coords: { latitude: 30.27, longitude: -97.74 },
    })),
  };
});

// react-native Linking — used by openAppSettings.
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openSettings: jest.fn(async () => {}),
}));

// AsyncStorage — in-memory mock for persistence tests.
jest.mock("@react-native-async-storage/async-storage", () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: jest.fn(async (k: string) => {
        delete store[k];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

// react-native-safe-area-context: render children directly without waiting
// for native frame measurements (which never arrive in jest).
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 320, height: 640 };
  return {
    __esModule: true,
    SafeAreaProvider: ({ children }: any) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children, ...rest }: any) =>
      React.createElement(View, rest, children),
    SafeAreaInsetsContext: { Consumer: ({ children }: any) => children(inset) },
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

// Note: silencing per-test console.log lives in individual test files if needed.
// `setupFiles` runs before the jest test framework loads, so beforeEach/
// afterEach are not available here — only `jest.mock()` and module setup.
