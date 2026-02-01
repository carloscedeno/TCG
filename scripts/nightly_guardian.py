import subprocess
import os
import sys
from datetime import datetime

def run_script(script_path):
    print(f"--- Running {script_path} ---")
    custom_env = os.environ.copy()
    custom_env["PYTHONPATH"] = os.getcwd()
    custom_env["PYTHONIOENCODING"] = "utf-8"
    try:
        result = subprocess.run([sys.executable, script_path], capture_output=True, text=True, check=False, env=custom_env, encoding='utf-8')
        if result.returncode == 0:
            print(f"PASS: {script_path}")
            return True, result.stdout
        else:
            print(f"FAIL: {script_path}")
            return False, result.stderr
    except Exception as e:
        print(f"ERROR executing {script_path}: {e}")
        return False, str(e)

def main():
    report = []
    report.append(f"# Nightly Guardian Report - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    scripts_to_run = [
        "check_api_health.py",
        "check_products_health.py",
        "scripts/sync_cardkingdom_api.py",
        "scripts/fix_missing_prices.py",
        "tests/verify_supabase_functions.py"
    ]
    
    all_passed = True
    for script in scripts_to_run:
        passed, output = run_script(script)
        status = "✅ PASS" if passed else "❌ FAIL"
        report.append(f"## {script}: {status}")
        if not passed:
            all_passed = False
            report.append("### Error Log:")
            report.append(f"```\n{output[:1000]}...\n```")
        report.append("\n---")

    report_content = "\n".join(report)
    
    with open("SESION_COMPLETADA.md", "w", encoding="utf-8") as f:
        f.write("# Resultado de la Ejecución Autónoma\n\n")
        f.write(f"Estado Global: {'🟢 TODO VERDE' if all_passed else '🔴 REQUIERE ATENCION'}\n\n")
        f.write(report_content)
    
    print("Report generated in SESION_COMPLETADA.md")
    
    if all_passed:
        # Commit progress
        subprocess.run(["git", "add", "."])
        subprocess.run(["git", "commit", "-m", f"🤖 Nightly Sync {datetime.now().strftime('%Y-%m-%d')}: Success"])
        print("Progress committed to Git.")

if __name__ == "__main__":
    main()
