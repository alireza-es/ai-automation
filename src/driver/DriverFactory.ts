import type { IWebDriver } from "./IWebDriver.js";
import {
  EventFiringDriver,
  unwrapDriver,
  type EventFiringDriverOptions,
} from "./EventFiringDriver.js";

/** Browser types supported by the factory. */
export type BrowserType = "chrome" | "firefox" | "edge";

export interface DriverFactoryOptions {
  /** When `true` the driver is wrapped in an `EventFiringDriver`. */
  useEventFiring?: boolean;
  /** Browser to launch (default: `"chrome"`). */
  browser?: BrowserType;
  /**
   * Inject a pre-built driver instead of launching a real browser.
   * Useful in unit tests.
   */
  driverOverride?: IWebDriver;
  /** Hooks forwarded to `EventFiringDriver` when `useEventFiring` is true. */
  eventHooks?: EventFiringDriverOptions;
}

/**
 * Central place for creating and managing `IWebDriver` instances.
 *
 * ## Why this fixes the casting error
 *
 * The previous failure was:
 * ```
 * System.InvalidCastException: Unable to cast object of type
 * 'OpenQA.Selenium.Support.Events.EventFiringWebDriver'
 * to type 'OpenQA.Selenium.WebDriver'.
 * ```
 *
 * The factory eliminates the need for any cast by:
 * 1. **Always returning `IWebDriver`** – callers never hold a concrete type.
 * 2. **Providing `getUnwrappedDriver()`** – when a concrete driver is truly
 *    needed, callers use this method instead of an unsafe cast.
 */
export class DriverFactory {
  private driver: IWebDriver | null = null;
  private readonly useEventFiring: boolean;
  private readonly browser: BrowserType;
  private readonly driverOverride: IWebDriver | undefined;
  private readonly eventHooks: EventFiringDriverOptions;

  constructor(options: DriverFactoryOptions = {}) {
    this.useEventFiring = options.useEventFiring ?? false;
    this.browser = options.browser ?? "chrome";
    this.driverOverride = options.driverOverride;
    this.eventHooks = options.eventHooks ?? {};
  }

  /**
   * Return the active `IWebDriver`, creating it on first call.
   *
   * The return type is always the `IWebDriver` interface so callers never
   * need to cast — eliminating `InvalidCastException`.
   */
  getDriver(): IWebDriver {
    if (this.driver === null) {
      this.driver = this.createDriver();
    }
    return this.driver;
  }

  /**
   * Return the innermost concrete `IWebDriver` by stripping any
   * `EventFiringDriver` wrapper layers.
   *
   * Use this instead of a direct cast whenever low-level driver access is
   * required.
   */
  getUnwrappedDriver(): IWebDriver {
    return unwrapDriver(this.getDriver());
  }

  /** Quit the active driver and reset the factory for the next test. */
  async quitDriver(): Promise<void> {
    if (this.driver !== null) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private createDriver(): IWebDriver {
    const base: IWebDriver =
      this.driverOverride ?? this.createBrowserDriver();

    if (this.useEventFiring) {
      return new EventFiringDriver(base, this.eventHooks);
    }
    return base;
  }

  /**
   * Launch a real browser driver.
   *
   * In the TypeScript reference implementation this returns a stub; in a real
   * Selenium project this would call `new ChromeDriver()`, `new
   * FirefoxDriver()`, etc.
   */
  private createBrowserDriver(): IWebDriver {
    const browser = this.browser;
    // Stub implementation — replace with actual Selenium driver construction.
    return {
      async get(url: string): Promise<void> {
        console.log(`[${browser}] Navigating to: ${url}`);
      },
      async getTitle(): Promise<string> {
        return "";
      },
      async quit(): Promise<void> {
        console.log(`[${browser}] Quitting browser`);
      },
    };
  }
}
