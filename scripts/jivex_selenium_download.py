#!/usr/bin/env python3
"""JiveX portal login + download — attaches to Electron web preview via CDP."""

import json
import sys
import time
import urllib.request
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def fail(reason):
    print(json.dumps({"ok": False, "error": reason}))
    sys.exit(1)


def read_config():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            fail("No input config on stdin")
        return json.loads(raw)
    except json.JSONDecodeError as e:
        fail(f"Invalid JSON config: {e}")


def is_partial(name: str) -> bool:
    lower = name.lower()
    return lower.endswith(".crdownload") or lower.endswith(".part") or lower.endswith(".tmp")


def wait_for_zip(download_dir: Path, timeout_sec: int = 120) -> Path:
    download_dir.mkdir(parents=True, exist_ok=True)
    before = {p.resolve() for p in download_dir.iterdir() if p.is_file() and not is_partial(p.name)}
    deadline = time.time() + timeout_sec
    last_size = {}

    while time.time() < deadline:
        for path in download_dir.iterdir():
            if not path.is_file() or is_partial(path.name):
                continue
            if not path.name.lower().endswith(".zip"):
                continue
            resolved = path.resolve()
            if resolved in before:
                continue
            try:
                size = path.stat().st_size
            except OSError:
                continue
            if size < 1024:
                continue
            prev = last_size.get(resolved)
            if prev is not None and prev == size:
                return path
            last_size[resolved] = size
        time.sleep(0.5)

    fail("Timed out waiting for JiveX zip download")


def set_gwt_input_value(driver, element, value: str):
    driver.execute_script(
        """
        const el = arguments[0];
        const value = arguments[1];
        const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        )?.set;
        if (nativeSetter) {
            nativeSetter.call(el, value);
        } else {
            el.value = value;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        """,
        element,
        value,
    )


def find_password_input(driver, wait: WebDriverWait):
    def _locate(_):
        labels = driver.find_elements(By.CSS_SELECTOR, ".gwt-Label.textFieldWidget, .gwt-Label")
        for label in labels:
            text = (label.text or "").strip().lower()
            if text not in ("password", "passwort"):
                continue
            try:
                holder = label.find_element(By.XPATH, "./ancestor::div[contains(@class,'widgetHolder')]")
                el = holder.find_element(By.CSS_SELECTOR, ".textFieldWrapper input.inputField, input.inputField, input")
                if el.is_displayed():
                    return el
            except Exception:
                continue

        for el in driver.find_elements(By.CSS_SELECTOR, "input.inputField"):
            if el.is_displayed():
                return el
        return None

    el = wait.until(_locate)
    if not el:
        fail("Password field not found")
    return el


def click_submit_near_password(driver, password_el):
    pw_rect = password_el.rect
    pw_mid_y = pw_rect["y"] + pw_rect["height"] / 2
    best = None
    best_dist = 10**9

    for img in driver.find_elements(By.CSS_SELECTOR, "img.gwt-Image, img"):
        try:
            if not img.is_displayed():
                continue
            r = img.rect
            if r["width"] < 8 or r["height"] < 8:
                continue
            img_mid_y = r["y"] + r["height"] / 2
            if abs(img_mid_y - pw_mid_y) > 80:
                continue
            if r["x"] < pw_rect["x"]:
                continue
            dist = abs(r["x"] - (pw_rect["x"] + pw_rect["width"]))
            if dist < best_dist:
                best_dist = dist
                best = img
        except Exception:
            continue

    if best:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", best)
        time.sleep(0.2)
        best.click()
        return True

    password_el.send_keys(Keys.ENTER)
    return True


def portal_ready(driver):
    if driver.find_elements(By.ID, "downloadbutton"):
        return True
    if driver.find_elements(By.CSS_SELECTOR, "button[ng-click*='downloadStudy']"):
        return True
    if driver.find_elements(By.CSS_SELECTOR, "table tbody tr[__gwt_row], .studyManagerMainPanel"):
        return True
    return False


