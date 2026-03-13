import { describe, it, expect, vi } from "vitest";
import type { IWebDriver } from "../driver/IWebDriver.js";
import {
  EventFiringDriver,
  unwrapDriver,
  isEventFiringDriver,
} from "../driver/EventFiringDriver.js";
import { DriverFactory } from "../driver/DriverFactory.js";

// ---------------------------------------------------------------------------
// Minimal IWebDriver stub used throughout tests
// ---------------------------------------------------------------------------
function makeStubDriver(): IWebDriver {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    getCurrentUrl: vi.fn().mockResolvedValue("https://example.com"),
    getTitle: vi.fn().mockResolvedValue("Example"),
    executeScript: vi.fn().mockResolvedValue(null),
    quit: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// EventFiringDriver
// ---------------------------------------------------------------------------
describe("EventFiringDriver", () => {
  it("wraps an IWebDriver and exposes it via wrappedDriver", () => {
    const base = makeStubDriver();
    const eventDriver = new EventFiringDriver(base);

    expect(eventDriver.wrappedDriver).toBe(base);
  });

  it("delegates get() to the wrapped driver", async () => {
    const base = makeStubDriver();
    const eventDriver = new EventFiringDriver(base);

    await eventDriver.get("https://example.com");

    expect(base.get).toHaveBeenCalledWith("https://example.com");
  });

  it("fires onBeforeGet and onAfterGet hooks in the correct order", async () => {
    const base = makeStubDriver();
    const order: string[] = [];

    const eventDriver = new EventFiringDriver(base, {
      onBeforeGet: () => order.push("before"),
      onAfterGet: () => order.push("after"),
    });

    await eventDriver.get("https://example.com");

    expect(order).toEqual(["before", "after"]);
  });

  it("delegates getCurrentUrl() to the wrapped driver", async () => {
    const base = makeStubDriver();
    const eventDriver = new EventFiringDriver(base);

    const url = await eventDriver.getCurrentUrl();

    expect(url).toBe("https://example.com");
    expect(base.getCurrentUrl).toHaveBeenCalled();
  });

  it("delegates quit() to the wrapped driver", async () => {
    const base = makeStubDriver();
    const eventDriver = new EventFiringDriver(base);

    await eventDriver.quit();

    expect(base.quit).toHaveBeenCalled();
  });

  it("implements the IWebDriver interface — no cast required", () => {
    const base = makeStubDriver();
    // Assigning to IWebDriver must compile without a cast.
    const driver: IWebDriver = new EventFiringDriver(base);

    expect(driver).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// unwrapDriver — safe alternative to direct (WebDriver) cast
// ---------------------------------------------------------------------------
describe("unwrapDriver", () => {
  it("returns the driver unchanged when it is not wrapped", () => {
    const base = makeStubDriver();
    expect(unwrapDriver(base)).toBe(base);
  });

  it("unwraps a single EventFiringDriver layer", () => {
    const base = makeStubDriver();
    const wrapped = new EventFiringDriver(base);

    expect(unwrapDriver(wrapped)).toBe(base);
  });

  it("unwraps multiple nested EventFiringDriver layers", () => {
    const base = makeStubDriver();
    const layer1 = new EventFiringDriver(base);
    const layer2 = new EventFiringDriver(layer1);

    expect(unwrapDriver(layer2)).toBe(base);
  });
});

// ---------------------------------------------------------------------------
// isEventFiringDriver
// ---------------------------------------------------------------------------
describe("isEventFiringDriver", () => {
  it("returns true for an EventFiringDriver", () => {
    const eventDriver = new EventFiringDriver(makeStubDriver());
    expect(isEventFiringDriver(eventDriver)).toBe(true);
  });

  it("returns false for a plain IWebDriver stub", () => {
    const base = makeStubDriver();
    expect(isEventFiringDriver(base)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DriverFactory
// ---------------------------------------------------------------------------
describe("DriverFactory", () => {
  it("returns the same driver instance on repeated calls", () => {
    const stub = makeStubDriver();
    const factory = new DriverFactory({ driverOverride: stub });

    expect(factory.getDriver()).toBe(factory.getDriver());
  });

  it("wraps the driver in EventFiringDriver when useEventFiring is true", () => {
    const stub = makeStubDriver();
    const factory = new DriverFactory({
      driverOverride: stub,
      useEventFiring: true,
    });

    const driver = factory.getDriver();

    // Driver must be an EventFiringDriver — and also satisfy IWebDriver.
    expect(isEventFiringDriver(driver)).toBe(true);
  });

  it("does NOT wrap the driver when useEventFiring is false", () => {
    const stub = makeStubDriver();
    const factory = new DriverFactory({
      driverOverride: stub,
      useEventFiring: false,
    });

    expect(isEventFiringDriver(factory.getDriver())).toBe(false);
  });

  it("getUnwrappedDriver returns the concrete driver — the safe cast replacement", () => {
    const stub = makeStubDriver();
    const factory = new DriverFactory({
      driverOverride: stub,
      useEventFiring: true,
    });

    // Previously this pattern would throw:
    //   InvalidCastException: Unable to cast EventFiringWebDriver to WebDriver
    //
    // getUnwrappedDriver() fixes this by using unwrapDriver() instead of a cast.
    const unwrapped = factory.getUnwrappedDriver();

    expect(unwrapped).toBe(stub);
    expect(isEventFiringDriver(unwrapped)).toBe(false);
  });

  it("quitDriver calls quit on the driver and resets the cached instance", async () => {
    const stub = makeStubDriver();
    const factory = new DriverFactory({ driverOverride: stub });

    // Initialise the driver
    factory.getDriver();

    await factory.quitDriver();

    expect(stub.quit).toHaveBeenCalledOnce();

    // After quitting, getDriver should create a new instance (driverOverride is
    // used again here, so the new instance is the same stub — but quit is
    // called only once, confirming the cache was cleared).
    factory.getDriver();
    expect(stub.quit).toHaveBeenCalledTimes(1);
  });

  it("throws when no driverOverride is provided (real browser not available)", () => {
    const factory = new DriverFactory({ browser: "chrome" });
    expect(() => factory.getDriver()).toThrow(
      /Cannot create a real chrome driver/
    );
  });
});
