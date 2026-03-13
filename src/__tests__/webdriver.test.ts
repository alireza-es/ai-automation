import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EventFiringWebDriver,
  resolveBaseDriver,
  driverIs,
  isWrapsDriver,
  type IWebDriver,
  type IWebElement,
} from "../webdriver/index.js";

// ---------------------------------------------------------------------------
// Minimal stub that implements IWebDriver
// ---------------------------------------------------------------------------

class StubWebDriver implements IWebDriver {
  navigateUrl = "";
  quitCalled = false;

  async navigate(url: string): Promise<void> {
    this.navigateUrl = url;
  }

  async findElement(
    _selector: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<IWebElement | null> {
    return null;
  }

  async findElements(
    _selector: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<IWebElement[]> {
    return [];
  }

  async executeScript(
    _script: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<unknown> {
    return null;
  }

  async getTitle(): Promise<string> {
    return "Stub Page";
  }

  async quit(): Promise<void> {
    this.quitCalled = true;
  }
}

// ---------------------------------------------------------------------------
// resolveBaseDriver
// ---------------------------------------------------------------------------

describe("resolveBaseDriver", () => {
  it("returns the driver itself when it is not wrapped", () => {
    const driver = new StubWebDriver();
    expect(resolveBaseDriver(driver)).toBe(driver);
  });

  it("unwraps a single EventFiringWebDriver layer", () => {
    const base = new StubWebDriver();
    const eventDriver = new EventFiringWebDriver(base);

    expect(resolveBaseDriver(eventDriver)).toBe(base);
  });

  it("unwraps multiple EventFiringWebDriver layers (double-wrapped)", () => {
    const base = new StubWebDriver();
    const layer1 = new EventFiringWebDriver(base);
    const layer2 = new EventFiringWebDriver(layer1);

    expect(resolveBaseDriver(layer2)).toBe(base);
  });

  /**
   * This test documents the original bug:
   * Before the fix, test helpers attempted a direct class cast which threw
   * System.InvalidCastException / TypeError when the driver was wrapped.
   *
   * The fix is to always call resolveBaseDriver() instead of casting.
   */
  it("does NOT throw when the driver is an EventFiringWebDriver (regression)", () => {
    const base = new StubWebDriver();
    const eventDriver = new EventFiringWebDriver(base);

    // ❌ Old pattern – direct cast – would throw at runtime:
    // const wd = eventDriver as StubWebDriver; // type error / runtime failure

    // ✅ New pattern – safe unwrap via resolveBaseDriver
    expect(() => resolveBaseDriver(eventDriver)).not.toThrow();
    expect(resolveBaseDriver(eventDriver)).toBeInstanceOf(StubWebDriver);
  });
});

// ---------------------------------------------------------------------------
// isWrapsDriver type-guard
// ---------------------------------------------------------------------------

describe("isWrapsDriver", () => {
  it("returns false for a plain driver", () => {
    expect(isWrapsDriver(new StubWebDriver())).toBe(false);
  });

  it("returns true for an EventFiringWebDriver", () => {
    const eventDriver = new EventFiringWebDriver(new StubWebDriver());
    expect(isWrapsDriver(eventDriver)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isWrapsDriver(null)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isWrapsDriver(42)).toBe(false);
    expect(isWrapsDriver("string")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// driverIs
// ---------------------------------------------------------------------------

describe("driverIs", () => {
  it("recognises an unwrapped driver of the expected class", () => {
    const driver = new StubWebDriver();
    expect(driverIs(driver, StubWebDriver)).toBe(true);
  });

  it("recognises a wrapped driver of the expected class", () => {
    const base = new StubWebDriver();
    const eventDriver = new EventFiringWebDriver(base);
    expect(driverIs(eventDriver, StubWebDriver)).toBe(true);
  });

  it("returns false when the unwrapped class does not match", () => {
    class OtherDriver extends StubWebDriver {}
    const driver = new StubWebDriver();
    expect(driverIs(driver, OtherDriver)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EventFiringWebDriver – delegation
// ---------------------------------------------------------------------------

describe("EventFiringWebDriver delegation", () => {
  let base: StubWebDriver;
  let eventDriver: EventFiringWebDriver;

  beforeEach(() => {
    base = new StubWebDriver();
    eventDriver = new EventFiringWebDriver(base);
  });

  it("delegates navigate() to the wrapped driver", async () => {
    await eventDriver.navigate("https://example.com");
    expect(base.navigateUrl).toBe("https://example.com");
  });

  it("delegates quit() to the wrapped driver", async () => {
    await eventDriver.quit();
    expect(base.quitCalled).toBe(true);
  });

  it("delegates getTitle() to the wrapped driver", async () => {
    const title = await eventDriver.getTitle();
    expect(title).toBe("Stub Page");
  });

  it("delegates findElement() to the wrapped driver", async () => {
    const element = await eventDriver.findElement(".btn");
    expect(element).toBeNull();
  });

  it("delegates findElements() to the wrapped driver", async () => {
    const elements = await eventDriver.findElements(".btn");
    expect(elements).toEqual([]);
  });

  it("delegates executeScript() to the wrapped driver", async () => {
    const result = await eventDriver.executeScript("return 1 + 1;");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// EventFiringWebDriver – lifecycle events
// ---------------------------------------------------------------------------

describe("EventFiringWebDriver events", () => {
  let base: StubWebDriver;
  let eventDriver: EventFiringWebDriver;

  beforeEach(() => {
    base = new StubWebDriver();
    eventDriver = new EventFiringWebDriver(base);
  });

  it("fires beforeNavigate and afterNavigate around navigate()", async () => {
    const before = vi.fn();
    const after = vi.fn();

    eventDriver.on("beforeNavigate", before);
    eventDriver.on("afterNavigate", after);

    await eventDriver.navigate("https://example.com");

    expect(before).toHaveBeenCalledOnce();
    expect(before).toHaveBeenCalledWith({
      type: "beforeNavigate",
      url: "https://example.com",
    });
    expect(after).toHaveBeenCalledOnce();
  });

  it("fires beforeQuit and afterQuit around quit()", async () => {
    const before = vi.fn();
    const after = vi.fn();

    eventDriver.on("beforeQuit", before);
    eventDriver.on("afterQuit", after);

    await eventDriver.quit();

    expect(before).toHaveBeenCalledOnce();
    expect(after).toHaveBeenCalledOnce();
  });

  it("fires beforeFindElement and afterFindElement around findElement()", async () => {
    const before = vi.fn();
    const after = vi.fn();

    eventDriver.on("beforeFindElement", before);
    eventDriver.on("afterFindElement", after);

    await eventDriver.findElement(".my-class");

    expect(before).toHaveBeenCalledWith({
      type: "beforeFindElement",
      selector: ".my-class",
    });
    expect(after).toHaveBeenCalledOnce();
  });

  it("fires beforeScript and afterScript around executeScript()", async () => {
    const before = vi.fn();
    const after = vi.fn();

    eventDriver.on("beforeScript", before);
    eventDriver.on("afterScript", after);

    await eventDriver.executeScript("return true;");

    expect(before).toHaveBeenCalledWith({
      type: "beforeScript",
      script: "return true;",
    });
    expect(after).toHaveBeenCalledOnce();
  });

  it("supports multiple handlers on the same event", async () => {
    const h1 = vi.fn();
    const h2 = vi.fn();

    eventDriver.on("afterNavigate", h1);
    eventDriver.on("afterNavigate", h2);

    await eventDriver.navigate("https://example.com");

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });
});
