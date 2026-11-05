import os

path = 'staff-dashboard/src/pages/Queue.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """const TIME_SLOTS = [
  "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM"
];"""

replacement = """const TIME_SLOTS = [
  // Morning Session (09:30 AM - 01:00 PM)
  "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  // Afternoon Session (02:30 PM - 05:30 PM)
  "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM",
  // Evening Session (06:30 PM - 08:00 PM)
  "06:30 PM", "07:00 PM", "07:30 PM"
];"""

content_norm = content.replace('\r\n', '\n')
t_norm = target.replace('\r\n', '\n')
r_norm = replacement.replace('\r\n', '\n')

assert t_norm in content_norm, "Target TIME_SLOTS not found"
content_norm = content_norm.replace(t_norm, r_norm)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("SUCCESS: Updated Queue.jsx")
