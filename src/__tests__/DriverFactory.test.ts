import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IWebDriver } from "../driver/IWebDriver.js";
import {
  EventFiringDriver,
  unwrapDriver,
} from "../driver/EventFiringDriver.js";
import { DriverFactory } from "../driver/DriverFactory.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockDriver(): IWebDriver {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    getTitle: vi.fn().mockResolvedValue("Mock Title"),
    quit: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// EventFiringDriver
// ---------------------------------------------------------------------------

describe("EventFiringDriver", () => {
  it("delegates get() to the wrapped driver", async () => {
    const inner = makeMockDriver();
    const wrapper = new EventFiringDriver(inner);

    await wrapper.get("https://example.com");

    expect(inner.get).toHaveBeenCalledWith("https://example.com");
  });

  it("fires onBeforeGet before and onAfterGet after navigating", async () => {
    const inner = makeMockDriver();
    const order: string[] = [];

    const wrapper = new EventFiringDriver(inner, {
      onBeforeGet: () => order.push("before"),
      onAfterGet: () => order.push("after"),
    });

    (inner.get as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      order.push("navigate");
    });

    await wrapper.get("https://example.com");

    expect(order).toEqual(["before", "navigate", "after"]);
  });

  it("delegates getTitle() to the wrapped driver", async () => {
    const inner = makeMockDriver();
    const wrapper = new EventFiringDriver(inner);

    const title = await wrapper.getTitle();

    expect(title).toBe("Mock Title");
    expect(inner.getTitle).toHaveBeenCalledOnce();
  });

  it("delegates quit() to the wrapped driver", async () => {
    const inner = makeMockDriver();
    const wrapper = new EventFiringDriver(inner);

    await wrapper.quit();

    expect(inner.quit).toHaveBeenCalledOnce();
  });

  it("exposes the inner driver via wrappedDriver", () => {
    const inner = makeMockDriver();
    const wrapper = new EventFiringDriver(inner);

    expect(wrapper.wrappedDriver).toBe(inner);
  });
});

// ---------------------------------------------------------------------------
// unwrapDriver
// ---------------------------------------------------------------------------

describe("unwrapDriver", () => {
  it("returns the same driver when it is not wrapped", () => {
    const driver = makeMockDriver();
    expect(unwrapDriver(driver)).toBe(driver);
  });

  it("unwraps a single EventFiringDriver layer", () => {
    const inner = makeMockDriver();
    const wrapper = new EventFiringDriver(inner);

    expect(unwrapDriver(wrapper)).toBe(inner);
  });

  it("unwraps multiple nested EventFiringDriver layers", () => {
    const inner = makeMockDriver();
    const middle = new EventFiringDriver(inner);
    const outer = new EventFiringDriver(middle);

    expect(unwrapDriver(outer)).toBe(inner);
  });

  it("is a type-safe replacement for direct casting (no InvalidCastException)", () => {
    const inner = makeMockDriver();
    const eventFiring = new EventFiringDriver(inner);

    // This is the pattern that previously threw InvalidCastException:
    //   var concrete = (WebDriver) eventFiringDriver;  // ❌
    //
    // The safe replacement:
    const concrete = unwrapDriver(eventFiring); // ✅

    expect(concrete).toBe(inner);
  });
});

// ---------------------------------------------------------------------------
// DriverFactory
// ---------------------------------------------------------------------------

describe("DriverFactory", () => {
  let mockDriver: IWebDriver;

  beforeEach(() => {
    mockDriver = makeMockDriver();
  });

  it("returns the injected driver when no EventFiring wrapper is requested", () => {
    const factory = new DriverFactory({ driverOverride: mockDriver });

    const driver = factory.getDriver();

    expect(driver).toBe(mockDriver);
  });

  it("wraps the injected driver in EventFiringDriver when useEventFiring is true", () => {
    const factory = new DriverFactory({
      driverOverride: mockDriver,
      useEventFiring: true,
    });

    const driver = factory.getDriver();

    expect(driver).toBeInstanceOf(EventFiringDriver);
    expect((driver as EventFiringDriver).wrappedDriver).toBe(mockDriver);
  });

  it("returns the same driver instance on repeated calls", () => {
    const factory = new DriverFactory({ driverOverride: mockDriver });

    expect(factory.getDriver()).toBe(factory.getDriver());
  });

  it("getUnwrappedDriver() returns the concrete driver without casting", () => {
    const factory = new DriverFactory({
      driverOverride: mockDriver,
      useEventFiring: true,
    });

    // This is the fix: use getUnwrappedDriver() instead of a direct cast.
    const concrete = factory.getUnwrappedDriver();

    expect(concrete).toBe(mockDriver);
  });

  it("quitDriver() calls quit on the driver and clears the instance", async () => {
    const factory = new DriverFactory({ driverOverride: mockDriver });
    factory.getDriver(); // initialise

    await factory.quitDriver();

    expect(mockDriver.quit).toHaveBeenCalledOnce();

    // A new driver should be created after quitting
    const factory2 = new DriverFactory({ driverOverride: mockDriver });
    factory2.getDriver();
    expect(factory2.getDriver()).toBeDefined();
  });

  it("quitDriver() is a no-op when no driver has been created", async () => {
    const factory = new DriverFactory({ driverOverride: mockDriver });

    // Should not throw
    await expect(factory.quitDriver()).resolves.toBeUndefined();
  });

  it("fires event hooks during navigation", async () => {
    const events: string[] = [];
    const factory = new DriverFactory({
      driverOverride: mockDriver,
      useEventFiring: true,
      eventHooks: {
        onBeforeGet: (url) => events.push(`before:${url}`),
        onAfterGet: (url) => events.push(`after:${url}`),
      },
    });

    await factory.getDriver().get("https://example.com");

    expect(events).toEqual([
      "before:https://example.com",
      "after:https://example.com",
    ]);
  });
});
