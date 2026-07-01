MERGE INTO "Users" u
USING (
	SELECT 'OGT_SHADOW' AS "USERNAME",
				 'piotr.szerlomski@gmail.com' AS "EMAIL",
				 'DwukropekTrzy' AS "PASSWORD",
				 'Piotrek' AS "NAME",
				 'Szerlomski' AS "SURNAME",
				 'Admin' AS "ROLE"
	FROM dual
) s
ON (u."USERNAME" = s."USERNAME")
WHEN MATCHED THEN UPDATE SET
	u."EMAIL" = s."EMAIL",
	u."PASSWORD" = s."PASSWORD",
	u."NAME" = s."NAME",
	u."SURNAME" = s."SURNAME",
	u."ROLE" = s."ROLE"
WHEN NOT MATCHED THEN
	INSERT ("USERNAME", "EMAIL", "PASSWORD", "NAME", "SURNAME", "ROLE")
	VALUES (s."USERNAME", s."EMAIL", s."PASSWORD", s."NAME", s."SURNAME", s."ROLE");

MERGE INTO "Users" u
USING (
	SELECT 'ATKER' AS "USERNAME",
				 'boczarkacper@gmail.com' AS "EMAIL",
				 'TrzykropemTrzy' AS "PASSWORD",
				 'Kacper' AS "NAME",
				 'Boczar' AS "SURNAME",
				 'Admin' AS "ROLE"
	FROM dual
) s
ON (u."USERNAME" = s."USERNAME")
WHEN MATCHED THEN UPDATE SET
	u."EMAIL" = s."EMAIL",
	u."PASSWORD" = s."PASSWORD",
	u."NAME" = s."NAME",
	u."SURNAME" = s."SURNAME",
	u."ROLE" = s."ROLE"
WHEN NOT MATCHED THEN
	INSERT ("USERNAME", "EMAIL", "PASSWORD", "NAME", "SURNAME", "ROLE")
	VALUES (s."USERNAME", s."EMAIL", s."PASSWORD", s."NAME", s."SURNAME", s."ROLE");

COMMIT;