import type { IWebDriver } from "./IWebDriver.js";

/**
 * Extension of IWebDriver that exposes the wrapped (inner) driver.
 *
 * Consumers that need the concrete driver should call `unwrapDriver` instead
 * of performing a direct cast — the pattern that previously caused
 * `InvalidCastException`.
 */
export interface IEventFiringDriver extends IWebDriver {
  readonly wrappedDriver: IWebDriver;
}

function isEventFiringDriver(
  driver: IWebDriver
): driver is IEventFiringDriver {
  return (
    typeof driver === "object" &&
    driver !== null &&
    "wrappedDriver" in driver
  );
}

/**
 * Safely unwrap any number of `EventFiringDriver` layers and return the
 * innermost concrete driver.
 *
 * This is the type-safe replacement for the invalid cast that caused
 * `System.InvalidCastException: Unable to cast object of type
 * 'OpenQA.Selenium.Support.Events.EventFiringWebDriver' to type
 * 'OpenQA.Selenium.WebDriver'`.
 */
export function unwrapDriver(driver: IWebDriver): IWebDriver {
  let current = driver;
  while (isEventFiringDriver(current)) {
    current = current.wrappedDriver;
  }
  return current;
}

/** Optional lifecycle hooks fired around navigation events. */
export interface EventFiringDriverOptions {
  onBeforeGet?: (url: string) => void;
  onAfterGet?: (url: string) => void;
}

/**
 * Decorator that wraps any `IWebDriver` and fires lifecycle hooks.
 *
 * Key design decisions that prevent the casting error:
 * - The class implements `IEventFiringDriver` (not a concrete class), so
 *   callers always work through interfaces.
 * - `wrappedDriver` is public, enabling safe unwrapping via `unwrapDriver`.
 */
export class EventFiringDriver implements IEventFiringDriver {
  readonly wrappedDriver: IWebDriver;
  private readonly onBeforeGet: (url: string) => void;
  private readonly onAfterGet: (url: string) => void;

  constructor(driver: IWebDriver, options: EventFiringDriverOptions = {}) {
    this.wrappedDriver = driver;
    this.onBeforeGet = options.onBeforeGet ?? (() => undefined);
    this.onAfterGet = options.onAfterGet ?? (() => undefined);
  }

  async get(url: string): Promise<void> {
    this.onBeforeGet(url);
    await this.wrappedDriver.get(url);
    this.onAfterGet(url);
  }

  async getTitle(): Promise<string> {
    return this.wrappedDriver.getTitle();
  }

  async quit(): Promise<void> {
    await this.wrappedDriver.quit();
  }
}
