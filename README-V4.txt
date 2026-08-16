HZ AUTO JOB CARDS - VERSION 4
=============================

Main fixes in this version
--------------------------
1. Long parts lists no longer get cut off at the bottom of the A4 PDF.
2. Breakdown Job Card automatically creates continuation pages when needed.
3. Breakdown Technician Report automatically creates continuation pages when needed.
4. Technician/time/signature information is kept on the final page so it remains visible.
5. PDF review shows Page X of Y underneath each preview page.
6. Signature pads are locked by default so scrolling over them cannot accidentally draw.
7. Tap Add Signature / Edit Signature to enable drawing, then Done to lock the pad again.
8. Signature pads are larger, especially on phones.
9. Save Draft on Phone has been removed, including its localStorage save/restore code.
10. Service-worker caching was updated to make new GitHub Pages versions refresh more reliably.

The app still requires no IIS server and no SQL database.
PDFs are generated in the browser and can be downloaded or shared from the phone.

See UPLOAD-INSTRUCTIONS.txt for the GitHub update steps.
