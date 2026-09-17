import urllib.request
import json

req = urllib.request.urlopen("http://127.0.0.1:8000/doctors")
docs = json.loads(req.read().decode("utf-8"))
print(f"Total Doctors: {len(docs)}")
for d in docs:
    print(f"  [ID: {d['id']}] {d['name']:<22} | Dept: {d['department']:<18} | Room: {d['roomNo']} | Exp: {d['experience']}")

req_staff = urllib.request.urlopen("http://127.0.0.1:8000/staff/doctors")
staff_docs = json.loads(req_staff.read().decode("utf-8"))
print(f"\nStaff Doctors Endpoint: {len(staff_docs)} doctors")
for d in staff_docs:
    print(f"  [ID: {d['id']}] {d['name']:<22} | Dept: {d['department']:<18} | Queue: {d['queue_length']}")
