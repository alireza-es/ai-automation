import { isWrapsDriver, type IWebDriver } from "./types.js";

/**
 * Safely resolves the base (innermost) driver from any IWebDriver, including
 * wrapper implementations such as EventFiringWebDriver.
 *
 * ### Before the fix
 * Helper functions throughout the test suite performed a direct cast:
 *
 * ```ts
 * // ❌ Throws InvalidCastException when driver is an EventFiringWebDriver
 * const wd = driver as ConcreteWebDriver;
 * ```
 *
 * ### After the fix
 * Code that genuinely needs the underlying concrete driver calls this function,
 * which peels off any decorator layers via the `IWrapsDriver` contract:
 *
 * ```ts
 * // ✅ Works for both plain drivers and wrapped drivers
 * const wd = resolveBaseDriver(driver);
 * ```
 *
 * Most helpers should instead accept `IWebDriver` directly and avoid touching
 * the concrete type altogether.
 *
 * @param driver Any IWebDriver instance, possibly wrapped.
 * @returns The innermost (unwrapped) driver.
 */
export function resolveBaseDriver(driver: IWebDriver): IWebDriver {
  let current: IWebDriver = driver;
  // Peel off wrapper layers (e.g. EventFiringWebDriver → ChromeDriver)
  while (isWrapsDriver(current)) {
    current = current.getWrappedDriver();
  }
  return current;
}

/**
 * Return true when `driver` is – or wraps – an instance of the given class.
 *
 * Use this instead of `driver instanceof ConcreteClass` so that wrapper drivers
 * are handled transparently.
 *
 * @example
 * ```ts
 * if (driverIs(driver, ChromeDriver)) { ... }
 * ```
 */
export function driverIs<T extends IWebDriver>(
  driver: IWebDriver,
  ctor: new (...args: never[]) => T,
): driver is T {
  return resolveBaseDriver(driver) instanceof ctor;
}
