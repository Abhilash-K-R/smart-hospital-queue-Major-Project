import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Color Palette
    BG_LIGHT = RGBColor(248, 250, 252)       # Slate 50
    TEXT_DARK = RGBColor(15, 23, 42)         # Slate 900
    TEXT_MUTED = RGBColor(71, 85, 105)       # Slate 600
    NAVY_PRIMARY = RGBColor(30, 58, 138)     # Blue 900
    ACCENT_BLUE = RGBColor(37, 99, 235)      # Blue 600
    ACCENT_TEAL = RGBColor(13, 148, 136)     # Teal 600
    CARD_BG = RGBColor(255, 255, 255)        # White
    CARD_BORDER = RGBColor(226, 232, 240)    # Slate 200
    HEADER_BG = RGBColor(15, 23, 42)         # Dark Slate for Title Slide

    def set_slide_background(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, slide_num, title_text, category_text="MAJOR PROJECT PHASE 2 REVIEW"):
        # Header text
        tx_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(1.1))
        tf = tx_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        # Category / Number
        p_cat = tf.paragraphs[0]
        p_cat.text = f"{category_text.upper()} | SLIDE {slide_num}"
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_TEAL
        p_cat.font.name = "Arial"
        
        # Main Slide Title
        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = NAVY_PRIMARY
        p_title.font.name = "Arial"
        p_title.space_before = Pt(4)

        # Top Accent Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.73), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = ACCENT_BLUE
        line.line.color.rgb = ACCENT_BLUE

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide (Dark Theme)
    # -------------------------------------------------------------
    slide1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide1, HEADER_BG)

    # Title Banner
    tbox = slide1.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(2.2))
    tf = tbox.text_frame
    tf.word_wrap = True
    
    p0 = tf.paragraphs[0]
    p0.text = "VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_TEAL
    
    p1 = tf.add_paragraph()
    p1.text = "AI-Based Smart Hospital Queue Prediction and\nPatient Arrival Time Optimization System"
    p1.font.size = Pt(28)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)
    p1.space_before = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "Major Project Phase 2 Presentation | Academic Year 2025–2026"
    p2.font.size = Pt(13)
    p2.font.color.rgb = RGBColor(148, 163, 184)
    p2.space_before = Pt(6)

    # Cards for Students & Guide
    # Card 1: Students
    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.4), Inches(5.6), Inches(3.4))
    card1.fill.solid()
    card1.fill.fore_color.rgb = RGBColor(30, 41, 59)
    card1.line.color.rgb = RGBColor(51, 65, 85)
    tf1 = card1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_right = tf1.margin_top = Inches(0.3)
    
    pt = tf1.paragraphs[0]
    pt.text = "PROJECT ASSOCIATES (Dept. of CSE)"
    pt.font.size = Pt(12)
    pt.font.bold = True
    pt.font.color.rgb = ACCENT_TEAL
    
    students = [
        ("Abhilash K R", "Lead, ML & Backend Architecture"),
        ("Anjanadri T N", "Database & System Infrastructure"),
        ("Laxuman Ghotale", "Patient App Frontend UI/UX"),
        ("Naveen L", "Staff Dashboard & Quality Assurance")
    ]
    for name, role in students:
        p = tf1.add_paragraph()
        p.text = f"• {name}  –  {role}"
        p.font.size = Pt(11)
        p.font.color.rgb = RGBColor(241, 245, 249)
        p.space_before = Pt(6)

    # Card 2: Guide & Institution
    card2 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(3.4), Inches(5.7), Inches(3.4))
    card2.fill.solid()
    card2.fill.fore_color.rgb = RGBColor(30, 41, 59)
    card2.line.color.rgb = RGBColor(51, 65, 85)
    tf2 = card2.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_right = tf2.margin_top = Inches(0.3)
    
    pg = tf2.paragraphs[0]
    pg.text = "UNDER THE GUIDANCE OF"
    pg.font.size = Pt(12)
    pg.font.bold = True
    pg.font.color.rgb = ACCENT_TEAL

    p_guide = tf2.add_paragraph()
    p_guide.text = "Dr. R. Rajeswari"
    p_guide.font.size = Pt(16)
    p_guide.font.bold = True
    p_guide.font.color.rgb = RGBColor(255, 255, 255)
    p_guide.space_before = Pt(6)

    p_guide_sub = tf2.add_paragraph()
    p_guide_sub.text = "Professor, Department of Computer Science & Engineering"
    p_guide_sub.font.size = Pt(11)
    p_guide_sub.font.color.rgb = RGBColor(203, 213, 225)

    p_inst = tf2.add_paragraph()
    p_inst.text = "\nShridevi Institute of Engineering & Technology (SIET)\nSira Road, Tumakuru – 572106, Karnataka"
    p_inst.font.size = Pt(11)
    p_inst.font.color.rgb = RGBColor(148, 163, 184)
    p_inst.space_before = Pt(8)

    # -------------------------------------------------------------
    # SLIDE 2: Introduction
    # -------------------------------------------------------------
    slide2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide2, BG_LIGHT)
    add_header(slide2, 2, "Introduction & Background")

    # 3 Column Cards
    col_w = Inches(3.7)
    gap = Inches(0.3)
    left_start = Inches(0.8)

    cards_data = [
        ("The Outpatient Reality", [
            "Hospital Outpatient Departments (OPDs) operate on dynamic, loosely estimated queues rather than strict timetables.",
            "High patient influx leads to severe lobby crowding, seating shortages, and increased risk of nosocomial infections.",
            "Patients face complete uncertainty regarding their actual consultation turn."
        ]),
        ("The Core Missing Link", [
            "Patients are never advised when to actually leave their homes.",
            "Leaving too early results in 1 to 3 hours of exhausting waiting-room idle time.",
            "Leaving too late causes missed queue slots, doctor schedule disturbances, and administrative friction."
        ]),
        ("Our Core Novelty", [
            "Couples Random Forest wait-time regression with Google Maps live travel time estimation.",
            "Delivers a proactive, personalized 'Leave Now' alert right when travel time converges with remaining wait time.",
            "Drift correction automatically updates patients if emergencies or doctor delays shift the queue."
        ])
    ]

    for i, (head, bullets) in enumerate(cards_data):
        c = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_start + i*(col_w+gap), Inches(1.8), col_w, Inches(5.1))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tframe = c.text_frame
        tframe.word_wrap = True
        tframe.margin_left = tframe.margin_right = tframe.margin_top = Inches(0.3)

        p = tframe.paragraphs[0]
        p.text = head
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

        for b in bullets:
            bp = tframe.add_paragraph()
            bp.text = f"• {b}"
            bp.font.size = Pt(11)
            bp.font.color.rgb = TEXT_DARK
            bp.space_before = Pt(8)

    # -------------------------------------------------------------
    # SLIDE 3: Problem Statement
    # -------------------------------------------------------------
    slide3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide3, BG_LIGHT)
    add_header(slide3, 3, "Problem Statement & Gap Analysis")

    box_left = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.1))
    box_left.fill.solid()
    box_left.fill.fore_color.rgb = CARD_BG
    box_left.line.color.rgb = CARD_BORDER
    tl = box_left.text_frame
    tl.word_wrap = True
    tl.margin_left = tl.margin_right = tl.margin_top = Inches(0.3)

    p = tl.paragraphs[0]
    p.text = "EXISTING SYSTEM LIMITATIONS"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(220, 38, 38) # Red accent

    limits = [
        ("Static or Vague Wait Estimates", "Existing apps (e.g., Practo) provide generic appointment slots without factoring in live consultation delays or peak-hour surges."),
        ("No Location / Travel Awareness", "Systems do not account for where the patient resides or current road traffic conditions between home and hospital."),
        ("Fragility to Triage Disruptions", "Walk-in emergency cases or doctor delays immediately invalidate manual estimates, leaving patients uninformed."),
        ("Lounge Overcrowding", "Patients crowd waiting areas hours in advance due to fear of losing their queue turn.")
    ]
    for title, desc in limits:
        pt = tl.add_paragraph()
        pt.text = f"❌ {title}"
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_DARK
        pt.space_before = Pt(8)
        pd = tl.add_paragraph()
        pd.text = desc
        pd.font.size = Pt(10)
        pd.font.color.rgb = TEXT_MUTED

    box_right = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.1))
    box_right.fill.solid()
    box_right.fill.fore_color.rgb = CARD_BG
    box_right.line.color.rgb = CARD_BORDER
    tr = box_right.text_frame
    tr.word_wrap = True
    tr.margin_left = tr.margin_right = tr.margin_top = Inches(0.3)

    pr = tr.paragraphs[0]
    pr.text = "FORMAL PROBLEM STATEMENT"
    pr.font.size = Pt(13)
    pr.font.bold = True
    pr.font.color.rgb = ACCENT_BLUE

    needs = [
        "To develop an AI-powered healthcare dispatch ecosystem that eliminates outpatient waiting-room congestion by dynamically predicting patient wait time using Random Forest regression and continuously tracking live travel time.",
        "The system must compute the exact convergence point (Predicted Wait ≈ Travel Time) and dispatch a single, actionable 'Leave Now' alert, while maintaining dynamic drift resilience during staff triage emergencies and clinical delays."
    ]
    for n in needs:
        pn = tr.add_paragraph()
        pn.text = f"💡 {n}"
        pn.font.size = Pt(11)
        pn.font.color.rgb = TEXT_DARK
        pn.space_before = Pt(12)

    # -------------------------------------------------------------
    # SLIDE 4: Objectives
    # -------------------------------------------------------------
    slide4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide4, BG_LIGHT)
    add_header(slide4, 4, "Project Objectives & Scope")

    obj_cards = [
        ("Objective 1: Machine Learning Wait-Time Model", "Train a scikit-learn Random Forest Regressor on historical doctor pace, department, queue length, day, and time-of-day to predict wait times within a bounded range (±15%) with explainability."),
        ("Objective 2: Travel-Time-Aware Departure Engine", "Integrate Google Maps Distance Matrix API to continuously monitor home-to-hospital commute duration and trigger a proactive 'Leave Now' alert upon convergence."),
        ("Objective 3: Robust Staff Triage & Disruption Control", "Provide hospital staff with real-time controls for emergency walk-in insertion (atomic queue bumping), doctor delay overlays, and patient skip actions with zero downtime."),
        ("Objective 4: Dual Multi-Channel Dispatch Alerting", "Deliver synchronized, rich WhatsApp notifications (with 1-click Google Maps navigation) and compact GSM SMS alerts ensuring 100% patient accessibility.")
    ]

    for i, (title, desc) in enumerate(obj_cards):
        y_pos = Inches(1.8 + i * 1.3)
        c = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y_pos, Inches(11.7), Inches(1.15))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.2)
        
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = NAVY_PRIMARY
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(2)

    # -------------------------------------------------------------
    # SLIDE 5: Literature Survey
    # -------------------------------------------------------------
    slide5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide5, BG_LIGHT)
    add_header(slide5, 5, "Literature Survey & Research Gap")

    # Table for Literature Survey
    rows, cols = 6, 5
    table_shape = slide5.shapes.add_table(rows, cols, Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.1))
    table = table_shape.table
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(1.0)
    table.columns[2].width = Inches(2.3)
    table.columns[3].width = Inches(3.2)
    table.columns[4].width = Inches(3.0)

    headers = ["Author & Paper", "Year", "Methodology / Tool", "Major Findings", "Identified Research Gap"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY_PRIMARY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)

    lit_data = [
        ("Handayani et al. [1]", "2019", "Random Forest Regressor", "Predicted ophthalmology treatment time accurately from demographic features.", "No live queue dynamics or travel time awareness."),
        ("Teramoto & Kuwata [7]", "2022", "Smartphone GPS Check-in", "Alerted patients 10 mins before turn when within 500m of hospital.", "No home departure guidance; no learned ML wait-time model."),
        ("Joseph et al. [9]", "2022", "Random Forest & XGBoost", "Outperformed linear baselines in outpatient clinic wait prediction.", "Static predictions; lacks patient-facing departure alerts."),
        ("Eshghali et al. [18]", "2023", "RF + GIS Operating Scheduling", "Combined surgery duration model with GIS arrival for OR scheduling.", "Applied to internal surgery scheduling, not OPD home dispatch."),
        ("PROPOSED SYSTEM", "2026", "Random Forest + Distance Matrix API", "Achieved MAE 4.69m (56% improvement) with proactive leave alerts.", "Closes the gap: First system combining ML wait prediction with live home travel.")
    ]

    for i, row in enumerate(lit_data):
        for j, val in enumerate(row):
            cell = table.cell(i+1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(241, 245, 249) if i % 2 == 0 else RGBColor(255, 255, 255)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(9.5)
            p.font.color.rgb = NAVY_PRIMARY if i == 4 else TEXT_DARK
            if i == 4:
                p.font.bold = True

    # -------------------------------------------------------------
    # SLIDE 6: Existing System vs Proposed System
    # -------------------------------------------------------------
    slide6 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide6, BG_LIGHT)
    add_header(slide6, 6, "Existing System vs. Proposed System")

    # Left Box: Existing
    c_ex = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.1))
    c_ex.fill.solid()
    c_ex.fill.fore_color.rgb = CARD_BG
    c_ex.line.color.rgb = CARD_BORDER
    tf_ex = c_ex.text_frame
    tf_ex.word_wrap = True
    tf_ex.margin_left = tf_ex.margin_top = Inches(0.3)
    
    p = tf_ex.paragraphs[0]
    p.text = "EXISTING APPROACH (e.g. Practo, Manual OPD)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(220, 38, 38)

    ex_points = [
        "Fixed Time Slots: Allocates rigid slots (e.g., 10:00 AM) that ignore real-time consultation delays.",
        "Zero Commute Intelligence: Does not calculate whether a patient lives 2 km or 30 km away.",
        "Blind Waiting: Patients arrive hours early, causing severe lobby overcrowding and infectious exposure.",
        "Unresponsive to Emergencies: If an acute trauma patient enters, regular patients are neither informed nor dynamically rescheduled.",
        "Opaque Estimates: Displays bare token numbers without explaining wait-time factors."
    ]
    for pt in ex_points:
        p = tf_ex.add_paragraph()
        p.text = f"• {pt}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_before = Pt(8)

    # Right Box: Proposed
    c_pr = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.1))
    c_pr.fill.solid()
    c_pr.fill.fore_color.rgb = CARD_BG
    c_pr.line.color.rgb = CARD_BORDER
    tf_pr = c_pr.text_frame
    tf_pr.word_wrap = True
    tf_pr.margin_left = tf_pr.margin_top = Inches(0.3)

    p = tf_pr.paragraphs[0]
    p.text = "PROPOSED NOVEL SYSTEM"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_TEAL

    pr_points = [
        "ML Wait Regression: Random Forest predicts dynamic wait time based on doctor pace and queue depth.",
        "Live Travel Convergence: Continuously compares wait time against Google Maps travel duration.",
        "Proactive Departure Notification: Patient relaxes at home; alert fires exactly when it is time to leave.",
        "Atomic Emergency Bumping: Staff inserts emergency cases at Position #1, shifting regular queues instantly.",
        "Two-Tier Delay Overlay: Staff doctor delays are cleanly layered on top of the statistical baseline.",
        "Explainable AI: Each prediction includes an intuitive reason (e.g., doctor pace, peak-hour load)."
    ]
    for pt in pr_points:
        p = tf_pr.add_paragraph()
        p.text = f"✓ {pt}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_before = Pt(6)

    # -------------------------------------------------------------
    # SLIDE 7: System Architecture
    # -------------------------------------------------------------
    slide7 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide7, BG_LIGHT)
    add_header(slide7, 7, "System Architecture & Data Flow")

    # 4 Architecture Blocks
    blocks = [
        ("Layer 1: User Interfaces", "React.js + Tailwind CSS", [
            "Patient Web App: Symptom triage, doctor booking, live countdown card, leave-now alert.",
            "Staff Triage Portal: Live OPD monitor, emergency insertion, doctor disruption manager."
        ]),
        ("Layer 2: API Gateway & Core", "Python FastAPI (Port 8000)", [
            "28 REST Endpoints handling Authentication (JWT), Queue State, and Triage Engine.",
            "Two-Tier Hybrid Architecture: apply_operational_delay_overlay() for live doctor disruptions."
        ]),
        ("Layer 3: Machine Learning Engine", "Scikit-Learn Random Forest", [
            "Embedded model (wait_time_model.pkl) predicting consultation wait within ±15% band.",
            "Poisson-distributed queue modeling (4,000 records) achieving R² = 0.965."
        ]),
        ("Layer 4: Data & External Services", "Neon PostgreSQL & Google Maps", [
            "7 Relational Tables: Patients, Doctors, Departments, Symptoms, Appointments, QueueLogs, Staff.",
            "Google Maps Distance Matrix & Geolocation API for real-time commute calculation."
        ])
    ]

    for i, (title, sub, items) in enumerate(blocks):
        x = Inches(0.8 + (i % 2) * 6.0)
        y = Inches(1.8 + (i // 2) * 2.6)
        c = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.7), Inches(2.4))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.2)

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = NAVY_PRIMARY

        p_sub = tf.add_paragraph()
        p_sub.text = sub
        p_sub.font.size = Pt(9.5)
        p_sub.font.bold = True
        p_sub.font.color.rgb = ACCENT_TEAL
        p_sub.space_before = Pt(1)

        for it in items:
            p = tf.add_paragraph()
            p.text = f"• {it}"
            p.font.size = Pt(9.5)
            p.font.color.rgb = TEXT_DARK
            p.space_before = Pt(4)

    # -------------------------------------------------------------
    # SLIDE 8: Methodology & Algorithms
    # -------------------------------------------------------------
    slide8 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide8, BG_LIGHT)
    add_header(slide8, 8, "Methodology & Algorithmic Workflow")

    steps = [
        ("Step 1: Patient Symptom Triage", "Patient selects clinical symptom (e.g. Chest Pain) -> System maps to appropriate department via admin-configurable lookup table."),
        ("Step 2: ML Wait-Time Prediction", "Random Forest Regressor (200 trees, depth 10) predicts remaining wait from doctor pace, day, hour, queue depth, and patient type."),
        ("Step 3: Distance & Commute Calculation", "System queries Google Maps Distance Matrix API using patient GPS coordinates and hospital location (13.376230, 77.097439)."),
        ("Step 4: Convergence & Departure Trigger", "Algorithm evaluates: If Travel Time >= Predicted Wait - Buffer -> Fire 'LEAVE NOW' Alert via Push, WhatsApp, and SMS."),
        ("Step 5: Dynamic Disruption Adaptation", "If emergency inserted at triage, queue position atomically shifts (+1); departure engine recalculates and pushes revised advisory.")
    ]

    for i, (st, desc) in enumerate(steps):
        y = Inches(1.8 + i * 1.05)
        c = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.7), Inches(0.95))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.15)

        p = tf.paragraphs[0]
        p.text = st
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

        pd = tf.add_paragraph()
        pd.text = desc
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 9: Technologies Used
    # -------------------------------------------------------------
    slide9 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide9, BG_LIGHT)
    add_header(slide9, 9, "Technology Stack & Tools")

    tech_categories = [
        ("Frontend Technologies", [
            ("React 18 & Vite", "High-performance Single Page Applications"),
            ("Tailwind CSS", "Modern responsive UI design system"),
            ("Lucide React Icons", "Visual clinical & telemetry iconography")
        ]),
        ("Backend & APIs", [
            ("Python 3.11 & FastAPI", "Asynchronous, high-throughput REST API"),
            ("SQLModel / SQLAlchemy", "Type-safe database ORM and relations"),
            ("Jose & Passlib", "JWT Bearer auth & bcrypt password hashing")
        ]),
        ("Machine Learning", [
            ("Scikit-Learn", "Random Forest Regressor (200 estimators)"),
            ("Pandas & NumPy", "One-hot encoding & matrix operations"),
            ("Joblib", "Serialized model serialization (.pkl)")
        ]),
        ("Cloud & Infrastructure", [
            ("Neon PostgreSQL", "Serverless cloud relational database"),
            ("Google Maps APIs", "Distance Matrix & Geolocation APIs"),
            ("GitHub Actions", "Version control, branching & CI/CD")
        ])
    ]

    for i, (cat, items) in enumerate(tech_categories):
        x = Inches(0.8 + i * 2.95)
        c = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.8), Inches(2.8), Inches(5.1))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.25)

        p = tf.paragraphs[0]
        p.text = cat
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

        for name, d in items:
            pn = tf.add_paragraph()
            pn.text = f"• {name}"
            pn.font.size = Pt(10.5)
            pn.font.bold = True
            pn.font.color.rgb = TEXT_DARK
            pn.space_before = Pt(8)

            pd = tf.add_paragraph()
            pd.text = d
            pd.font.size = Pt(9)
            pd.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 10: Module Description
    # -------------------------------------------------------------
    slide10 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide10, BG_LIGHT)
    add_header(slide10, 10, "System Module Description")

    mods = [
        ("1. Patient Portal & Booking Module", "Handles patient authentication, symptom-guided department routing, doctor selection, appointment scheduling, and live token generation."),
        ("2. Machine Learning Wait-Time Engine", "Embedded scikit-learn model executing real-time wait estimation using one-hot encoded clinical parameters, returning a bounded wait range with explanations."),
        ("3. Departure Optimization & Alerting Module", "Calculates Haversine/Distance Matrix commute times, compares against remaining queue wait, and dispatches proactive 'Leave Now' alerts with navigation links."),
        ("4. Staff Triage & Disruption Management", "Empowers triage staff with emergency patient front-of-line insertion, doctor delay buffering (+15m/+30m), and queue advancement ('Call Next')."),
        ("5. Post-Consultation Audit & Retraining Module", "Logs actual consultation start times against ML predictions into the 'queue_logs' table to evaluate model accuracy and support periodic retraining.")
    ]

    for i, (title, desc) in enumerate(mods):
        y = Inches(1.8 + i * 1.05)
        c = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.7), Inches(0.95))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.15)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

        pd = tf.add_paragraph()
        pd.text = desc
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 11: Database Design & Schema
    # -------------------------------------------------------------
    slide11 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide11, BG_LIGHT)
    add_header(slide11, 11, "Database Design (7 SQLModel Relational Tables)")

    db_tables = [
        ("patients", "id (PK), name, phone, email, password_hash, created_at"),
        ("doctors", "id (PK), name, department_id (FK), avg_consult_minutes, room, qualification"),
        ("departments", "id (PK), name, code, description"),
        ("symptom_mapping", "id (PK), symptom_name, department_id (FK), severity_level"),
        ("appointments", "id (PK), patient_id (FK), doctor_id (FK), booked_time, status, queue_position, token"),
        ("queue_logs", "id (PK), appointment_id (FK), predicted_wait, actual_wait, delta_minutes, timestamp"),
        ("staff_users", "id (PK), name, username, email, role, password_hash, department_id")
    ]

    # Two column layout for tables
    for i, (tname, fields) in enumerate(db_tables):
        x = Inches(0.8 + (i % 2) * 6.0)
        y = Inches(1.8 + (i // 2) * 1.3)
        w = Inches(5.7) if i < 6 else Inches(11.7)
        c = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, Inches(1.15))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.15)

        p = tf.paragraphs[0]
        p.text = f"📊 Table: {tname}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

        pf = tf.add_paragraph()
        pf.text = f"Columns: {fields}"
        pf.font.size = Pt(9)
        pf.font.color.rgb = TEXT_MUTED
        pf.space_before = Pt(2)

    # -------------------------------------------------------------
    # SLIDE 12: Experimental Results & Performance Metrics
    # -------------------------------------------------------------
    slide12 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide12, BG_LIGHT)
    add_header(slide12, 12, "Experimental Results & Model Evaluation")

    # Table on Left
    t_shape = slide12.shapes.add_table(3, 4, Inches(0.8), Inches(1.8), Inches(6.0), Inches(2.2))
    t = t_shape.table
    t_headers = ["Model Evaluated", "MAE (min)", "RMSE (min)", "R² Score"]
    for j, h in enumerate(t_headers):
        cell = t.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY_PRIMARY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)

    res_data = [
        ("Linear Regression (Baseline)", "10.64", "14.80", "0.810"),
        ("Random Forest (Proposed)", "4.69", "6.33", "0.965")
    ]
    for i, row in enumerate(res_data):
        for j, val in enumerate(row):
            cell = t.cell(i+1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(237, 242, 247) if i == 0 else RGBColor(209, 250, 229)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(10)
            p.font.bold = (i == 1)
            p.font.color.rgb = TEXT_DARK if i == 0 else RGBColor(6, 95, 70)

    # Feature Importance Card on Right
    c_fi = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.1), Inches(1.8), Inches(5.4), Inches(5.1))
    c_fi.fill.solid()
    c_fi.fill.fore_color.rgb = CARD_BG
    c_fi.line.color.rgb = CARD_BORDER
    tf_fi = c_fi.text_frame
    tf_fi.word_wrap = True
    tf_fi.margin_left = tf_fi.margin_top = Inches(0.3)

    p = tf_fi.paragraphs[0]
    p.text = "FEATURE IMPORTANCE HIERARCHY"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = NAVY_PRIMARY

    fi_items = [
        ("1. Queue Length Ahead", "Importance ≈ 0.52 (Primary driver of wait duration)"),
        ("2. Doctor Average Pace", "Importance ≈ 0.15 (Consultation speed variability)"),
        ("3. Emergency Status", "Importance ≈ 0.08 (Immediate triage bypass flag)"),
        ("4. Hour of Day & Day of Week", "Importance ≈ 0.12 (Peak-hour surge multipliers)"),
        ("5. Department Indicators", "Importance ≈ 0.13 (Specialty-specific procedural durations)")
    ]
    for feat, imp in fi_items:
        pf = tf_fi.add_paragraph()
        pf.text = feat
        pf.font.size = Pt(10.5)
        pf.font.bold = True
        pf.font.color.rgb = ACCENT_TEAL
        pf.space_before = Pt(6)
        
        pi = tf_fi.add_paragraph()
        pi.text = imp
        pi.font.size = Pt(9.5)
        pi.font.color.rgb = TEXT_MUTED

    # Highlights card bottom left
    c_hl = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.3), Inches(6.0), Inches(2.6))
    c_hl.fill.solid()
    c_hl.fill.fore_color.rgb = CARD_BG
    c_hl.line.color.rgb = CARD_BORDER
    tf_hl = c_hl.text_frame
    tf_hl.word_wrap = True
    tf_hl.margin_left = tf_hl.margin_top = Inches(0.25)

    p = tf_hl.paragraphs[0]
    p.text = "KEY QUANTITATIVE TAKEAWAYS"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    hls = [
        "56% MAE Reduction: Random Forest dropped mean error from 10.64m to 4.69m.",
        "High Variance Explanation: R² of 0.965 confirms non-linear tree ensembles capture multiplicative hospital queue effects far better than linear formulas.",
        "Explainable AI: Feature weights directly ground natural-language explanations shown to patients."
    ]
    for h in hls:
        ph = tf_hl.add_paragraph()
        ph.text = f"✓ {h}"
        ph.font.size = Pt(9.5)
        ph.font.color.rgb = TEXT_DARK
        ph.space_before = Pt(4)

    # -------------------------------------------------------------
    # SLIDE 13: Testing & Verification
    # -------------------------------------------------------------
    slide13 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide13, BG_LIGHT)
    add_header(slide13, 13, "Automated Testing & Quality Assurance (100% Pass)")

    test_runs = [
        ("test_phase6_staff.py", "Staff Auth, Live Queue, Emergency Insert (Pos #1), Atomic +1 Shift, KPI retrieval", "100% PASS (0 errors)"),
        ("test_phase7_integration.py", "Patient Departure Check, Doctor Delay Overlay (+20m), Queue Advance, Neon QueueLog audit", "100% PASS (0 errors)"),
        ("test_cross_system_flow.py", "End-to-End Novelty: Home departure -> Triage Emergency Bump -> Departure Delay Recalculation", "100% PASS (0 errors)"),
        ("test_dispatch_notifications.py", "Dual WhatsApp rich format, 160-char SMS format, 1-click wa.me navigation URL", "100% PASS (0 errors)"),
        ("verify_http_departure.py", "Live HTTP API network test: JWT auth, booking, nearby & distant GPS departure checks", "100% PASS (0 errors)")
    ]

    for i, (tfile, scope, res) in enumerate(test_runs):
        y = Inches(1.8 + i * 1.05)
        c = slide13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.7), Inches(0.95))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.15)

        p = tf.paragraphs[0]
        p.text = f"🧪 {tfile}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

        ps = tf.add_paragraph()
        ps.text = f"Scope: {scope}  |  Result: {res}"
        ps.font.size = Pt(9.5)
        ps.font.color.rgb = RGBColor(5, 150, 105) # Emerald green
        ps.font.bold = True

    # -------------------------------------------------------------
    # SLIDE 14: Project Status & Remaining Work
    # -------------------------------------------------------------
    slide14 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide14, BG_LIGHT)
    add_header(slide14, 14, "Current Project Status & Roadmap")

    c_done = slide14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.1))
    c_done.fill.solid()
    c_done.fill.fore_color.rgb = CARD_BG
    c_done.line.color.rgb = CARD_BORDER
    tf_d = c_done.text_frame
    tf_d.word_wrap = True
    tf_d.margin_left = tf_d.margin_top = Inches(0.3)

    p = tf_d.paragraphs[0]
    p.text = "COMPLETED WORK (Phases 0–7) – Tag v0.5.0"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = RGBColor(16, 185, 129)

    dones = [
        "Phase 0–1: Neon PostgreSQL Database, 7 SQLModel tables, and seed scripts.",
        "Phase 2: Core FastAPI REST routes (28 canonical endpoints), JWT auth.",
        "Phase 3: Random Forest ML Model trained, evaluated, and embedded in backend.",
        "Phase 4: Google Maps departure calculation engine and notification logic.",
        "Phase 5: React Patient App with symptom selector & live countdown tracker.",
        "Phase 6: React Staff Triage Dashboard with emergency insertion controls.",
        "Phase 7: End-to-end integration, doctor disruption overlay, and audit logging."
    ]
    for d in dones:
        p = tf_d.add_paragraph()
        p.text = f"✓ {d}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_DARK
        p.space_before = Pt(6)

    c_rem = slide14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.1))
    c_rem.fill.solid()
    c_rem.fill.fore_color.rgb = CARD_BG
    c_rem.line.color.rgb = CARD_BORDER
    tf_r = c_rem.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = tf_r.margin_top = Inches(0.3)

    p = tf_r.paragraphs[0]
    p.text = "REMAINING WORK (Phase 8 & Final Report)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    rems = [
        "Phase 8 Cloud Deployment: Deploying FastAPI backend to Render / Railway.",
        "Frontend Cloud Hosting: Deploying Patient App and Staff Dashboard to Vercel.",
        "Production Smoke Testing: Live testing on public URLs for Dr. Rajeswari R.",
        "Final VTU Report Preparation: Documenting architecture diagram (replacing Figure 4.1) and experimental results.",
        "Conference Submission: Finalizing IEEE-formatted manuscript for peer-reviewed conference."
    ]
    for r in rems:
        p = tf_r.add_paragraph()
        p.text = f"⏳ {r}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_DARK
        p.space_before = Pt(8)

    # -------------------------------------------------------------
    # SLIDE 15: Conclusion
    # -------------------------------------------------------------
    slide15 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide15, BG_LIGHT)
    add_header(slide15, 15, "Conclusion")

    c_conc = slide15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.1))
    c_conc.fill.solid()
    c_conc.fill.fore_color.rgb = CARD_BG
    c_conc.line.color.rgb = CARD_BORDER
    tf_c = c_conc.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = tf_c.margin_top = Inches(0.3)

    p = tf_c.paragraphs[0]
    p.text = "PROJECT SUMMARY & CORE CONTRIBUTIONS"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = NAVY_PRIMARY

    concs = [
        ("Bridged the Commute-Wait Gap", "Successfully implemented the first system integrating ML wait prediction with live home travel time, eliminating unnecessary hospital lobby waiting."),
        ("Demonstrated ML Superiority", "Random Forest achieved MAE 4.69 min and R² 0.965, outperforming Linear Regression by 56% on synthetic non-linear hospital queue datasets."),
        ("Built Cross-System Operational Resilience", "Staff triage emergencies atomically bump regular patient queues (+1) and dynamically push back departure times with zero system crashes."),
        ("Explainable & Accessible", "Outputs natural language explanations alongside predictions and provides dual WhatsApp + SMS alerts for universal smartphone accessibility."),
        ("Full Working Prototype", "Fully verified through 28 REST endpoints, two React frontends, and automated integration test suites.")
    ]
    for title, desc in concs:
        pt = tf_c.add_paragraph()
        pt.text = f"🌟 {title}: "
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = ACCENT_BLUE
        pt.space_before = Pt(8)
        
        pd = tf_c.add_paragraph()
        pd.text = desc
        pd.font.size = Pt(10)
        pd.font.color.rgb = TEXT_DARK

    # -------------------------------------------------------------
    # SLIDE 16: Future Enhancements
    # -------------------------------------------------------------
    slide16 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide16, BG_LIGHT)
    add_header(slide16, 16, "Future Enhancements & Scalability")

    fe_cards = [
        ("1. Real-World Hospital Pilot", "Deploy at partner healthcare centers subject to ethics approval to validate the system on real patient flow and historical Electronic Health Records (EHR)."),
        ("2. Continuous Online Retraining", "Leverage logged predicted-vs-actual consultation durations in the queue_logs table to periodically retrain and fine-tune model parameters."),
        ("3. Multi-Hospital Network Support", "Scale the architecture from a single-hospital instance to a multi-tenant cloud platform connecting multiple clinics and diagnostic labs."),
        ("4. Wearable & Voice AI Integration", "Incorporate automated voice announcements in OPD halls and IoT smart-watch arrival notifications for elderly patients.")
    ]

    for i, (title, desc) in enumerate(fe_cards):
        y = Inches(1.8 + i * 1.3)
        c = slide16.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.7), Inches(1.15))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

        pd = tf.add_paragraph()
        pd.text = desc
        pd.font.size = Pt(10)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(2)

    # -------------------------------------------------------------
    # SLIDE 17: Publications & Achievements
    # -------------------------------------------------------------
    slide17 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide17, BG_LIGHT)
    add_header(slide17, 17, "Publications & Academic Achievements")

    c_pub = slide17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.1))
    c_pub.fill.solid()
    c_pub.fill.fore_color.rgb = CARD_BG
    c_pub.line.color.rgb = CARD_BORDER
    tf_p = c_pub.text_frame
    tf_p.word_wrap = True
    tf_p.margin_left = tf_p.margin_top = Inches(0.3)

    p = tf_p.paragraphs[0]
    p.text = "RESEARCH PAPER PREPARED FOR CONFERENCE PUBLICATION"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_TEAL

    p_title = tf_p.add_paragraph()
    p_title.text = "“Machine Learning-Based Prediction of Hospital Outpatient Wait Time with Travel-Time-Aware Departure Alerts”"
    p_title.font.size = Pt(13)
    p_title.font.bold = True
    p_title.font.color.rgb = NAVY_PRIMARY
    p_title.space_before = Pt(8)

    p_auth = tf_p.add_paragraph()
    p_auth.text = "Authors: Dr. R Rajeswari (Professor & Guide), Abhilash K R, Anjanadri T N, Laxuman Ghotale, Naveen L\nDepartment of Computer Science & Engineering, Shridevi Institute of Engineering & Technology, Tumakuru"
    p_auth.font.size = Pt(10.5)
    p_auth.font.color.rgb = TEXT_MUTED
    p_auth.space_before = Pt(4)

    achieves = [
        ("Novelty Positioned", "Documented the literature gap across 20 cited IEEE/international papers proving no existing system combines ML wait-time with proactive home-to-hospital commute alerts."),
        ("Empirical Evaluation", "Reported full experimental benchmarking of Random Forest (MAE 4.69m, R² 0.965) vs. Linear Regression baseline."),
        ("Format & Compliance", "Authored in IEEE standard two-column conference format, complete with research methodology, evaluation metrics, and references.")
    ]
    for head, text in achieves:
        pt = tf_p.add_paragraph()
        pt.text = f"📜 {head}: {text}"
        pt.font.size = Pt(10.5)
        pt.font.color.rgb = TEXT_DARK
        pt.space_before = Pt(8)

    # -------------------------------------------------------------
    # SLIDE 18: References (IEEE Format)
    # -------------------------------------------------------------
    slide18 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide18, BG_LIGHT)
    add_header(slide18, 18, "References (IEEE Format)")

    c_ref = slide18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.1))
    c_ref.fill.solid()
    c_ref.fill.fore_color.rgb = CARD_BG
    c_ref.line.color.rgb = CARD_BORDER
    tf_ref = c_ref.text_frame
    tf_ref.word_wrap = True
    tf_ref.margin_left = tf_ref.margin_top = Inches(0.3)

    refs = [
        "[1] D. P. Handayani, Mustafid, and B. Surarso, “Patient queue systems in hospital using patient treatment time prediction algorithm,” Kinetik: Game Technology, Information System, Computer Network, Computing, Electronics, and Control, vol. 4, no. 3, pp. 275–284, 2019.",
        "[2] K. Teramoto and S. Kuwata, “Design and evaluation of a smartphone medical guidance app for outpatients of large-scale medical institutions: Retrospective observational study,” JMIR Formative Research, vol. 6, no. 4, p. e32948, 2022.",
        "[3] J. Joseph, S. Senith, and A. A. Kirubaraj, “Machine learning for prediction of wait times in outpatient clinic,” Procedia Computer Science, vol. 215, pp. 230–239, 2022.",
        "[4] M. Eshghali, D. Kannan, N. Salmanzadeh-Meydani, and A. M. E. Sikaroudi, “Machine learning based integrated scheduling and rescheduling for elective and emergency patients in the operating theatre,” Annals of Operations Research, 2023.",
        "[5] T. K. Taton, B. Saha, A. Akter, M. J. Islam, and S. K. Mostaque, “Waiting time prediction in queue management: Leveraging machine learning approach,” in Proc. 2024 Int. Conf. Recent Progresses in Science, Engineering and Technology (ICRPSET), Rajshahi, Bangladesh, Dec. 2024, pp. 1–5.",
        "[6] FastAPI & Scikit-Learn Documentation, “FastAPI Modern Python Web Framework & Scikit-Learn Machine Learning in Python,” 2025."
    ]

    for i, r in enumerate(refs):
        p = tf_ref.paragraphs[0] if i == 0 else tf_ref.add_paragraph()
        p.text = r
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_DARK
        p.space_before = Pt(6) if i > 0 else Pt(0)

    # Save presentation
    output_path = "Smart_Hospital_Queue_VTU_Phase_2.pptx"
    prs.save(output_path)
    print(f"SUCCESS: Generated {output_path} with {len(prs.slides)} slides.")

if __name__ == "__main__":
    create_presentation()
