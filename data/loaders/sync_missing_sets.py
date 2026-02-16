
import subprocess
import time

sets_to_sync = [
    "LCC", "PTHS", "TSB", "LTC", "CLU", "TDC", "VOC", "MOC", "MUL", 
    "ONC", "KHC", "MIC", "DRC", "DSC", "WOC", "H2R", "WOT"
]

for set_code in sets_to_sync:
    print(f"Syncing set: {set_code}")
    subprocess.run(["python", "data/loaders/sync_set.py", set_code])
    time.sleep(1) # Small delay to be nice to the API
