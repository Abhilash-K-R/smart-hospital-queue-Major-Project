import os

path = 'patient-app/src/pages/Appointment.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if i > 250 and "const currentDoctorObj = DOCTORS.find" in line:
        print(f"Removing line {i+1}: {line.strip()}")
        continue
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("SUCCESS: Updated Appointment.jsx")
