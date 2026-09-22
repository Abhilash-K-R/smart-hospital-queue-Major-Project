import glob
import subprocess
import sys

test_files = sorted(glob.glob("test_*.py"))
results = []

print(f"Running {len(test_files)} test files sequentially...\n")
for tf in test_files:
    cmd = [sys.executable, tf]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        status = "PASS" if res.returncode == 0 else f"FAIL ({res.returncode})"
        lines = [l.strip() for l in (res.stdout + res.stderr).splitlines() if l.strip()]
        last_line = lines[-1] if lines else "No output"
        results.append((tf, status, last_line))
        print(f"[{status:12}] {tf:<35} -> {last_line[:60]}")
    except subprocess.TimeoutExpired:
        results.append((tf, "TIMEOUT", "Exceeded 90s"))
        print(f"[TIMEOUT     ] {tf:<35}")
    except Exception as e:
        results.append((tf, "ERROR", str(e)))
        print(f"[ERROR       ] {tf:<35} -> {e}")

print("\n" + "=" * 80)
passed = sum(1 for _, s, _ in results if s == "PASS")
failed = len(results) - passed
print(f"SUMMARY: Total={len(results)}, Passed={passed}, Failed/Issues={failed}")
