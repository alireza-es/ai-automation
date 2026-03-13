/**
 * Minimal interface representing the capabilities every WebDriver implementation
 * must expose.  Both concrete drivers (e.g. ChromeDriver, FirefoxDriver) **and**
 * wrapper drivers (e.g. EventFiringWebDriver) implement this interface so that
 * callers never need to cast to a specific class.
 *
 * Root cause of the original casting exception:
 *   System.InvalidCastException: Unable to cast object of type
 *   'OpenQA.Selenium.Support.Events.EventFiringWebDriver'
 *   to type 'OpenQA.Selenium.WebDriver'.
 *
 * Fix: depend on the IWebDriver interface, not on a concrete class.
 */
export interface IWebDriver {
  /** Navigate to a URL. */
  navigate(url: string): Promise<void>;

  /** Find a single element using a CSS selector. */
  findElement(selector: string): Promise<IWebElement | null>;

  /** Find all matching elements using a CSS selector. */
  findElements(selector: string): Promise<IWebElement[]>;

  /** Execute arbitrary JavaScript in the page context. */
  executeScript(script: string, ...args: unknown[]): Promise<unknown>;

  /** Return the page title of the current document. */
  getTitle(): Promise<string>;

  /** Quit the browser and release all resources. */
  quit(): Promise<void>;
}

/** Represents a DOM element returned by a driver. */
export interface IWebElement {
  /** Click the element. */
  click(): Promise<void>;

  /** Read a text attribute.  Returns `null` when the attribute is absent. */
  getAttribute(name: string): Promise<string | null>;

  /** Return the visible text content. */
  getText(): Promise<string>;
}

/**
 * Marker interface used to expose the wrapped driver from decorator/proxy
 * implementations such as EventFiringWebDriver.
 *
 * Calling code that needs the *underlying* concrete driver should check for
 * this interface instead of performing a direct cast.
 */
export interface IWrapsDriver {
  /** Return the driver that this object wraps. */
  getWrappedDriver(): IWebDriver;
}

/** Type-guard: returns true when `driver` exposes a `getWrappedDriver()` method. */
export function isWrapsDriver(driver: unknown): driver is IWrapsDriver {
  return (
    typeof driver === "object" &&
    driver !== null &&
    typeof (driver as Record<string, unknown>)["getWrappedDriver"] ===
      "function"
  );
}
