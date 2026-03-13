/**
 * IWebDriver interface defines the contract for all WebDriver implementations.
 *
 * Using this interface throughout the codebase — instead of concrete driver
 * classes like ChromeDriver or FirefoxDriver — prevents InvalidCastException
 * errors that occur when an EventFiringWebDriver wrapper is directly cast to
 * a concrete driver type.
 */
export interface IWebDriver {
  /**
   * Navigate the browser to the given URL.
   */
  get(url: string): Promise<void>;

  /**
   * Retrieve the current page URL.
   */
  getCurrentUrl(): Promise<string>;

  /**
   * Retrieve the title of the current page.
   */
  getTitle(): Promise<string>;

  /**
   * Execute JavaScript in the context of the current page.
   */
  executeScript(script: string, ...args: unknown[]): Promise<unknown>;

  /**
   * Quit the browser and end the WebDriver session.
   */
  quit(): Promise<void>;
}

/**
 * IEventFiringDriver extends IWebDriver to expose the wrapped (underlying)
 * driver instance.
 *
 * When code needs the concrete driver object it must use this property instead
 * of performing a direct cast, which would throw InvalidCastException when the
 * driver is wrapped inside an EventFiringWebDriver.
 */
export interface IEventFiringDriver extends IWebDriver {
  /**
   * The underlying driver that this event-firing wrapper decorates.
   * Use this to access the concrete driver without unsafe casting.
   */
  readonly wrappedDriver: IWebDriver;
}
