import type { IWebDriver } from "./IWebDriver.js";
import { EventFiringDriver, unwrapDriver } from "./EventFiringDriver.js";

export type BrowserType = "chrome" | "firefox";

export interface DriverOptions {
  /**
   * Browser to launch.  Defaults to "chrome".
   */
  browser?: BrowserType;

  /**
   * When true, the driver is wrapped inside an EventFiringDriver that logs
   * navigation events.  Defaults to false.
   */
  useEventFiring?: boolean;

  /**
   * Inject a pre-built IWebDriver instead of creating a new browser session.
   * Primarily used in tests.
   */
  driverOverride?: IWebDriver;
}

/**
 * DriverFactory creates IWebDriver instances for the test suite.
 *
 * ### Motivation
 * The original test code performed a direct downcast after wrapping a driver
 * with EventFiringWebDriver:
 *
 *   var concrete = (WebDriver) eventFiringDriver;  // ❌ InvalidCastException
 *
 * DriverFactory fixes this by:
 * - Always returning the `IWebDriver` **interface** — never a concrete class.
 * - Providing `getUnwrappedDriver()` for the rare cases where the underlying
 *   driver is needed, using the safe `unwrapDriver()` helper instead of a cast.
 */
export class DriverFactory {
  private driver: IWebDriver | null = null;
  private readonly browser: BrowserType;
  private readonly useEventFiring: boolean;
  private readonly driverOverride: IWebDriver | undefined;

  constructor(options: DriverOptions = {}) {
    this.browser = options.browser ?? "chrome";
    this.useEventFiring = options.useEventFiring ?? false;
    this.driverOverride = options.driverOverride;
  }

  /**
   * Return the active IWebDriver, creating it if necessary.
   *
   * The returned type is always the `IWebDriver` interface so callers never
   * need to cast the value — eliminating the source of InvalidCastException.
   */
  getDriver(): IWebDriver {
    if (!this.driver) {
      this.driver = this.createDriver();
    }
    return this.driver;
  }

  /**
   * Return the innermost (concrete) IWebDriver by stripping any
   * EventFiringDriver wrapper layers.
   *
   * Use this instead of a direct cast when you specifically require the
   * underlying browser driver.
   */
  getUnwrappedDriver(): IWebDriver {
    return unwrapDriver(this.getDriver());
  }

  /**
   * Quit the browser and reset the cached driver.
   */
  async quitDriver(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  private createDriver(): IWebDriver {
    const base: IWebDriver =
      this.driverOverride ?? this.createBrowserDriver();

    if (this.useEventFiring) {
      return new EventFiringDriver(base, {
        onBeforeGet: (url) =>
          console.log(`[EventFiringDriver] Navigating to: ${url}`),
        onAfterGet: (url) =>
          console.log(`[EventFiringDriver] Navigation complete: ${url}`),
      });
    }

    return base;
  }

  private createBrowserDriver(): IWebDriver {
    // In a real project this would instantiate ChromeDriver or FirefoxDriver
    // via selenium-webdriver.  The stub below keeps the package dependency-free
    // while preserving the correct type-safe interface contract.
    throw new Error(
      `Cannot create a real ${this.browser} driver in this environment. ` +
        `Pass a driverOverride in DriverOptions for testing.`
    );
  }
}
