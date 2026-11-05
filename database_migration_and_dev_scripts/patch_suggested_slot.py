import os

path = 'backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """                    suggested = None
                    for s_cand in ALL_STANDARD_SLOTS:
                        s_start = parse_slot_to_minutes(s_cand)
                        s_end = s_start + 30
                        if chosen_date == today_ist:
                            curr_mins = now_ist.hour * 60 + now_ist.minute
                            if s_start <= curr_mins + 15:
                                continue
                        if not any(s_start < bwi["end_mins"] and s_end > bwi["start_mins"] for bwi in busy_windows):
                            suggested = s_cand
                            break"""

replacement1 = """                    suggested = None
                    # First check for the immediate next slot following the doctor's consultation
                    for s_cand in ALL_STANDARD_SLOTS:
                        s_start = parse_slot_to_minutes(s_cand)
                        s_end = s_start + 30
                        if s_start < bw["end_mins"]:
                            continue
                        if chosen_date == today_ist:
                            curr_mins = now_ist.hour * 60 + now_ist.minute
                            if s_start <= curr_mins + 15:
                                continue
                        if not any(s_start < bwi["end_mins"] and s_end > bwi["start_mins"] for bwi in busy_windows):
                            suggested = s_cand
                            break
                    if not suggested:
                        # Fallback to any remaining available slot on that date
                        for s_cand in ALL_STANDARD_SLOTS:
                            s_start = parse_slot_to_minutes(s_cand)
                            s_end = s_start + 30
                            if chosen_date == today_ist:
                                curr_mins = now_ist.hour * 60 + now_ist.minute
                                if s_start <= curr_mins + 15:
                                    continue
                            if not any(s_start < bwi["end_mins"] and s_end > bwi["start_mins"] for bwi in busy_windows):
                                suggested = s_cand
                                break"""

target2 = """                suggested = None
                for s_cand in ALL_STANDARD_SLOTS:
                    s_start = parse_slot_to_minutes(s_cand)
                    s_end = s_start + 30
                    curr_mins = now_ist.hour * 60 + now_ist.minute
                    if s_start <= curr_mins + 10:
                        continue
                    if not any(s_start < bwi["end_mins"] and s_end > bwi["start_mins"] for bwi in busy_windows):
                        suggested = s_cand
                        break"""

replacement2 = """                suggested = None
                for s_cand in ALL_STANDARD_SLOTS:
                    s_start = parse_slot_to_minutes(s_cand)
                    s_end = s_start + 30
                    if s_start < bw["end_mins"]:
                        continue
                    curr_mins = now_ist.hour * 60 + now_ist.minute
                    if s_start <= curr_mins + 10:
                        continue
                    if not any(s_start < bwi["end_mins"] and s_end > bwi["start_mins"] for bwi in busy_windows):
                        suggested = s_cand
                        break
                if not suggested:
                    for s_cand in ALL_STANDARD_SLOTS:
                        s_start = parse_slot_to_minutes(s_cand)
                        s_end = s_start + 30
                        curr_mins = now_ist.hour * 60 + now_ist.minute
                        if s_start <= curr_mins + 10:
                            continue
                        if not any(s_start < bwi["end_mins"] and s_end > bwi["start_mins"] for bwi in busy_windows):
                            suggested = s_cand
                            break"""

assert target1 in content, "target1 not found"
assert target2 in content, "target2 not found"

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Updated suggestion logic in backend/main.py")
