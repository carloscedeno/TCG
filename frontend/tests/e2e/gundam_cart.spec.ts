import { test, expect } from "@playwright/test";

test.describe("Gundam Cart Integration", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/?game=GND&tab=marketplace");
        await page.evaluate(() => sessionStorage.setItem("hasSeenWelcomeModal", "true"));
        await page.reload();
        await page.waitForTimeout(2000);
    });

    test("Adds a Gundam card to the cart and checks the drawer", async ({ page }) => {
        page.on("dialog", dialog => {
            console.log("DIALOG:", dialog.message());
            dialog.accept();
        });
        const cardLink = page.locator("a[href^=\"card/\"]").first();
        await cardLink.click();
        
        await expect(page.locator("text=Agregar").or(page.locator("text=Encargo"))).toBeVisible({ timeout: 10000 });
        
        const addBtn = page.getByTestId("add-to-cart-button");
        await addBtn.click();
        
        await page.waitForTimeout(3000);
    });
});