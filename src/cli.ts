import { DriverFactory } from "./driver/DriverFactory.js";

const factory = new DriverFactory({ useEventFiring: true, browser: "chrome" });
const driver = factory.getDriver();

await driver.get("https://example.com");
console.log("Title:", await driver.getTitle());
await factory.quitDriver();
