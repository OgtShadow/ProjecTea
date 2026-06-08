INSERT INTO "Users" ("username", "email", "password", "name", "surname", "role") 
VALUES ('OGT_SHADOW', 'piotr.szerlomski@gmail.com', 'DwukropekTrzy', 'Piotrek', 'Szerlomski', 'Admin');

INSERT INTO "Users" ("username", "email", "password", "name", "surname", "role") 
VALUES ('ATKER', 'boczarkacper@gmail.com', 'TrzykropemTrzy', 'Kacper', 'Boczar', 'Admin');

INSERT INTO "Projects" ("project_name", "description", "fk_project_leader_id", "created_at") 
VALUES ('ProjectTea', 'Projekt na TSS i PAW', 1, TIMESTAMP '2026-04-14 15:15:45');

COMMIT;