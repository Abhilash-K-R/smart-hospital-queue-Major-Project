import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_full_paper_docx(output_path):
    doc = Document()
    
    # Page setup - Standard Letter, 0.75 in margins (typical IEEE style)
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
    # Styles setup
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(10)
    font.color.rgb = RGBColor(0, 0, 0)
    
    # ---------------------------------------------------------------------------
    # TITLE
    # ---------------------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(12)
    run_title = p_title.add_run("AI-Driven Hospital OPD Waiting-Time Prediction with Real-Time Travel-Time Estimation and Smart Departure Notifications")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    
    # ---------------------------------------------------------------------------
    # AUTHORS TABLE (5 Columns)
    # ---------------------------------------------------------------------------
    authors_data = [
        ("Dr. R Rajeswari\nProfessor, Dept. of CSE\nShridevi Institute of Engineering and Technology, Tumkur, India\nrajeswarisel@gmail.com"),
        ("Abhilash K R\nDept. of CSE\nShridevi Institute of Engineering and Technology, Tumkur, India\nabhilashkr203@gmail.com"),
        ("Anjanadri T N\nDept. of CSE\nShridevi Institute of Engineering and Technology, Tumkur, India\nanjanadritn@gmail.com"),
        ("Laxuman Ghotale\nDept. of CSE\nShridevi Institute of Engineering and Technology, Tumkur, India\nlaxman9781@gmail.com"),
        ("Naveen L\nDept. of CSE\nShridevi Institute of Engineering and Technology, Tumkur, India\nnaveenlagasanakatte@gmail.com")
    ]
    
    t_auth = doc.add_table(rows=1, cols=5)
    t_auth.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_auth.autofit = False
    
    col_widths = [Inches(1.4), Inches(1.4), Inches(1.4), Inches(1.4), Inches(1.4)]
    for i, col in enumerate(t_auth.columns):
        col.width = col_widths[i]
        
    for i, cell in enumerate(t_auth.rows[0].cells):
        cell.width = col_widths[i]
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.05
        r = p.add_run(authors_data[i])
        r.font.name = 'Times New Roman'
        r.font.size = Pt(8.5)
        set_cell_margins(cell, top=60, bottom=60, left=40, right=40)
        
    # Spacer
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(8)
    p_sp.paragraph_format.space_after = Pt(4)
    
    # ---------------------------------------------------------------------------
    # ABSTRACT & INDEX TERMS
    # ---------------------------------------------------------------------------
    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.space_before = Pt(4)
    p_abs.paragraph_format.space_after = Pt(4)
    p_abs.paragraph_format.line_spacing = 1.15
    
    r_abs_label = p_abs.add_run("Abstract— ")
    r_abs_label.bold = True
    r_abs_label.italic = True
    
    r_abs_text = p_abs.add_run(
        "Outpatient department overcrowding is frequently exacerbated by the lack of coordination between clinical "
        "queue turnover and patient transit times, causing patients to either endure protracted waiting room delays "
        "or arrive late. This paper presents an integrated system that synchronizes machine learning-based consultation "
        "wait-time predictions with real-time geospatial commute estimation to deliver automated departure recommendations. "
        "A Random Forest regressor forecasts residual waiting time using queue length, provider consultation history, "
        "departmental attributes, and temporal features. Evaluated on a 4,000-instance non-linear queue dataset across "
        "an 80/20 train/test partition and 5-fold cross-validation, the proposed Random Forest model achieves a Mean Absolute "
        "Error (MAE) of 5.45 ± 0.20 minutes and an R² of 0.9627 ± 0.0033, outperforming a linear baseline (MAE 16.33 ± 0.59 min, "
        "R² 0.7476) and a Decision Tree (MAE 7.22 ± 0.25 min), while XGBoost achieves 3.11 ± 0.10 minutes. Furthermore, a "
        "trace-driven simulation of patient transit under stochastic traffic conditions demonstrates that the departure "
        "synchronization policy reduces physical waiting-room occupancy by 78.7% (lowering in-hospital waiting from "
        "38.73 ± 41.91 minutes to 8.23 ± 8.19 minutes) while preserving an 83.4% punctuality rate. The findings suggest "
        "the operational viability of coupling queue forecasting with travel-time awareness to reduce outpatient waiting-room occupancy."
    )
    r_abs_text.italic = True
    
    p_idx = doc.add_paragraph()
    p_idx.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_idx.paragraph_format.space_before = Pt(2)
    p_idx.paragraph_format.space_after = Pt(12)
    r_idx_label = p_idx.add_run("Index Terms— ")
    r_idx_label.bold = True
    r_idx_label.italic = True
    r_idx_text = p_idx.add_run("hospital queue management, wait-time prediction, Random Forest, departure-time notification, travel-time estimation, synthetic data, healthcare optimization.")
    r_idx_text.italic = True
    
    # Helper to add section heading
    def add_sec_heading(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.font.bold = True
        return p

    def add_subsec_heading(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.font.italic = True
        return p

    def add_body_p(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        return p

    # ---------------------------------------------------------------------------
    # I. INTRODUCTION
    # ---------------------------------------------------------------------------
    add_sec_heading("I. INTRODUCTION")
    add_body_p(
        "Outpatient departments in busy hospitals are typically organized around loosely estimated wait times "
        "rather than firm schedules. A patient who books an appointment, or simply walks in, is seldom given "
        "more than a vague sense of how long a consultation queue will take, and is almost never told when to "
        "set out for the hospital. This produces two related problems: uncertainty about the length of the wait "
        "and, more consequential in daily life, no guidance on when to leave home so as to arrive neither too "
        "early nor too late."
    )
    add_body_p(
        "The effect is visible in most waiting halls. Patients who leave too early occupy limited seating and "
        "corridor space for long stretches. Patients who leave too late risk losing their position in the queue, "
        "which creates friction with staff and other patients. Digital appointment platforms allow slot booking "
        "and, at best, a coarse queue-position indicator. Departure guidance tied to the patient’s own travel "
        "time is absent from these systems."
    )
    add_body_p(
        "This paper describes a prototype, the AI-Based Smart Hospital Queue Prediction and Patient Arrival Time "
        "Optimization System, that addresses this gap by combining a machine-learning wait-time predictor with a "
        "live travel-time estimate. A Random Forest regressor estimates the remaining wait for a given doctor and "
        "queue position. A background process compares this shrinking estimate with the patient’s current travel "
        "time from the OpenRouteService API and triggers an automated “leave now” push notification. If the queue "
        "subsequently moves faster or slower than predicted, the system recalculates and issues a revised alert. "
        "Because hospital patient privacy restrictions precluded access to institutional records, we evaluate "
        "the wait-time predictor on a 4,000-instance non-linear synthetic queue dataset and evaluate departure "
        "policies via trace-driven simulation."
    )
    add_body_p("The contributions of this paper are:")
    add_body_p(
        "1. Formulation. We frame departure-time guidance as a joint optimization problem built from two dynamically "
        "coupled quantities: the predicted residual wait time and the live commute travel time to the medical center."
    )
    add_body_p(
        "2. Prototype Architecture. We present an end-to-end full-stack prototype that couples an ensemble machine learning "
        "engine with geospatial routing APIs to deliver automated departure alerts (via Web Push and SMS gateway) with real-time drift correction, "
        "emergency queue insertion, and operational delay buffering."
    )
    add_body_p(
        "3. Multi-Model Benchmark and Cross-Validation. We evaluate four regression models (Linear Regression, Decision Tree, "
        "Random Forest, and XGBoost) across an 80/20 train/test split and 5-fold cross-validation, analyzing predictive accuracy "
        "and feature importance."
    )
    add_body_p(
        "4. Quantitative Departure Simulation. We evaluate the operational effectiveness of smart departure scheduling via "
        "trace-driven simulation under stochastic traffic jitter, quantifying waiting-room congestion reduction and patient "
        "arrival punctuality."
    )
    add_body_p(
        "The remainder of this paper is organized as follows. Section II reviews related work. Section III defines the "
        "research gap. Section IV details the proposed system architecture and workflows. Section V outlines the methodology, "
        "models, and simulation setup. Section VI presents experimental results. Section VII discusses operational trade-offs "
        "and threats to validity. Section VIII and Section IX provide conclusion and future work."
    )

    # ---------------------------------------------------------------------------
    # II. RELATED WORK
    # ---------------------------------------------------------------------------
    add_sec_heading("II. RELATED WORK")
    add_body_p(
        "Individual wait-time prediction. A considerable body of work applies supervised learning to individual patient "
        "wait or treatment-time prediction. Handayani et al. used a Random Forest model to estimate ophthalmology treatment "
        "time from demographic and queue features [1]. Hijry and Olawoyin applied deep neural networks to emergency-room "
        "wait-time estimation using a large electronic health record dataset [3]. Chen et al. demonstrated multi-stage patient "
        "treatment and waiting-time forecasting using parallel Random Forest regression in big data hospital queuing systems [5]. "
        "Rastpour and McGregor predicted mental-health-care wait times from highly deidentified records to satisfy privacy "
        "constraints [6]. Joseph et al. compared Random Forest and XGBoost, adding weather as an external predictor, for "
        "outpatient clinics [9]. Li et al. benchmarked Linear Regression, k-Nearest Neighbours, Random Forest and Gradient "
        "Boosting for a children’s hospital, motivated explicitly by helping patients arrive on time [17]. Taton et al. "
        "evaluated regression models and an LSTM on simulation-generated queue data [19]. These studies establish Random Forest "
        "and related ensembles as robust choices for queue regression, and confirm that simulated data is widely used when "
        "clinical hospital records are restricted."
    )
    add_body_p(
        "Aggregate crowding forecasts. A separate strand forecasts department- or hospital-level crowding rather than "
        "an individual patient’s wait. Harrou et al. combined a variational autoencoder with several deep architectures "
        "to forecast emergency department visit volume [2]. Sharafat and Bayati developed PatientFlowNet using deep learning "
        "to forecast emergency department patient flow dynamics, arrivals, boardings, and hospital overcrowding [15]. "
        "Vural et al. built an AI framework predicting hourly and daily emergency-department overcrowding for proactive "
        "staffing [20]. These approaches do not produce an individual wait estimate or a personalized departure alert for a specific patient."
    )
    add_body_p(
        "Explainability and location-aware systems. Sulaiman et al. paired machine learning with rule extraction to make "
        "emergency length-of-stay predictions interpretable [10]. Moreno-Sánchez et al. applied SHAP-based explainable AI "
        "to triage-level admission prediction [11]. Closer to the present work, Teramoto and Kuwata deployed a smartphone "
        "guidance application at a large hospital that uses location information to notify patients as they approach the "
        "facility [7]. However, it engages only after travel has begun, uses no learned wait-time model, and provides no "
        "guidance on when to leave home. Eshghali et al. combined a Random Forest surgery-duration model with GIS-based arrival "
        "estimation for operating-room scheduling [18], demonstrating that prediction can be paired with location estimation, "
        "though for an internal operating theater context."
    )
    add_body_p(
        "Broader literature. Mi et al. examined AI- and IoT-enabled hospital management for COVID-era makeshift facilities [8]. "
        "Kouchaki et al. and Kumar et al. survey AI/IoT healthcare applications and prospective 6G connectivity respectively [12], [14]. "
        "Elalouf and Wachtel review practical approaches and research methodologies for emergency-department queueing [4]. "
        "Adhicandra et al. apply reinforcement learning with a priority queue for dynamic emergency reprioritisation [13]. "
        "Juang et al. use a multimodal deep model to predict unscheduled ED revisits [16]."
    )
    add_body_p("Table I positions the proposed system against the closest related works in the literature.")

    # Table I: Positioning
    p_t1_title = doc.add_paragraph()
    p_t1_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t1_title.paragraph_format.space_before = Pt(6)
    p_t1_title.paragraph_format.space_after = Pt(2)
    r_t1_title = p_t1_title.add_run("TABLE I. POSITIONING AGAINST CLOSEST RELATED WORK")
    r_t1_title.bold = True
    r_t1_title.font.size = Pt(9)

    t1_data = [
        ["Reference", "Predicts Individual Wait", "Uses Travel Time", "Alert Issued from Home"],
        ["[1], [9], [17]", "Yes", "No", "No"],
        ["[2], [15], [20]", "No (Crowd level)", "No", "No"],
        ["[7]", "No (Rule-based)", "Partial (Near hospital)", "No"],
        ["[18]", "Surgery duration", "Location estimate", "No"],
        ["Proposed System", "Yes", "Yes", "Yes"]
    ]
    t1 = doc.add_table(rows=len(t1_data), cols=4)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1.autofit = False
    for r_idx, row in enumerate(t1.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = t1_data[r_idx][c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(8.5)
                if r_idx == 0:
                    r.font.bold = True
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            if r_idx == 0:
                set_cell_background(cell, "F2F2F2")

    # ---------------------------------------------------------------------------
    # III. RESEARCH GAP
    # ---------------------------------------------------------------------------
    add_sec_heading("III. RESEARCH GAP")
    add_body_p(
        "Although existing literature extensively investigates supervised regression models for hospital wait-time prediction [1], [9], [17], "
        "these formulations operate in isolation from patient transit dynamics, providing passive duration estimates that leave arrival "
        "scheduling uncoordinated. Conversely, existing location-aware healthcare systems [7], [18] only engage geofencing mechanisms after "
        "the patient is in transit or adjacent to the medical facility, offering no departure guidance from home. Consequently, there is an "
        "absence of closed-loop frameworks that couple individual queue wait-time forecasting with dynamic origin-to-destination commute "
        "estimation to recommend proactive departure times. This paper addresses this gap by presenting a coupled queue-transit optimization "
        "architecture and evaluating both its predictive regressor against non-linear tree baselines and its departure scheduling efficacy via "
        "trace-driven simulation."
    )

    # ---------------------------------------------------------------------------
    # IV. PROPOSED SYSTEM
    # ---------------------------------------------------------------------------
    add_sec_heading("IV. PROPOSED SYSTEM")
    add_subsec_heading("A. Architecture")
    add_body_p(
        "The prototype architecture comprises a patient-facing web application and an administrative staff dashboard, both "
        "developed with React and Tailwind CSS, interfacing with a Python FastAPI backend service. Neon PostgreSQL, managed "
        "via SQLAlchemy ORM, provides relational persistence for patient profiles, medical practitioner rosters, appointment "
        "bookings, and live queue states. The Random Forest inference module executes in-process within FastAPI. Real-time "
        "commute travel duration is acquired through the OpenRouteService API based on the patient’s geographic coordinates "
        "obtained via browser Geolocation. Automated notifications are dispatched via Web Push and Fast2SMS gateway. "
        "Fig. 1 depicts the system architecture."
    )

    # Insert Architecture Image
    arch_img_path = 'paper_test/extracted_images/image1.png'
    if os.path.exists(arch_img_path):
        p_img1 = doc.add_paragraph()
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.paragraph_format.space_before = Pt(4)
        p_img1.paragraph_format.space_after = Pt(2)
        doc.add_picture(arch_img_path, width=Inches(5.5))
        p_cap1 = doc.add_paragraph()
        p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap1.paragraph_format.space_before = Pt(2)
        p_cap1.paragraph_format.space_after = Pt(6)
        r_c1 = p_cap1.add_run("Fig. 1. End-to-end system architecture showing patient interface, FastAPI backend, ML inference engine, and external routing services.")
        r_c1.font.size = Pt(8.5)
        r_c1.font.italic = True

    add_subsec_heading("B. Patient Workflow")
    add_body_p(
        "A registered patient initiates the workflow by selecting an active symptom category, which maps deterministically "
        "to a specialized clinical department. The system returns available physicians alongside dynamically generated "
        "waiting time ranges. Upon doctor selection, the application captures the user's geographic coordinates, invokes the "
        "Random Forest model to predict residual queue wait time, and queries OpenRouteService for transit duration. The backend "
        "monitors the convergence of remaining wait and commute time, issuing an automated departure notification when the "
        "difference falls within a designated safety margin. On site, the patient confirms arrival via QR code check-in. "
        "Fig. 2 outlines the complete patient operational workflow."
    )

    # Insert Workflow Image
    wf_img_path = 'paper_test/extracted_images/image2.png'
    if os.path.exists(wf_img_path):
        p_img2 = doc.add_paragraph()
        p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img2.paragraph_format.space_before = Pt(4)
        p_img2.paragraph_format.space_after = Pt(2)
        doc.add_picture(wf_img_path, width=Inches(5.0))
        p_cap2 = doc.add_paragraph()
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.paragraph_format.space_before = Pt(2)
        p_cap2.paragraph_format.space_after = Pt(6)
        r_c2 = p_cap2.add_run("Fig. 2. Patient consultation booking, geospatial tracking, and check-in workflow.")
        r_c2.font.size = Pt(8.5)
        r_c2.font.italic = True

    add_subsec_heading("C. Prediction Module")
    add_body_p(
        "Wait-time prediction is formulated as a supervised regression task. A unified Random Forest Regressor is shared "
        "across all clinic doctors, incorporating doctor identifier as a one-hot categorical feature to facilitate zero-shot "
        "scaling for newly registered clinicians without retraining. Feature inputs comprise doctor ID, department, practitioner "
        "historical consultation average, day of week, hour of day, queue depth ahead, and triage patient category (normal vs. emergency)."
    )

    add_subsec_heading("D. Departure Alert Logic")
    add_body_p(
        "The departure scheduling logic follows four sequential stages: (1) Compute estimated wait time Ŵᵢ using the Random Forest regressor; "
        "(2) Query OpenRouteService for real-time driving commute duration T_{i,commute}; (3) Trigger a “Leave Now” alert when the residual wait "
        "converges with commute duration plus an active 10-minute safety buffer (Ŵᵢ ≤ T_{i,commute} + δ_{buffer}); (4) If subsequent queue progression "
        "drifts beyond a 15-minute tolerance threshold due to emergency insertions or physician delays, dispatch a revised departure update."
    )

    add_subsec_heading("E. Staff-Side Operations")
    add_body_p(
        "Administrative staff can dynamically insert emergency patients at the queue apex, triggering automatic queue recalculation "
        "and alert rescheduling for subsequent patients. Automated emergency acuity detection is deliberately excluded to maintain clinical "
        "safety governance, consistent with [13]. Staff can also mark physician delays (injecting operational delay buffers) or flag no-show "
        "patients as skipped to preserve continuous queue flow."
    )

    # ---------------------------------------------------------------------------
    # V. METHODOLOGY
    # ---------------------------------------------------------------------------
    add_sec_heading("V. METHODOLOGY")
    add_subsec_heading("A. Dataset Formulation and Characteristics")
    add_body_p(
        "Because access to institutional electronic health records was constrained by patient privacy and clinical governance regulations [6], "
        "a synthetic outpatient queue dataset was generated following the established simulation methodology in [19]. The generator models "
        "six doctors across five outpatient departments (Cardiology, General Medicine, Orthopedics, Pediatrics, Dermatology), each assigned a "
        "characteristic base consultation duration (8 to 20 minutes). Queue depth ahead of the arriving patient is sampled from a Poisson "
        "distribution (λ = 4). Temporal congestion dynamics are incorporated through hour-of-day multipliers (morning peak: 1.4×, lunch lull: "
        "0.8×, evening rush: 1.3×) and day-of-week multipliers (Monday backlog: 1.3×, weekends: 0.7×). Approximately 7% of arrivals represent "
        "emergency triage cases assigned short wait times (μ = 5 min, σ = 2 min). For standard appointments, wait time is computed "
        "multiplicatively across queue length and temporal factors, with additive Gaussian noise N(0, 3²). The resulting dataset comprises "
        "4,000 instances, reflecting the non-linear, compounding delays typical of outpatient facilities."
    )

    add_subsec_heading("B. Evaluated Machine Learning Regressors")
    add_body_p(
        "To evaluate model performance across differing architectural complexities, four machine learning algorithms were trained on identical one-hot-encoded features:\n"
        "1) Linear Regression (Baseline): Ordinary least squares regression serving as the parametric baseline to evaluate whether additive linear assumptions suffice for outpatient queue estimation.\n"
        "2) Decision Tree Regressor: A non-parametric single-tree model with maximum depth constrained to 10 to evaluate basic recursive partitioning without ensembling.\n"
        "3) Random Forest Regressor (Proposed): A bagged ensemble of 200 decision trees (max depth = 10), combining bootstrap aggregation and random feature sub-selection to mitigate individual tree variance and capture multi-feature interactions.\n"
        "4) Extreme Gradient Boosting (XGBoost): A gradient-boosted decision tree ensemble (200 estimators, max depth = 6, learning rate = 0.1) that optimizes residual errors sequentially using second-order Taylor loss approximations."
    )

    add_subsec_heading("C. Evaluation Protocol and Metrics")
    add_body_p(
        "Experiments were conducted using Python (scikit-learn and xgboost libraries) under two evaluation protocols:\n"
        "1) Held-Out Train/Test Partition: A standard 80/20 train/test split (3,200 training instances, 800 test instances) with a fixed random seed (seed = 42).\n"
        "2) 5-Fold Cross-Validation: 5-fold cross-validation across all 4,000 instances to assess out-of-fold generalization stability and verify that performance is invariant across data partitions.\n\n"
        "Model accuracy is quantified via Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and the coefficient of determination (R²):\n"
        "MAE = (1/n) Σ |yᵢ − ŷᵢ|                                (1)\n"
        "RMSE = √[(1/n) Σ (yᵢ − ŷᵢ)²]                          (2)\n"
        "R² = 1 − [Σ (yᵢ − ŷᵢ)² / Σ (yᵢ − ȳ)²]                 (3)\n"
        "where yᵢ is the observed waiting time, ŷᵢ is the model prediction, and ȳ is the mean waiting time."
    )

    add_subsec_heading("D. Trace-Driven Departure Policy Simulation Framework")
    add_body_p(
        "To quantitatively evaluate the operational effectiveness of commute-synchronized alerts, a trace-driven departure simulation was "
        "conducted on the 800 held-out test patients. For each patient i, the true consultation readiness timestamp is denoted by Wᵢ, and the "
        "model-predicted wait is Ŵᵢ. Commute transit duration from the patient's origin is modeled as T_{i,commute} ~ U(10, 45) minutes, "
        "reflecting realistic suburban-to-hospital travel times, with real-world traffic fluctuations modeled as Gaussian jitter "
        "ε_{traffic} ~ N(0, 3²), yielding actual transit duration T_{i,actual} = max(5, T_{i,commute} + ε_{traffic}).\n\n"
        "Two operational policies are evaluated:\n"
        "- Policy P0 (Uncoordinated Baseline): The patient departs immediately upon booking (t_{depart} = 0) and arrives at hospital t_{arrive} = T_{i,actual}.\n"
        "- Policy P1 (Smart Departure with Safety Buffer): Incorporating the backend application's active 10-minute safety buffer (δ_{buffer} = 10 min for registration, parking, and transit buffer), the patient is advised to depart when residual wait approaches travel time plus buffer:\n"
        "  t_{depart} = max(0, Ŵᵢ − T_{i,commute} − δ_{buffer})\n"
        "  t_{arrive} = t_{depart} + T_{i,actual}\n\n"
        "System performance is assessed via three primary metrics:\n"
        "1) In-Hospital Waiting Time: W_{i,hosp} = max(0, Wᵢ − t_{arrive}), measuring physical waiting room congestion.\n"
        "2) Arrival Lead Time: Lᵢ = Wᵢ − t_{arrive}, measuring arrival precision prior to consultation.\n"
        "3) Punctuality Rate: Percentage of patients arriving before turn (Lᵢ ≥ 0), as well as within a realistic 5-minute clinical grace window (Lᵢ ≥ −5 min)."
    )

    # ---------------------------------------------------------------------------
    # VI. RESULTS
    # ---------------------------------------------------------------------------
    add_sec_heading("VI. RESULTS AND PERFORMANCE EVALUATION")
    add_subsec_heading("A. Model Benchmark on Held-out Test Set")
    add_body_p(
        "Table II summarizes the performance of the evaluated regression architectures on the 800-record held-out test split. The linear regression "
        "baseline achieves an MAE of 16.02 minutes, an RMSE of 21.56 minutes, and an R² of 0.7554, demonstrating the limitation of strictly additive "
        "equations when applied to compounding queue delays. A single Decision Tree substantially improves prediction fidelity, lowering the MAE to "
        "6.99 minutes (R² = 0.9383). The proposed Random Forest regressor achieves an MAE of 5.45 minutes, an RMSE of 7.88 minutes, and an R² of 0.9673, "
        "yielding a 66.0% error reduction relative to the linear baseline. XGBoost achieves the highest accuracy across all metrics, attaining an "
        "MAE of 3.23 minutes, an RMSE of 4.99 minutes, and an R² of 0.9869. These findings establish that tree ensemble models are well-suited for "
        "capturing multiplicative dependencies between queue depth, clinician consultation pace, and diurnal arrival surges."
    )

    # Table II: Benchmark
    p_t2_title = doc.add_paragraph()
    p_t2_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t2_title.paragraph_format.space_before = Pt(6)
    p_t2_title.paragraph_format.space_after = Pt(2)
    r_t2_title = p_t2_title.add_run("TABLE II. MODEL COMPARISON ON HELD-OUT TEST SET (80/20 SPLIT)")
    r_t2_title.bold = True
    r_t2_title.font.size = Pt(9)

    t2_data = [
        ["Model", "MAE (min)", "RMSE (min)", "R²"],
        ["Linear Regression (Baseline)", "16.02", "21.56", "0.7554"],
        ["Decision Tree Regressor", "6.99", "10.83", "0.9383"],
        ["Random Forest (Proposed)", "5.45", "7.88", "0.9673"],
        ["XGBoost Regressor", "3.23", "4.99", "0.9869"]
    ]
    t2 = doc.add_table(rows=len(t2_data), cols=4)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2.autofit = False
    for r_idx, row in enumerate(t2.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = t2_data[r_idx][c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(8.5)
                if r_idx == 0:
                    r.font.bold = True
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            if r_idx == 0:
                set_cell_background(cell, "F2F2F2")

    add_subsec_heading("B. Cross-Validation and Generalization Stability")
    add_body_p(
        "To ensure that performance is not an artifact of a specific train/test partition, Table III presents the 5-fold cross-validation "
        "metrics across all 4,000 dataset instances. The performance hierarchy remains consistent across all five folds. Random Forest demonstrates "
        "high stability, with a mean MAE of 5.45 ± 0.20 minutes, a mean RMSE of 8.42 ± 0.53 minutes, and a mean R² of 0.9627 ± 0.0033. XGBoost "
        "exhibits tight variance bounds as well, achieving a mean MAE of 3.11 ± 0.10 minutes and an R² of 0.9878 ± 0.0026. The low standard deviations "
        "(σ_MAE ≤ 0.20 min across ensemble methods) verify that the models generalize consistently and do not overfit to specific queue subsamples."
    )

    # Table III: 5-Fold CV
    p_t3_title = doc.add_paragraph()
    p_t3_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t3_title.paragraph_format.space_before = Pt(6)
    p_t3_title.paragraph_format.space_after = Pt(2)
    r_t3_title = p_t3_title.add_run("TABLE III. 5-FOLD CROSS-VALIDATION PERFORMANCE (MEAN ± STD)")
    r_t3_title.bold = True
    r_t3_title.font.size = Pt(9)

    t3_data = [
        ["Model", "Mean MAE (min)", "Mean RMSE (min)", "Mean R²"],
        ["Linear Regression (Baseline)", "16.33 ± 0.59", "21.91 ± 0.88", "0.7476 ± 0.0087"],
        ["Decision Tree Regressor", "7.22 ± 0.25", "11.24 ± 0.43", "0.9333 ± 0.0064"],
        ["Random Forest (Proposed)", "5.45 ± 0.20", "8.42 ± 0.53", "0.9627 ± 0.0033"],
        ["XGBoost Regressor", "3.11 ± 0.10", "4.78 ± 0.59", "0.9878 ± 0.0026"]
    ]
    t3 = doc.add_table(rows=len(t3_data), cols=4)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t3.autofit = False
    for r_idx, row in enumerate(t3.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = t3_data[r_idx][c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(8.5)
                if r_idx == 0:
                    r.font.bold = True
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            if r_idx == 0:
                set_cell_background(cell, "F2F2F2")

    add_subsec_heading("C. Error Distribution and Feature Importance")
    add_body_p(
        "Fig. 3 presents the predicted versus actual wait-time scatter plot for the Random Forest model on the held-out test split, showing "
        "close alignment along the identity line (y = x) across both short (< 30 min) and extended (> 120 min) queues. Fig. 4 shows the residual "
        "error distribution (eᵢ = yᵢ − ŷᵢ) plotted against predicted wait times. The residuals remain centered around the zero-error line without displaying severe systematic bias, "
        "with over 85% of predictions falling within a ±7 minute error bound."
    )

    # Insert Fig 3 & Fig 4
    if os.path.exists('paper_test/fig_predicted_vs_actual.png'):
        p_f2 = doc.add_paragraph()
        p_f2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_f2.paragraph_format.space_before = Pt(4)
        p_f2.paragraph_format.space_after = Pt(2)
        doc.add_picture('paper_test/fig_predicted_vs_actual.png', width=Inches(4.5))
        p_c2 = doc.add_paragraph()
        p_c2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_c2.paragraph_format.space_before = Pt(2)
        p_c2.paragraph_format.space_after = Pt(6)
        r_c2 = p_c2.add_run("Fig. 3. Predicted versus actual waiting time for the Random Forest model on the 800-record held-out test set (R² = 0.967, MAE = 5.45 min).")
        r_c2.font.size = Pt(8.5)
        r_c2.font.italic = True

    if os.path.exists('paper_test/fig_residual_plot.png'):
        p_f3 = doc.add_paragraph()
        p_f3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_f3.paragraph_format.space_before = Pt(4)
        p_f3.paragraph_format.space_after = Pt(2)
        doc.add_picture('paper_test/fig_residual_plot.png', width=Inches(4.5))
        p_c3 = doc.add_paragraph()
        p_c3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_c3.paragraph_format.space_before = Pt(2)
        p_c3.paragraph_format.space_after = Pt(6)
        r_c3 = p_c3.add_run("Fig. 4. Residual error distribution of the Random Forest regressor plotted against predicted waiting time.")
        r_c3.font.size = Pt(8.5)
        r_c3.font.italic = True

    add_body_p(
        "The relative feature importance learned by the Random Forest model is headed by queue length ahead of the patient (0.387), followed by "
        "the doctor’s historical average consultation duration (0.180), hour of the day (0.123), normal/emergency patient type indicators (0.159 combined), "
        "and day-of-week indicators (Monday: 0.050, weekend: ~0.052). Departmental indicators contribute marginally on their own (< 0.01 each), confirming "
        "that operational load and individual physician pace are the primary drivers of waiting time."
    )

    add_subsec_heading("D. Quantitative Evaluation of Departure Policies")
    add_body_p(
        "Table IV and Fig. 5 evaluate the clinical queue impact under the simulated commuting policies across the 800 test instances. Under baseline "
        "Policy P0 (immediate departure), patients arrive at the hospital prematurely and endure an average in-hospital waiting room delay of "
        "38.73 ± 41.91 minutes, leading to increased physical waiting-room occupancy.\n\n"
        "Under Policy P1 (Smart Departure with 10-minute safety buffer), the departure recommendation shifts the idle waiting window to the patient's "
        "home. In-hospital physical waiting time is reduced to 8.23 ± 8.19 minutes, representing a 78.7% reduction in physical waiting room occupancy "
        "(saving an average of 30.50 minutes per patient in hospital waiting areas). Patients arrive at the hospital with a mean lead time of 4.92 minutes "
        "prior to consultation. When accounting for travel-time stochasticity within a standard 5-minute clinical grace window, Policy P1 achieves an "
        "overall punctuality rate of 83.4% (73.1% strict arrival prior to turn), suggesting that dynamic departure recommendations may reduce physical "
        "waiting-room occupancy under the simulated conditions."
    )

    # Table IV: Simulation
    p_t4_title = doc.add_paragraph()
    p_t4_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t4_title.paragraph_format.space_before = Pt(6)
    p_t4_title.paragraph_format.space_after = Pt(2)
    r_t4_title = p_t4_title.add_run("TABLE IV. DEPARTURE POLICY SIMULATION EVALUATION (N = 800)")
    r_t4_title.bold = True
    r_t4_title.font.size = Pt(9)

    t4_data = [
        ["Metric", "Policy P0 (Leave Immediately)", "Policy P1 (Smart Departure)"],
        ["Avg. In-Hospital Waiting Time", "38.73 ± 41.91 min", "8.23 ± 8.19 min"],
        ["Avg. Arrival Lead Time", "35.76 min", "4.92 min"],
        ["Strict On-Time Arrival", "79.2%", "73.1%"],
        ["Punctual Arrival (5-min grace)", "79.2%", "83.4%"],
        ["Waiting Room Reduction", "--", "78.7% (-30.50 min)"]
    ]
    t4 = doc.add_table(rows=len(t4_data), cols=3)
    t4.alignment = WD_TABLE_ALIGNMENT.CENTER
    t4.autofit = False
    for r_idx, row in enumerate(t4.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = t4_data[r_idx][c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(8.5)
                if r_idx == 0:
                    r.font.bold = True
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            if r_idx == 0:
                set_cell_background(cell, "F2F2F2")

    # Insert Fig 5 (Simulation)
    if os.path.exists('paper_test/fig_departure_simulation.png'):
        p_f4 = doc.add_paragraph()
        p_f4.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_f4.paragraph_format.space_before = Pt(4)
        p_f4.paragraph_format.space_after = Pt(2)
        doc.add_picture('paper_test/fig_departure_simulation.png', width=Inches(5.5))
        p_c4 = doc.add_paragraph()
        p_c4.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_c4.paragraph_format.space_before = Pt(2)
        p_c4.paragraph_format.space_after = Pt(6)
        r_c4 = p_c4.add_run("Fig. 5. Departure policy simulation comparing Policy P0 (immediate departure) against Policy P1 (smart departure with 10-minute buffer): (a) In-hospital waiting time distribution, and (b) Arrival lead-time density.")
        r_c4.font.size = Pt(8.5)
        r_c4.font.italic = True

    # ---------------------------------------------------------------------------
    # VII. DISCUSSION AND LIMITATIONS
    # ---------------------------------------------------------------------------
    add_sec_heading("VII. DISCUSSION AND LIMITATIONS")
    add_body_p(
        "A. Analysis of Model Behavior and Feature Interactions. The benchmark results confirm that tree-based ensembles "
        "(Random Forest and XGBoost) are fundamentally suited for healthcare queue prediction where consultation times interact "
        "multiplicatively with queue depth, arrival surges, and temporal peak factors. While Linear Regression fails to capture "
        "these compounding effects (MAE = 16.33 min), Random Forest (MAE = 5.45 min) and XGBoost (MAE = 3.11 min) effectively "
        "partition non-linear interaction boundaries. Although XGBoost achieved the highest predictive accuracy, Random Forest was "
        "retained as the primary deployment model because of its lower implementation complexity, interpretability, and stable "
        "performance across cross-validation folds. The feature importance analysis reveals that queue depth ahead (relative importance "
        "0.387) and historical doctor consultation duration (0.180) dominate predictions, followed by time-of-day multipliers (0.123)."
    )
    add_body_p(
        "B. Operational Trade-Offs in Departure Scheduling. The simulation results in Table IV demonstrate the practical trade-off "
        "between physical waiting room decongestion and arrival punctuality. While Policy P0 guarantees high arrival certainty (lead time "
        "35.76 min), it incurs substantial waiting room crowding, elevating discomfort and patient dissatisfaction. Policy P1 reduces physical "
        "waiting room duration to 8.23 minutes by dynamically targeting a 10-minute arrival buffer. The 83.4% punctuality rate under realistic "
        "traffic jitter indicates that dynamic buffering is operationally effective, though adaptive buffers tailored to regional traffic "
        "volatility and specialty turnaround times will further optimize arrival precision."
    )
    add_body_p(
        "C. Threats to Validity and Study Limitations. Several methodological constraints must be emphasized. First, the evaluation relies "
        "on a synthetic 4,000-record dataset generated from synthetic queue dynamics based on Poisson queue arrivals and temporal consultation "
        "assumptions due to institutional patient privacy restrictions; real-world clinic noise, doctor interruptions, and unscheduled patient "
        "walk-ins may introduce additional variance. Second, transit estimates were simulated under calibrated urban commute distributions "
        "and require continuous real-world telemetry during live field trials. Third, while staff-assisted emergency insertion is integrated "
        "into the prototype, automated clinical acuity detection was excluded to maintain clinical safety governance."
    )
    add_body_p(
        "D. Privacy Considerations and Scope. The prototype requires patient geolocation telemetry to calculate travel times. Production deployment "
        "mandates explicit patient consent, strict data retention policies, and static departure fallbacks for patients who decline location sharing. "
        "Current prototype limitations also include lack of direct integration with hospital Electronic Medical Record (EMR) systems and focus on a "
        "single-hospital outpatient setup rather than multi-hospital regional networks."
    )

    # ---------------------------------------------------------------------------
    # VIII. CONCLUSION
    # ---------------------------------------------------------------------------
    add_sec_heading("VIII. CONCLUSION")
    add_body_p(
        "This paper presented an integrated queue management framework that couples machine learning-based wait-time forecasting with "
        "real-time transit awareness to deliver proactive, commute-synchronized departure recommendations for hospital outpatients. "
        "Benchmarked on a 4,000-record queue dataset across multiple architectures and 5-fold cross-validation, the proposed Random Forest "
        "model achieved a Mean Absolute Error of 5.45 ± 0.20 minutes (R² = 0.9627 ± 0.0033), significantly outperforming linear and single-tree "
        "baselines, while gradient-boosted trees achieved an MAE of 3.11 ± 0.10 minutes. A trace-driven simulation of transit dynamics established "
        "that commute-aware departure scheduling reduces physical waiting-room occupancy by 78.7%, lowering average in-hospital waiting from "
        "38.73 minutes to 8.23 minutes while sustaining an 83.4% arrival punctuality rate under realistic traffic variations. The demonstrated "
        "system bridges the gap between passive queue estimation and proactive patient arrival coordination, offering an effective technical "
        "solution to alleviate healthcare facility overcrowding."
    )

    # ---------------------------------------------------------------------------
    # IX. FUTURE WORK
    # ---------------------------------------------------------------------------
    add_sec_heading("IX. FUTURE WORK")
    add_body_p(
        "Future work includes piloting the deployed system within a partner clinical facility, subject to institutional ethical and data-sharing "
        "approvals, to validate model recalibration against continuous real-world queue streams. Future work also includes validation using real "
        "hospital queue records and comparison with additional state-of-the-art boosting and deep-learning architectures. Other technical extensions "
        "involve developing deep sequence models (e.g., LSTMs or Temporal Fusion Transformers) to capture temporal autocorrelation across shift "
        "transitions, implementing dynamic routing buffers that adapt to live traffic congestion indices, integrating multi-hospital load balancing, "
        "and offering SMS-based conversational queue updates for patients without smartphone access."
    )

    # ---------------------------------------------------------------------------
    # ACKNOWLEDGMENT
    # ---------------------------------------------------------------------------
    add_sec_heading("ACKNOWLEDGMENT")
    add_body_p(
        "The authors thank Dr. Rajeswari R, Professor, Department of Computer Science and Engineering, Shridevi Institute of Engineering and "
        "Technology, Tumakuru, for her valuable guidance, supervision, and technical review throughout the conception and implementation of this research."
    )

    # ---------------------------------------------------------------------------
    # REFERENCES
    # ---------------------------------------------------------------------------
    add_sec_heading("REFERENCES")
    refs = [
        "[1] D. P. Handayani, Mustafid, and B. Surarso, “Patient queue systems in hospital using patient treatment time prediction algorithm,” Kinetik: Game Technology, Information System, Computer Network, Computing, Electronics, and Control, vol. 4, no. 3, pp. 275–284, Aug. 2019.",
        "[2] F. Harrou, A. Dairi, F. Kadri, and Y. Sun, “Forecasting emergency department overcrowding: A deep learning framework,” Chaos, Solitons & Fractals, vol. 139, p. 110247, 2020.",
        "[3] H. Hijry and R. Olawoyin, “Predicting patient waiting time in the queue system using deep learning algorithms in the emergency room,” Int. J. Industrial Engineering and Operations Management, vol. 3, no. 1, pp. 33–45, Oct. 2021.",
        "[4] A. Elalouf and G. Wachtel, “Queueing problems in emergency departments: A review of practical approaches and research methodologies,” Operations Research Forum, vol. 3, no. 2, 2022.",
        "[5] J. Chen, K. Li, Z. Tang, K. Bilal, and K. Li, “A parallel patient treatment time prediction algorithm and its applications in hospital queuing-recommendation in a big data environment,” IEEE Access, vol. 4, pp. 1275–1283, 2016, doi: 10.1109/ACCESS.2016.2558199.",
        "[6] A. Rastpour and C. McGregor, “Predicting patient wait times by using highly deidentified data in mental health care: Enhanced machine learning approach,” JMIR Mental Health, vol. 9, no. 8, p. e38428, Aug. 2022.",
        "[7] K. Teramoto and S. Kuwata, “Design and evaluation of a smartphone medical guidance app for outpatients of large-scale medical institutions: Retrospective observational study,” JMIR Formative Research, vol. 6, no. 4, p. e32948, Apr. 2022.",
        "[8] D. Mi, Y. Li, K. Zhang, C. Huang, W. Shan, and J. Zhang, “Exploring intelligent hospital management mode based on artificial intelligence,” Frontiers in Public Health, 2023.",
        "[9] J. Joseph, S. Senith, and A. A. Kirubaraj, “Machine learning for prediction of wait times in outpatient clinic,” Procedia Computer Science, vol. 215, pp. 230–239, 2022.",
        "[10] W. A. Sulaiman et al., “Leveraging machine learning and rule extraction for enhanced transparency in emergency department length of stay prediction,” Frontiers in Digital Health, 2025.",
        "[11] P. A. Moreno-Sánchez, M. Aalto, and M. van Gils, “Prediction of patient flow in the emergency department using explainable artificial intelligence,” DIGITAL HEALTH, vol. 10, pp. 1–18, 2024.",
        "[12] S. Kouchaki, X. Ding, and S. Sanei, “AI- and IoT-enabled solutions for healthcare,” Sensors, vol. 24, no. 8, p. 2607, 2024.",
        "[13] I. Adhicandra et al., “Optimization of hospital queue management using priority queue algorithm and reinforcement learning for emergency service prioritization,” Int. J. Software Engineering and Computer Science, vol. 4, no. 2, pp. 512–522, Aug. 2024.",
        "[14] A. Kumar, M. Masud, M. H. Alsharif, N. Gaur, and A. Nanthaamornphong, “Integrating 6G technology in smart hospitals: Challenges and opportunities for enhanced healthcare services,” Frontiers in Medicine, 2025.",
        "[15] A. R. Sharafat and M. Bayati, “PatientFlowNet: A deep learning approach to patient flow prediction in emergency departments,” IEEE Access, vol. 9, pp. 45552–45561, 2021, doi: 10.1109/ACCESS.2021.3066164.",
        "[16] W.-C. Juang, Z.-X. Cai, C.-M. Chen, and Z.-H. You, “Deep learning for emergency department sustainability: Interpretable prediction of revisit,” Healthcare, vol. 14, no. 4, p. 464, 2026.",
        "[17] X. Li et al., “Prediction of outpatient waiting time: Using machine learning in a tertiary children’s hospital,” Translational Pediatrics, vol. 12, no. 11, pp. 2031–2043, Nov. 2023.",
        "[18] M. Eshghali, D. Kannan, N. Salmanzadeh-Meydani, and A. M. Esmaieeli Sikaroudi, “Machine learning based integrated scheduling and rescheduling for elective and emergency patients in the operating theatre,” Annals of Operations Research, 2023.",
        "[19] T. K. Taton, B. Saha, A. Akter, M. J. Islam, and S. K. Mostaque, “Waiting time prediction in queue management: Leveraging machine learning approach,” in Proc. 2024 Int. Conf. Recent Progresses in Science, Engineering and Technology (ICRPSET), Rajshahi, Bangladesh, Dec. 2024, pp. 1–5.",
        "[20] O. Vural, B. Ozaydin, K. Y. Aram, J. Booth, B. F. Lindsey, and A. Ahmed, “An artificial intelligence-based framework for predicting emergency department overcrowding: Development and evaluation study,” JMIR Medical Informatics, vol. 13, p. e73960, 2025."
    ]
    for r in refs:
        p_ref = doc.add_paragraph()
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.space_before = Pt(1)
        p_ref.paragraph_format.space_after = Pt(2)
        p_ref.paragraph_format.line_spacing = 1.05
        run = p_ref.add_run(r)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(8.5)

    doc.save(output_path)
    print(f"Successfully generated full conference paper docx at: {output_path}")

if __name__ == '__main__':
    target = r'documents/coneference/AI_Driven_Hospital_OPD_Waiting_Time_Prediction_with_Real_Time_Travel_Time_Estimation_and_Smart_Departure_Notifications.docx'
    create_full_paper_docx(target)
    
    # Ensure any temporary _Final file is removed so strictly 2 files remain
    temp_final = r'documents/coneference/AI_Driven_Hospital_OPD_Waiting_Time_Prediction_with_Real_Time_Travel_Time_Estimation_and_Smart_Departure_Notifications_Final.docx'
    if os.path.exists(temp_final):
        os.remove(temp_final)
    print("Rebuilt primary document and ensured strictly 2 files remain.")


