INSERT INTO "Users" (username, email, password, name, surname, role)
VALUES ('OGT_SHADOW', 'piotr.szerlomski@gmail.com', 'DwukropekTrzy', 'Piotrek', 'Szerlomski', 'Admin')
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    surname = EXCLUDED.surname,
    role = EXCLUDED.role;

INSERT INTO "Users" (username, email, password, name, surname, role)
VALUES ('ATKER', 'boczarkacper@gmail.com', 'TrzykropemTrzy', 'Kacper', 'Boczar', 'Admin')
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    surname = EXCLUDED.surname,
    role = EXCLUDED.role;