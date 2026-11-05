import docx
import os
import re

doc_path = r'documents/coneference/AI_Driven_Hospital_OPD_Waiting_Time_Prediction_with_Real_Time_Travel_Time_Estimation_and_Smart_Departure_Notifications_Final.docx'
doc = docx.Document(doc_path)
print(f'File size: {os.path.getsize(doc_path)} bytes')
print(f'Paragraph count: {len(doc.paragraphs)}')
print(f'Table count: {len(doc.tables)}')

full_text = '\n'.join([p.text for p in doc.paragraphs])
for t in doc.tables:
    for row in t.rows:
        full_text += '\n' + ' | '.join([c.text.strip() for c in row.cells])

# 1. Forbidden terms check
forbidden_patterns = [
    r'\b4\.69\b',
    r'(?<!1)6\.33(?!\d)',  # 6.33 not preceded by 1 (so not 16.33)
    r'\b10\.64\b',
    r'\b14\.80\b',
    r'\b0\.810\b',
    r'\b0\.965\b',
    r'not evaluated quantitatively',
    r'clinical efficacy',
    r'stratified 5-fold',
    r'homoscedastic behavior',
    r'log-normal consultation'
]

for pat in forbidden_patterns:
    matches = re.findall(pat, full_text, re.IGNORECASE)
    print(f'Check forbidden pattern "{pat}": count = {len(matches)}')
    assert len(matches) == 0, f'Found forbidden pattern {pat}: {matches}'

# 2. Required terms check (including the 5 new corrections)
required = [
    'AI-Driven Hospital OPD Waiting-Time Prediction with Real-Time Travel-Time Estimation and Smart Departure Notifications',
    'suggest the operational viability of coupling queue forecasting with travel-time awareness to reduce outpatient waiting-room occupancy',
    '5-fold cross-validation across all 4,000 instances',
    'The residuals remain centered around the zero-error line without displaying severe systematic bias',
    'generated from synthetic queue dynamics based on Poisson queue arrivals and temporal consultation assumptions',
    'Future work also includes validation using real hospital queue records and comparison with additional state-of-the-art boosting and deep-learning architectures',
    'leading to increased physical waiting-room occupancy',
    'suggesting that dynamic departure recommendations may reduce physical waiting-room occupancy under the simulated conditions',
    'Although XGBoost achieved the highest predictive accuracy, Random Forest was retained as the primary deployment model',
    '10.1109/ACCESS.2016.2558199',
    '10.1109/ACCESS.2021.3066164',
    'TABLE II. MODEL COMPARISON ON HELD-OUT TEST SET',
    'TABLE III. 5-FOLD CROSS-VALIDATION PERFORMANCE',
    'TABLE IV. DEPARTURE POLICY SIMULATION EVALUATION'
]

for req in required:
    present = req in full_text
    print(f'Check required "{req[:45]}...": {present}')
    assert present, f'Missing required text: {req}'

# 3. Images check
img_count = sum(1 for rel in doc.part.rels.values() if 'image' in rel.target_ref)
print(f'Embedded images count: {img_count}')
assert img_count >= 5, f'Expected at least 5 images, found {img_count}'

print('\nALL 5 REFINEMENT CHECKS & GENERAL QUALITY AUDITS PASSED 100%!')
