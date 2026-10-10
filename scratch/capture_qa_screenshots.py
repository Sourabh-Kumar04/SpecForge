import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8001"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "design_qa"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

VERIFIED_JOB_ID = "e4aa0b9c"
REFINE_JOB_ID = "test_refine_c91c5b"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 940},
            device_scale_factor=2,
        )
        page = await context.new_page()

        # 1. Landing / Hero Screen
        print("1. Capturing 01_landing_hero.png...")
        await page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(OUTPUT_DIR / "01_landing_hero.png"))

        # 2. Settings Modal Screen
        print("2. Capturing 05_settings_modal.png...")
        settings_btn = page.locator('button:has-text("Settings")')
        if await settings_btn.count() > 0:
            await settings_btn.first.click()
            await page.wait_for_timeout(800)
            await page.screenshot(path=str(OUTPUT_DIR / "05_settings_modal.png"))
            close_btn = page.locator('button:has-text("Cancel")')
            if await close_btn.count() > 0:
                await close_btn.first.click()
            else:
                await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)

        # 3. Load Verified Job: Pipeline Timeline & Tavily Research Drawer Screen
        print(f"3. Loading job {VERIFIED_JOB_ID} for timeline and research...")
        await page.goto(f"{BASE_URL}/?job={VERIFIED_JOB_ID}", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        await page.evaluate("""() => {
            const el = document.querySelector('[data-timeline-container]') || Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('Agentic Pipeline Telemetry'));
            if (el) {
                el.scrollIntoView({ behavior: 'instant', block: 'start' });
                window.scrollBy(0, -85);
            }
        }""")
        await page.wait_for_timeout(600)
        print("Capturing 02_pipeline_timeline_research.png...")
        await page.screenshot(path=str(OUTPUT_DIR / "02_pipeline_timeline_research.png"))

        # 4. PreviewPanel / Live Preview Runtime Screen
        print("4. Capturing 03_preview_panel.png...")
        preview_tab = page.locator('button:has-text("LIVE PREVIEW")')
        if await preview_tab.count() > 0:
            await preview_tab.first.click()
            await page.wait_for_timeout(800)
            await page.evaluate("""() => {
                for (const b of document.querySelectorAll('button')) {
                    if (b.textContent && b.textContent.includes('LIVE PREVIEW')) {
                        b.scrollIntoView({ behavior: 'instant', block: 'start' });
                        window.scrollBy(0, -85);
                        break;
                    }
                }
            }""")
            await page.wait_for_timeout(600)
        print("Capturing 03_preview_panel.png...")
        await page.screenshot(path=str(OUTPUT_DIR / "03_preview_panel.png"))

        # 5. TestReportPanel with Spend Breakdown Screen
        print("5. Capturing 06_test_report_spend.png...")
        test_tab = page.locator('button:has-text("TEST VERIFICATION")')
        if await test_tab.count() > 0:
            await test_tab.first.click()
            await page.wait_for_timeout(800)
            await page.evaluate("""() => {
                for (const b of document.querySelectorAll('button')) {
                    if (b.textContent && b.textContent.includes('TEST VERIFICATION')) {
                        b.scrollIntoView({ behavior: 'instant', block: 'start' });
                        window.scrollBy(0, -85);
                        break;
                    }
                }
            }""")
            await page.wait_for_timeout(600)
        print("Capturing 06_test_report_spend.png...")
        await page.screenshot(path=str(OUTPUT_DIR / "06_test_report_spend.png"))

        # 6. RefineBox with real diff changes
        print(f"6. Loading job {REFINE_JOB_ID} for RefineBox diff...")
        await page.goto(f"{BASE_URL}/?job={REFINE_JOB_ID}", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        await page.evaluate("""() => {
            const el = Array.from(document.querySelectorAll('h3')).find(h => h.textContent && h.textContent.includes('Iterative Refinement'));
            if (el) {
                el.scrollIntoView({ behavior: 'instant', block: 'start' });
                window.scrollBy(0, -85);
            }
        }""")
        await page.wait_for_timeout(600)
        print("Capturing 04_refine_box.png...")
        await page.screenshot(path=str(OUTPUT_DIR / "04_refine_box.png"))

        # 7. Running pipeline screen
        print("7. Capturing 07_running_pipeline.png...")
        await page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
        await page.wait_for_timeout(800)
        forge_btn = page.locator('button:has-text("Forge Codebase")')
        if await forge_btn.count() > 0:
            await forge_btn.first.click()
            await page.wait_for_timeout(2500)
            await page.evaluate("""() => {
                const el = Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('Agentic Pipeline Telemetry'));
                if (el) {
                    el.scrollIntoView({ behavior: 'instant', block: 'start' });
                    window.scrollBy(0, -85);
                }
            }""")
            await page.wait_for_timeout(500)
            await page.screenshot(path=str(OUTPUT_DIR / "07_running_pipeline.png"))

        await browser.close()
        print("All visual QA screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(run())
