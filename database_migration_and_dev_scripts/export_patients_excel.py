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

print("="*60)
print("EXPORTING PATIENT DIRECTORY TO EXCEL (.XLSX)")
print("="*60)

with Session(engine) as session:
    query = text("""
        SELECT 
            patient_uid AS "Patient UID",
            id AS "DB ID",
            name AS "Full Name",
            COALESCE(age, 28) AS "Age",
            COALESCE(gender, 'Not Specified') AS "Gender",
            phone AS "Mobile Number",
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
        "Patient UID", "DB ID", "Full Name", "Age", "Gender", 
        "Mobile Number", "Blood Group", "Residential Address", 
        "Email Address", "Emergency Contact Name", "Emergency Contact Phone", "Known Allergies"
    ]
    data = [dict(zip(columns, row)) for row in result]

df = pd.DataFrame(data)
total_count = len(df)
print(f"Retrieved {total_count} patient records from Neon PostgreSQL.")

# Paths to save
user_docs = os.path.expanduser('~/Documents')
project_docs = os.path.join(os.path.dirname(__file__), '..', 'documents')
os.makedirs(user_docs, exist_ok=True)
os.makedirs(project_docs, exist_ok=True)

excel_user_file = os.path.join(user_docs, 'smart_hospital_patients_records.xlsx')
csv_user_file = os.path.join(user_docs, 'smart_hospital_patients_records.csv')
excel_project_file = os.path.join(project_docs, 'smart_hospital_patients_records.xlsx')
csv_project_file = os.path.join(project_docs, 'smart_hospital_patients_records.csv')

# Also save CSV for instant plain text reading
df.to_csv(csv_user_file, index=False)
df.to_csv(csv_project_file, index=False)
print(f"CSV saved to: {csv_user_file}")

# Generate styled Excel using openpyxl
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Patients Directory"
ws.views.sheetView[0].showGridLines = True

# Title banner
ws.merge_cells('A1:L1')
ws['A1'] = "SMART HOSPITAL QUEUE SYSTEM — OFFICIAL PATIENT CLINICAL DIRECTORY"
ws['A1'].font = Font(name="Segoe UI", size=15, bold=True, color="FFFFFF")
ws['A1'].fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
ws['A1'].alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 36

# Subtitle / Metadata row
ws.merge_cells('A2:L2')
export_time = datetime.now().strftime("%d-%b-%Y %I:%M %p")
ws['A2'] = f"Generated on: {export_time} IST  |  Total Registered Patients: {total_count}  |  UID Range: 100000 - {100000 + total_count - 1}"
ws['A2'].font = Font(name="Segoe UI", size=10, italic=True, color="475569")
ws['A2'].fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
ws['A2'].alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[2].height = 22

# Header styling
headers = list(columns)
ws.append([])  # blank row 3
ws.append(headers)  # row 4
ws.row_dimensions[4].height = 28

header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
thin_border = Border(
    left=Side(style='thin', color='CBD5E1'),
    right=Side(style='thin', color='CBD5E1'),
    top=Side(style='thin', color='CBD5E1'),
    bottom=Side(style='thin', color='CBD5E1')
)

for col_idx in range(1, len(headers) + 1):
    cell = ws.cell(row=4, column=col_idx)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = thin_border

# Data rows with zebra striping
data_font = Font(name="Segoe UI", size=10)
alt_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

for row_idx, row_data in enumerate(df.values.tolist(), start=5):
    ws.row_dimensions[row_idx].height = 20
    is_even = (row_idx % 2 == 0)
    current_fill = alt_fill if is_even else white_fill
    for col_idx, value in enumerate(row_data, start=1):
        cell = ws.cell(row=row_idx, column=col_idx, value=value)
        cell.font = data_font
        cell.fill = current_fill
        cell.border = thin_border
        
        # Center align IDs, phone, gender, blood group, age
        if col_idx in [1, 2, 4, 5, 6, 7]:
            cell.alignment = Alignment(horizontal="center", vertical="center")
        else:
            cell.alignment = Alignment(horizontal="left", vertical="center")

# Auto-fit column widths
for col_idx in range(1, len(headers) + 1):
    col_letter = get_column_letter(col_idx)
    max_len = max(len(str(ws.cell(row=r, column=col_idx).value or '')) for r in range(4, len(df) + 5))
    ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

wb.save(excel_user_file)
wb.save(excel_project_file)

print(f"Excel successfully written to User Documents: {excel_user_file}")
print(f"Excel copy saved to Project Documents:    {excel_project_file}")
print("="*60)
print("EXPORT COMPLETE!")
print("="*60)