def switch_to_jivex_preview_tab(driver, portal_url: str, debug_port: int):
    needle = "jivexmobile"
    portal_lower = portal_url.lower()

    def matches(url: str) -> bool:
        u = (url or "").lower()
        return needle in u or (portal_lower and portal_lower.split("?")[0] in u)

    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{debug_port}/json/list", timeout=5) as resp:
            targets = json.loads(resp.read().decode("utf-8"))
        for target in targets:
            if not matches(target.get("url") or ""):
                continue
            target_id = target.get("id")
            if target_id:
                try:
                    urllib.request.urlopen(
                        f"http://127.0.0.1:{debug_port}/json/activate/{target_id}",
                        timeout=3,
                    )
                    time.sleep(0.3)
                except Exception:
                    pass
            break
    except Exception as e:
        log(f"[JiveX Selenium] CDP target lookup: {e}")

    for handle in driver.window_handles:
        driver.switch_to.window(handle)
        current = driver.current_url or ""
        if matches(current):
            log(f"[JiveX Selenium] Attached to preview tab: {current}")
            return

    fail("Jivex preview tab not found in Electron — ensure web preview is visible")


def create_driver(cfg):
    attach = bool(cfg.get("attach_debugger"))
    debug_port = int(cfg.get("debugger_port") or 9222)

    if attach:
        options = Options()
        options.add_experimental_option("debuggerAddress", f"127.0.0.1:{debug_port}")
        log(f"[JiveX Selenium] Attaching to Electron preview on port {debug_port}…")
        return webdriver.Chrome(options=options)

    options = Options()
    headed = bool(cfg.get("headed", True))
    if not headed:
        options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1280,900")
    download_dir = Path(cfg.get("download_dir") or ".").resolve()
    options.add_experimental_option(
        "prefs",
        {
            "download.default_directory": str(download_dir),
            "download.directory_upgrade": True,
            "download.prompt_for_download": False,
            "safebrowsing.enabled": True,
        },
    )
    log("[JiveX Selenium] Starting standalone Chrome…")
    return webdriver.Chrome(options=options)


def main():
    cfg = read_config()
    portal_url = (cfg.get("portal_url") or "").strip()
    password = cfg.get("password") or ""
    download_dir = Path(cfg.get("download_dir") or ".").resolve()
    attach = bool(cfg.get("attach_debugger"))
    debug_port = int(cfg.get("debugger_port") or 9222)
    skip_navigation = bool(cfg.get("skip_navigation"))
    skip_download_wait = bool(cfg.get("skip_download_wait"))

    if not portal_url:
        fail("portal_url is required")
    if not password:
        fail("password is required")

    driver = None
    try:
        driver = create_driver(cfg)
        wait = WebDriverWait(driver, 45)

        if attach:
            switch_to_jivex_preview_tab(driver, portal_url, debug_port)
        elif not skip_navigation:
            log("[JiveX Selenium] Opening portal…")
            driver.get(portal_url)

        if not portal_ready(driver):
            password_el = find_password_input(driver, wait)
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", password_el)
            time.sleep(0.2)
            password_el.click()
            time.sleep(0.2)
            set_gwt_input_value(driver, password_el, password)
            time.sleep(0.3)
            click_submit_near_password(driver, password_el)

            log("[JiveX Selenium] Waiting for portal after login…")
            wait.until(lambda d: portal_ready(d))

        log("[JiveX Selenium] Clicking download…")
        download_btn = wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "#downloadbutton, button#downloadbutton, button[ng-click*='downloadStudy']")
            )
        )
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", download_btn)
        time.sleep(0.3)
        download_btn.click()

        study_uid = None
        code = cfg.get("access_code")
        if code:
            study_uid = f"jivex-{code}"

        if skip_download_wait:
            log("[JiveX Selenium] Download triggered — Electron will save the zip")
            print(json.dumps({"ok": True, "path": None, "studyUid": study_uid}))
            return

        log(f"[JiveX Selenium] Waiting for zip in {download_dir}…")
        zip_path = wait_for_zip(download_dir, timeout_sec=120)
        log(f"[JiveX Selenium] Saved: {zip_path}")

        print(
            json.dumps(
                {
                    "ok": True,
                    "path": str(zip_path),
                    "studyUid": study_uid,
                }
            )
        )
    except Exception as e:
        fail(str(e) or "JiveX Selenium failed")
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


if __name__ == "__main__":
    main()
