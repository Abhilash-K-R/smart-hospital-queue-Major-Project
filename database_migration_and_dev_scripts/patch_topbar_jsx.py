import os

path = 'patient-app/src/components/TopBar.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """        {(() => {
          const now = new Date();
          const hour = now.getHours();
          const isOpdOpen = hour >= 8 && hour < 20; // 08:00 AM - 08:00 PM

          return isOpdOpen ? ("""

replacement = """        {(() => {
          const now = new Date();
          const currMins = now.getHours() * 60 + now.getMinutes();
          const isMorning = currMins >= 570 && currMins <= 780;   // 09:30 AM - 01:00 PM
          const isAfternoon = currMins >= 870 && currMins <= 1050; // 02:30 PM - 05:30 PM
          const isEvening = currMins >= 1110 && currMins <= 1200;  // 06:30 PM - 08:00 PM
          const isOpdOpen = isMorning || isAfternoon || isEvening;

          return isOpdOpen ? ("""

content_norm = content.replace('\r\n', '\n')
t_norm = target.replace('\r\n', '\n')
r_norm = replacement.replace('\r\n', '\n')

assert t_norm in content_norm, "Target not found in TopBar.jsx"
content_norm = content_norm.replace(t_norm, r_norm)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("SUCCESS: Updated TopBar.jsx")
