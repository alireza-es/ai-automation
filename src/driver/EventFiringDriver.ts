import type { IEventFiringDriver, IWebDriver } from "./IWebDriver.js";

/**
 * EventFiringDriver wraps any IWebDriver implementation and decorates each
 * navigation call with before/after event hooks.
 *
 * ### Why this class exists
 * The Selenium .NET binding used to expose `EventFiringWebDriver`, a concrete
 * class that wraps an `IWebDriver`. Code that subsequently tried to cast the
 * wrapper back to a concrete driver type (e.g. `(WebDriver) driver`) threw:
 *
 *   System.InvalidCastException: Unable to cast object of type
 *   'OpenQA.Selenium.Support.Events.EventFiringWebDriver' to type
 *   'OpenQA.Selenium.WebDriver'
 *
 * This TypeScript implementation avoids the problem by:
 * 1. Accepting and returning the `IWebDriver` / `IEventFiringDriver`
 *    **interface** everywhere — never a concrete class.
 * 2. Exposing a `wrappedDriver` property so callers that genuinely need the
 *    underlying driver can retrieve it without an unsafe cast.
 */
export class EventFiringDriver implements IEventFiringDriver {
  readonly wrappedDriver: IWebDriver;

  private readonly onBeforeGet: (url: string) => void;
  private readonly onAfterGet: (url: string) => void;

  constructor(
    driver: IWebDriver,
    options: {
      onBeforeGet?: (url: string) => void;
      onAfterGet?: (url: string) => void;
    } = {}
  ) {
    this.wrappedDriver = driver;
    this.onBeforeGet = options.onBeforeGet ?? (() => undefined);
    this.onAfterGet = options.onAfterGet ?? (() => undefined);
  }

  async get(url: string): Promise<void> {
    this.onBeforeGet(url);
    await this.wrappedDriver.get(url);
    this.onAfterGet(url);
  }

  getCurrentUrl(): Promise<string> {
    return this.wrappedDriver.getCurrentUrl();
  }

  getTitle(): Promise<string> {
    return this.wrappedDriver.getTitle();
  }

  executeScript(script: string, ...args: unknown[]): Promise<unknown> {
    return this.wrappedDriver.executeScript(script, ...args);
  }

  quit(): Promise<void> {
    return this.wrappedDriver.quit();
  }
}

/**
 * Unwrap a driver that may or may not be an EventFiringDriver.
 *
 * Returns the innermost `IWebDriver` instance, stripping all
 * EventFiringDriver layers.  This is the safe alternative to an explicit
 * cast: instead of `(WebDriver) driver` use `unwrapDriver(driver)`.
 *
 * @param driver - Any IWebDriver, possibly wrapped inside EventFiringDriver.
 * @returns The concrete driver at the core of the wrapper chain.
 */
export function unwrapDriver(driver: IWebDriver): IWebDriver {
  let current = driver;
  while (isEventFiringDriver(current)) {
    current = current.wrappedDriver;
  }
  return current;
}

/**
 * Type guard that checks whether a driver is an IEventFiringDriver.
 */
export function isEventFiringDriver(
  driver: IWebDriver
): driver is IEventFiringDriver {
  return (
    typeof (driver as IEventFiringDriver).wrappedDriver !== "undefined"
  );
}
