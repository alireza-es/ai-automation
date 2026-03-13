import type { IWebDriver, IWebElement, IWrapsDriver } from "./types.js";

/**
 * EventFiringWebDriver wraps another IWebDriver and emits lifecycle events
 * before and after each operation (useful for logging, screenshots, etc.).
 *
 * ### Why the original cast failed
 * The previous implementation passed an `EventFiringWebDriver` instance to a
 * helper function that tried to cast it directly to the concrete `WebDriver`
 * class:
 *
 * ```ts
 * // ❌ Throws if `driver` is actually an EventFiringWebDriver
 * const wd = driver as ConcreteWebDriver;
 * ```
 *
 * ### The fix
 * All helper functions now accept `IWebDriver` (the interface) instead of a
 * concrete class.  When the underlying driver is truly needed, callers use
 * `resolveBaseDriver()` from `driverFactory.ts`, which honours the
 * `IWrapsDriver` contract without an unsafe cast.
 */
export class EventFiringWebDriver implements IWebDriver, IWrapsDriver {
  private readonly wrapped: IWebDriver;
  private readonly listeners: Map<string, Array<(event: DriverEvent) => void>> =
    new Map();

  constructor(driver: IWebDriver) {
    this.wrapped = driver;
  }

  // ------------------------------------------------------------------
  // IWrapsDriver
  // ------------------------------------------------------------------

  getWrappedDriver(): IWebDriver {
    return this.wrapped;
  }

  // ------------------------------------------------------------------
  // Event bus
  // ------------------------------------------------------------------

  on(event: string, handler: (event: DriverEvent) => void): this {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
    return this;
  }

  private emit(event: string, payload: DriverEvent): void {
    (this.listeners.get(event) ?? []).forEach((h) => h(payload));
  }

  // ------------------------------------------------------------------
  // IWebDriver – delegate to the wrapped driver and fire events
  // ------------------------------------------------------------------

  async navigate(url: string): Promise<void> {
    this.emit("beforeNavigate", { type: "beforeNavigate", url });
    await this.wrapped.navigate(url);
    this.emit("afterNavigate", { type: "afterNavigate", url });
  }

  async findElement(selector: string): Promise<IWebElement | null> {
    this.emit("beforeFindElement", { type: "beforeFindElement", selector });
    const element = await this.wrapped.findElement(selector);
    this.emit("afterFindElement", { type: "afterFindElement", selector });
    return element;
  }

  async findElements(selector: string): Promise<IWebElement[]> {
    this.emit("beforeFindElement", { type: "beforeFindElement", selector });
    const elements = await this.wrapped.findElements(selector);
    this.emit("afterFindElement", { type: "afterFindElement", selector });
    return elements;
  }

  async executeScript(script: string, ...args: unknown[]): Promise<unknown> {
    this.emit("beforeScript", { type: "beforeScript", script });
    const result = await this.wrapped.executeScript(script, ...args);
    this.emit("afterScript", { type: "afterScript", script });
    return result;
  }

  async getTitle(): Promise<string> {
    return this.wrapped.getTitle();
  }

  async quit(): Promise<void> {
    this.emit("beforeQuit", { type: "beforeQuit" });
    await this.wrapped.quit();
    this.emit("afterQuit", { type: "afterQuit" });
  }
}

/** Discriminated union of all events fired by EventFiringWebDriver. */
export type DriverEvent =
  | { type: "beforeNavigate"; url: string }
  | { type: "afterNavigate"; url: string }
  | { type: "beforeFindElement"; selector: string }
  | { type: "afterFindElement"; selector: string }
  | { type: "beforeScript"; script: string }
  | { type: "afterScript"; script: string }
  | { type: "beforeQuit" }
  | { type: "afterQuit" };
