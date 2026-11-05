import os
import shutil

conf_dir = r'documents/coneference'
final_file = os.path.join(conf_dir, 'AI_Driven_Hospital_OPD_Waiting_Time_Prediction_with_Real_Time_Travel_Time_Estimation_and_Smart_Departure_Notifications_Final.docx')
primary_file = os.path.join(conf_dir, 'AI_Driven_Hospital_OPD_Waiting_Time_Prediction_with_Real_Time_Travel_Time_Estimation_and_Smart_Departure_Notifications.docx')

try:
    if os.path.exists(final_file):
        shutil.copyfile(final_file, primary_file)
        os.remove(final_file)
        print("SYNC SUCCESSFUL! Only 2 files remain in documents/coneference:")
        for f in os.listdir(conf_dir):
            print("  -", f)
    else:
        print("Final file not found or already synced. Current directory contents:")
        for f in os.listdir(conf_dir):
            print("  -", f)
except PermissionError:
    print("PERMISSION ERROR: The file is currently open in Microsoft Word.")
    print("Please close Microsoft Word so the file can be updated and the duplicate removed.")

