INSERT INTO "Users" ("USERNAME", "EMAIL", "PASSWORD", "NAME", "SURNAME", "ROLE")
VALUES ('OGT_SHADOW', 'piotr.szerlomski@gmail.com', 'DwukropekTrzy', 'Piotrek', 'Szerlomski', 'Admin')
ON CONFLICT ("USERNAME") DO UPDATE SET
    "EMAIL" = EXCLUDED."EMAIL",
    "PASSWORD" = EXCLUDED."PASSWORD",
    "NAME" = EXCLUDED."NAME",
    "SURNAME" = EXCLUDED."SURNAME",
    "ROLE" = EXCLUDED."ROLE";

INSERT INTO "Users" ("USERNAME", "EMAIL", "PASSWORD", "NAME", "SURNAME", "ROLE")
VALUES ('ATKER', 'boczarkacper@gmail.com', 'TrzykropemTrzy', 'Kacper', 'Boczar', 'Admin')
ON CONFLICT ("USERNAME") DO UPDATE SET
    "EMAIL" = EXCLUDED."EMAIL",
    "PASSWORD" = EXCLUDED."PASSWORD",
    "NAME" = EXCLUDED."NAME",
    "SURNAME" = EXCLUDED."SURNAME",
    "ROLE" = EXCLUDED."ROLE";