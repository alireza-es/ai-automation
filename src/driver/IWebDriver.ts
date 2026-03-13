/**
 * Minimal contract that every driver implementation must satisfy.
 *
 * Working against this interface — rather than concrete driver classes like
 * `WebDriver` or `EventFiringWebDriver` — is what prevents the
 * `InvalidCastException` seen in the Centralized Schedules acceptance tests.
 */
export interface IWebDriver {
  /** Navigate the browser to the given URL. */
  get(url: string): Promise<void>;

  /** Return the title of the currently loaded page. */
  getTitle(): Promise<string>;

  /** Quit the browser and release all associated resources. */
  quit(): Promise<void>;
}
