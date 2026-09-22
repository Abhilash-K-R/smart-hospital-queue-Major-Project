"""
backend/purge_dummy_appointments.py
------------------------------------
Purges test/seed dummy patient appointments from the database so doctors start
with a clean, empty queue. Only real patient bookings and staff emergency walk-ins
will appear in the live queue.
"""

from sqlmodel import Session, select
from database import engine
from models import Appointment, QueueLog, Notification
from seed_doctors import seed_departments_and_doctors


def purge_and_reset():
    with Session(engine) as session:
        print("--- Step 1: Purging all dummy appointments and queue logs ---")
        qlogs = session.exec(select(QueueLog)).all()
        for ql in qlogs:
            session.delete(ql)
        session.commit()
        print(f"Purged {len(qlogs)} QueueLog records.")

        appts = session.exec(select(Appointment)).all()
        for appt in appts:
            session.delete(appt)
        session.commit()
        print(f"Purged {len(appts)} Appointment records.")

        notifs = session.exec(select(Notification)).all()
        for n in notifs:
            session.delete(n)
        session.commit()
        print(f"Purged {len(notifs)} Notification records.")

    print("\n--- Step 2: Ensuring Departments, 8 Doctors, and Symptoms are intact ---")
    seed_departments_and_doctors()
    print("\n[SUCCESS] Database is clean! Zero fake appointments in queue. Ready for real bookings.")


if __name__ == "__main__":
    purge_and_reset()
