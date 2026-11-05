with open('staff-dashboard/src/pages/Queue.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = """                    <div className="text-xs text-slate-500 mt-0.5">
                      Age: {patient.patient_age || patient.age || 35} yrs • {patient.patient_gender || patient.gender || 'Patient'} • 📞 {patient.contact_phone || "9876543210"}
                    </div>"""

repl1 = """                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        UID: {patient.patient_uid || (patient.patient_id ? (100000 + Number(patient.patient_id)) : '100000')}
                      </span>
                      <span>• Age: {patient.patient_age || patient.age || 35} yrs</span>
                      <span>• {patient.patient_gender || patient.gender || 'Patient'}</span>
                      <span>• 📞 {patient.contact_phone || "9876543210"}</span>
                    </div>"""

target2 = """              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <strong className="text-slate-900">{issuedWalkInPass.patient_name}</strong>
              </div>"""

repl2 = """              <div className="flex justify-between">
                <span className="text-slate-500">Patient UID:</span>
                <strong className="text-blue-700 font-mono">{issuedWalkInPass.patient_uid || (issuedWalkInPass.patient_id ? (100000 + Number(issuedWalkInPass.patient_id)) : '100000')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <strong className="text-slate-900">{issuedWalkInPass.patient_name}</strong>
              </div>"""

def replace_crlf(target, replacement, text):
    if target in text:
        return text.replace(target, replacement, 1)
    elif target.replace('\n', '\r\n') in text:
        return text.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'), 1)
    return text

text = replace_crlf(target1, repl1, text)
text = replace_crlf(target2, repl2, text)

with open('staff-dashboard/src/pages/Queue.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("staff-dashboard/src/pages/Queue.jsx successfully updated!")

