import { DriverFactory } from "./driver/DriverFactory.js";

const args = process.argv.slice(2);
const command = args[0];

if (command === "check-driver") {
  const factory = new DriverFactory({ useEventFiring: true });

  try {
    // getDriver() returns IWebDriver — no cast required
    const driver = factory.getDriver();
    console.log("Driver initialised:", driver.constructor.name);

    // getUnwrappedDriver() safely unwraps EventFiringDriver without casting
    const unwrapped = factory.getUnwrappedDriver();
    console.log("Unwrapped driver:", unwrapped.constructor.name);
  } catch (err) {
    // Expected in environments where a real browser is not available
    console.error((err as Error).message);
    process.exit(1);
  }
} else {
  console.log("ai-automation CLI");
  console.log("");
  console.log("Commands:");
  console.log("  check-driver   Verify WebDriver initialisation and casting");
}
