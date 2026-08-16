HZ AUTO JOB CARDS - V5 PROFESSIONAL PDF OUTPUT
================================================

This version keeps the mobile forms and serverless GitHub Pages workflow,
but rebuilds the exported Breakdown Job Card and Breakdown Technician Report
as properly paginated business documents.

WHAT CHANGED
------------
1. Professional repeated document header on every generated page.
2. Customer + vehicle context is repeated on every page.
3. Every section has a clear heading and border so values cannot be confused.
4. Large parts lists start on a fresh page instead of leaving half the table
   on page 1.
5. Parts tables split only BETWEEN complete rows.
6. Parts table headings repeat on every continuation page.
7. Very long part descriptions are split into readable continuation rows rather
   than being clipped.
8. Technician/time/signature sections remain grouped whenever possible.
9. If a long technician report needs more room, it paginates separately while
   keeping the sign-off section intact.
10. Every PDF page shows Page X of Y in its footer.
11. Signatures remain locked by default until Add Signature/Edit Signature is
   explicitly selected (from V4).
12. Save Draft remains removed (from V4).

PAGINATION RULES
----------------
BREAKDOWN JOB CARD
- Up to 9 parts may stay with page 1 only if the entire parts + sign-off block
  fits cleanly.
- Larger lists start on a dedicated Parts Used page.
- If more than one Parts page is required, the table header repeats and no row
  is cut in half.
- Technician/time/signatures stay together at the end.

BREAKDOWN TECHNICIAN REPORT
- Up to 7 parts may stay with the main report only if the entire parts + final
  completion block fits cleanly.
- Larger lists start on a dedicated Parts Used page.
- Time Report, Technician Report and Technician/Driver Sign-off are clearly
  labelled rather than sharing an ambiguous side column.

SIDE TIPPER TRIP CHECK
- Kept on the familiar fixed two-page layout because it already has a stable,
  predictable page structure and no variable parts list.

NO SERVER REQUIRED
------------------
The app is still HTML/CSS/JavaScript only. PDF generation happens in the
browser. The completed PDF can be downloaded or shared with the phone's normal
share menu.
