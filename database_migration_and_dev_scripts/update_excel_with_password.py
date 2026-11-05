import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from database import engine
from sqlmodel import Session, text
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

print("="*65)
print("UPDATING EXISTING EXCEL SHEET WITH PASSWORD COLUMN")
print("="*65)

with Session(engine) as session:
    query = text("""
        SELECT 
            patient_uid AS "Patient UID",
            id AS "DB ID",
            name AS "Full Name",
            COALESCE(age, 28) AS "Age",
            COALESCE(gender, 'Not Specified') AS "Gender",
            phone AS "Mobile Number",
            COALESCE(password_hash, 'Not Set') AS "Password (Security Hash)",
            COALESCE(blood_group, 'O+') AS "Blood Group",
            COALESCE(address, 'Tumakuru, Karnataka, India') AS "Residential Address",
            email AS "Email Address",
            COALESCE(emergency_contact_name, 'Not Specified') AS "Emergency Contact Name",
            COALESCE(emergency_contact_phone, 'Not Specified') AS "Emergency Contact Phone",
            COALESCE(allergies, 'None reported') AS "Known Allergies"
        FROM patient
        ORDER BY CAST(patient_uid AS INTEGER) ASC;
    """)
    result = session.execute(query).fetchall()
    columns = [
        "Patient UID", 
        "DB ID", 
        "Full Name", 
        "Age", 
        "Gender", 
        "Mobile Number", 
        "Password (Security Hash)",  # Immediate after Mobile Number
        "Blood Group", 
        "Residential Address", 
        "Email Address", 
        "Emergency Contact Name", 
        "Emergency Contact Phone", 
        "Known Allergies"
    ]
    data = [dict(zip(columns, row)) for row in result]

df = pd.DataFrame(data)
total_count = len(df)
print(f"Retrieved {total_count} patient records with password credentials.")

# Target paths
user_docs = os.path.expanduser('~/Documents')
project_docs = os.path.join(os.path.dirname(__file__), '..', 'documents')

excel_user_file = os.path.join(user_docs, 'smart_hospital_patients_records.xlsx')
csv_user_file = os.path.join(user_docs, 'smart_hospital_patients_records.csv')
excel_project_file = os.path.join(project_docs, 'smart_hospital_patients_records.xlsx')
csv_project_file = os.path.join(project_docs, 'smart_hospital_patients_records.csv')

# Update CSV in place
df.to_csv(csv_user_file, index=False)
df.to_csv(csv_project_file, index=False)
print(f"Updated CSV file: {csv_user_file}")

# Update existing Excel workbook with single sheet
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Patients Directory"
ws.views.sheetView[0].showGridLines = True

# Title banner across columns A to M (13 columns)
ws.merge_cells('A1:M1')
ws['A1'] = "SMART HOSPITAL QUEUE SYSTEM — OFFICIAL PATIENT CLINICAL DIRECTORY"
ws['A1'].font = Font(name="Segoe UI", size=15, bold=True, color="FFFFFF")
ws['A1'].fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
ws['A1'].alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 36

# Subtitle / Metadata row
ws.merge_cells('A2:M2')
export_time = datetime.now().strftime("%d-%b-%Y %I:%M %p")
ws['A2'] = f"Generated on: {export_time} IST  |  Total Patients: {total_count}  |  UID Range: 100000 - {100000 + total_count - 1}  |  Includes Security Credentials"
ws['A2'].font = Font(name="Segoe UI", size=10, italic=True, color="475569")
ws['A2'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
ws['A2'].alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[2].height = 22

# Header row
headers = list(columns)
ws.append([])  # blank row 3
ws.append(headers)  # row 4
ws.row_dimensions[4].height = 28

header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
header_fill_standard = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
# Highlight Password column in distinctive security indigo
header_fill_password = PatternFill(start_color="4338CA", end_color="4338CA", fill_type="solid")

thin_border = Border(
    left=Side(style='thin', color='CBD5E1'),
    right=Side(style='thin', color='CBD5E1'),
    top=Side(style='thin', color='CBD5E1'),
    bottom=Side(style='thin', color='CBD5E1')
)

for col_idx in range(1, len(headers) + 1):
    cell = ws.cell(row=4, column=col_idx)
    cell.font = header_font
    cell.fill = header_fill_password if headers[col_idx - 1] == "Password (Security Hash)" else header_fill_standard
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = thin_border

# Data rows with zebra striping
data_font = Font(name="Segoe UI", size=10)
mono_font = Font(name="Consolas", size=9, color="312E81")  # Monospace for password hash
alt_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
pwd_fill = PatternFill(start_color="EEF2FF", end_color="EEF2FF", fill_type="solid")

for row_idx, row_data in enumerate(df.values.tolist(), start=5):
    ws.row_dimensions[row_idx].height = 20
    is_even = (row_idx % 2 == 0)
    current_fill = alt_fill if is_even else white_fill
    
    for col_idx, value in enumerate(row_data, start=1):
        cell = ws.cell(row=row_idx, column=col_idx, value=value)
        col_name = headers[col_idx - 1]
        cell.border = thin_border
        
        if col_name == "Password (Security Hash)":
            cell.font = mono_font
            cell.fill = pwd_fill
            cell.alignment = Alignment(horizontal="left", vertical="center")
        elif col_name in ["Patient UID", "DB ID", "Age", "Gender", "Mobile Number", "Blood Group"]:
            cell.font = data_font
            cell.fill = current_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
        else:
            cell.font = data_font
            cell.fill = current_fill
            cell.alignment = Alignment(horizontal="left", vertical="center")

# Auto-fit column widths
for col_idx in range(1, len(headers) + 1):
    col_letter = get_column_letter(col_idx)
    col_name = headers[col_idx - 1]
    if col_name == "Password (Security Hash)":
        ws.column_dimensions[col_letter].width = 38
    else:
        max_len = max(len(str(ws.cell(row=r, column=col_idx).value or '')) for r in range(4, len(df) + 5))
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

wb.save(excel_user_file)
wb.save(excel_project_file)

print(f"Updated Excel in User Documents:    {excel_user_file}")
print(f"Updated Excel in Project Documents: {excel_project_file}")
print("="*65)
print("SUCCESSFULLY UPDATED EXISTING EXCEL SHEET WITH PASSWORD COLUMN!")
print("="*65)

