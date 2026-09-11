#!/usr/bin/env python3
"""Import Teams directory from the Innocean people spreadsheet.

Skips users whose email already exists. Combines first + last name into full_name
and stores Department as division_name.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime

import bcrypt
import psycopg2

# First Name, Last Name, Email, Department — from Google Sheet
SHEET_ROWS = [
    ("Abdul", "Sabilillah", "abdul.sabilillah@innocean.co.id", "BTL"),
    ("Abdul K", "Yuliandi", "abdul.yuliandi@innocean.co.id", "Account"),
    ("Adi Prasetio", "Pamuji", "adi.pamuji@innocean.co.id", "Creative"),
    ("Aldri", "Mahendra", "aldri.mahendra@innocean.co.id", "Digital & Technology"),
    ("Alfonsus", "Dwanda", "alfon.dwanda@innocean.co.id", "Digital & Technology"),
    ("Alya", "Anindya", "alya.anindya@innocean.co.id", "Account"),
    ("Andhika Abdurrachman", "Hakim", "andhika.hakim@innocean.co.id", "Digital & Technology"),
    ("Andre", "Alifridho", "andrealifridho@innocean.co.id", "Digital & Technology"),
    ("Andri", "Andri", "andri.andri@innocean.co.id", "Digital & Technology"),
    ("Angelica", "Chyllo Renata", "angelica.chyllo@innocean.co.id", "Digital & Technology"),
    ("Arini", "Oktaviani", "arini.oktaviani@innocean.co.id", "BTL"),
    ("Aryanti", "Pranoto", "anne.aryanti@innocean.co.id", "Account"),
    ("Ashya", "Marchelya Andine", "ashya.andine@innocean.co.id", "Media"),
    ("Auzan Wildan Her", "Gumilang", "auzan.wildan@innocean.co.id", "BTL"),
    ("Bagas", "Pratama", "bagas.pratama@innocean.co.id", "Digital & Technology"),
    ("Benjamin", "Bramono", "benjamin.b@innocean.co.id", "HMS"),
    ("Bobby", "Putra", "bobby.putra@innocean.co.id", "Creative"),
    ("Cakra", "Aditia Rakhmat", "cakra.rakhmat@innocean.co.id", "Media"),
    ("Cherisha", "Dewi Kiani", "cherisha.kiani@innocean.co.id", "Account"),
    ("Daniel", "Christian", "daniel.christian@innocean.co.id", "Digital & Technology"),
    ("Danniel", "W. Mait", "danniel.william@innocean.co.id", "Digital & Technology"),
    ("Devi Silvia", "Fitriawan", "devi.fitriawan@innocean.co.id", "HR & GA"),
    ("Dhora", "Elvira Wulandari", "dhora.elvira@innocean.co.id", "BTL"),
    ("Dini", "Anggriani", "dini.anggriani@innocean.co.id", "Resources & Coordination"),
    ("Eka Hary", "Apriyana", "eka.apriyana@innocean.co.id", "Digital & Technology"),
    ("Eric Wilson", "Tanubrata", "eric.wilson@innocean.co.id", "Digital & Technology"),
    ("Evacandrasuci", "Putri Setyarini", "evacandra.setyarini@innocean.co.id", "Account"),
    ("Fajri", "Hidayat", "fajri.hidayat@innocean.co.id", "Digital & Technology"),
    ("Farhan", "Syaputra Kosasi", "farhan.kosasi@innocean.co.id", "Digital & Technology"),
    ("Fari", "Aulia", "fari.aulia@innocean.co.id", "Creative"),
    ("Glenn", "Alexander", "glenn.alexander@innocean.co.id", "Creative"),
    ("Gulzaar", "Pradipta", "gulzaar.pradipta@innocean.co.id", "Legal"),
    ("Gunawan", "Nugroho", "nughie@innocean.co.id", "Creative"),
    ("Hizkia", "Subagyo", "hizkia@innocean.co.id", "BTL"),
    ("Ismi", "Untari", "ismi.untari@innocean.co.id", "Resources & Coordination"),
    ("James", "Henry", "henry@innocean.co.id", "Creative"),
    ("Jati", "Munggaran", "jati@innocean.co.id", "Media"),
    ("Jean", "Paul de Ponti", "jp.deponti@innocean.co.id", "Planning"),
    ("Jefta", "Marvel Johanes", "jefta.johanes@innocean.co.id", "Finance"),
    ("Kevin", "Adam Pratama", "kevin.adam@innocean.co.id", "Resources & Coordination"),
    ("Krisna", "Mahendra", "krisna.mahendra@innocean.co.id", "Digital & Technology"),
    ("Latif", "Latif", "latif.latif@innocean.co.id", "Digital & Technology"),
    ("Manuella", "Richieardy", "manuella.richie@innocean.co.id", "BTL"),
    ("Maulidiya", "Innocean", "maulidiya@innocean.co.id", "Digital & Technology"),
    ("Mediana", "Agita", "mediana@innocean.co.id", "Digital & Technology"),
    ("Mega", "Keren", "mega.keren@innocean.co.id", "Resources & Coordination"),
    ("Mega Indah", "Purnamasari", "mega.purnamasari@innocean.co.id", "Digital & Technology"),
    ("Mellia", "Chayani", "mellia@innocean.co.id", "Digital & Technology"),
    ("Mia", "Thalia", "mia.thalia@innocean.co.id", "Resources & Coordination"),
    ("Minar", "Rohana", "minar.rohana@innocean.co.id", "Finance"),
    ("Mohamad Raka", "Berryanto Binu", "raka.binu@innocean.co.id", "Account"),
    ("Mosha Yulian", "Joyosuyono", "mosha.joyosuyono@innocean.co.id", "Digital & Technology"),
    ("Muhamad", "Rifqi Mahardika Aryatama", "rifqi.mahardika@innocean.co.id", "Creative"),
    ("Muhammad Rayhan", "Hafizh Mahdis", "rayhan.mahdis@innocean.co.id", "Finance"),
    ("Nabila", "Salma Haris", "nabila.haris@innocean.co.id", "Digital & Technology"),
    ("Nadine Widya", "Andiany", "nadine.andiany@innocean.co.id", "Media"),
    ("Namyra", "Amanda", "amanda@innocean.co.id", "Resources & Coordination"),
    ("Peter", "Kwan", "peter.kwan@innocean.co.id", "BOD"),
    ("Prandika", "Pratanto", "prandika.pratanto@innocean.co.id", "Digital & Technology"),
    ("Puti Jelita", "Hendayati", "jelita@innocean.co.id", "HMS"),
    ("Rafi", "Dwitama Sarosi Subekti", "rafi.dwitama@innocean.co.id", "Creative"),
    ("Rafi", "Aditya Gemilang", "rafi.gemilang@innocean.co.id", "Creative"),
    ("Rahmania", "Vania", "rahmania.vania@innocean.co.id", "Account"),
    ("Rara", "Innocean", "rara@innocean.co.id", "HR & GA"),
    ("Riszti", "Primula", "riszti.primula@innocean.co.id", "Media"),
    ("Rizky", "Suwendi", "rizky.suwendi@innocean.co.id", "Creative"),
    ("Rizky", "Baskoro", "rizky.baskoro@innocean.co.id", "Account"),
    ("Rizky", "Nauli", "rizky.nauli@innocean.co.id", "Planning"),
    ("Ronald", "Rondonuwu", "ronald.rondonuwu@innocean.co.id", "Media"),
    ("Ronny", "Tanamal", "ronny.tanamal@innocean.co.id", "BTL"),
    ("Roy", "Handojo", "roy@innocean.co.id", "Creative"),
    ("Rula", "Savira", "rula.savira@innocean.co.id", "Creative"),
    ("Rusli", "Budianto", "rusli.budianto@innocean.co.id", "RSD"),
    ("Ryan", "Nandang", "ryan@innocean.co.id", "Media"),
    ("Sandila", "Ekaputri", "sandila.ekaputri@innocean.co.id", "Planning"),
    ("Sasongko", "Wonomiharjo", "sasongko.david@innocean.co.id", "RSD"),
    ("Sean", "Innocean", "sean@innocean.co.id", "Media"),
    ("Sean Seongwon", "Park", "sean.park0123@innocean.co.id", "Account"),
    ("Shelma Alya", "Winiasih", "shelma.winiasih@innocean.co.id", "Finance"),
    ("Soni", "Suripatty", "soni.suripatty@innocean.co.id", "BTL"),
    ("Soraya", "Jenitta Marsha", "soraya.marsha@innocean.co.id", "Account"),
    ("Timothius", "Gigih Bakurogo", "timothius.gigih@innocean.co.id", "Creative"),
    ("Tri Maulida", "Rahardianti", "tri.rahardianti@innocean.co.id", "Creative"),
    ("Upe", "Maria", "upe.maria@innocean.co.id", "BTL"),
    ("Vidiyanti", "Shariff", "vidi.shariff@innocean.co.id", "Resources & Coordination"),
    ("Wahyu Aji", "Nugroho", "wahyu.nugroho@innocean.co.id", "HR & GA"),
    ("Willy", "Chandra", "willy.chandra@innocean.co.id", "RSD"),
    ("Winna", "Arifannisa", "winna.arifannisa@innocean.co.id", "Finance"),
    ("Wiryawan", "Danang Sidhitama", "wd.sidhitama@innocean.co.id", "Media"),
    ("Yeongcheol", "Kim", "yc.kim@innocean.co.id", "BOD"),
    ("Yosia", "Rosintauli", "yosia.rosintauli@innocean.co.id", "HR & GA"),
    ("Yulia", "Gunawan", "yulia.gunawan@innocean.co.id", "HR & GA"),
    ("Yusdina", "Fibriyanti", "yusdina.fibriyanti@innocean.co.id", "BOD"),
    ("Zahnira Maulia", "Hidayat", "zahnira.hidayat@innocean.co.id", "Digital & Technology"),
]


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8")[:71], bcrypt.gensalt()).decode("utf-8")


def temp_password_for(username: str) -> str:
    initial = (username[:1] or "U").upper()
    return f"Welcome{initial}123!"


def main() -> int:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is not set", file=sys.stderr)
        return 1

    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute("SELECT lower(email), username FROM users WHERE email IS NOT NULL")
    existing_emails = {row[0]: row[1] for row in cur.fetchall()}
    cur.execute("SELECT username FROM users")
    existing_usernames = {row[0] for row in cur.fetchall()}

    inserted = 0
    skipped = 0
    updated_division = 0
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print("email\tusername\tfull_name\tdepartment\taction")
    for first, last, email, department in SHEET_ROWS:
        email = email.strip().lower()
        full_name = f"{first.strip()} {last.strip()}".strip()
        base_username = email.split("@", 1)[0]

        if email in existing_emails:
            cur.execute(
                """
                UPDATE users
                SET division_name = %s
                WHERE lower(email) = %s
                  AND (division_name IS NULL OR btrim(division_name) = '')
                """,
                (department, email),
            )
            if cur.rowcount:
                updated_division += 1
                print(f"{email}\t{existing_emails[email]}\t{full_name}\t{department}\tupdated_division")
            else:
                print(f"{email}\t{existing_emails[email]}\t{full_name}\t{department}\tskipped_existing")
            skipped += 1
            continue

        username = base_username
        suffix = 1
        while username in existing_usernames:
            username = f"{base_username}{suffix}"
            suffix += 1
            if suffix > 99:
                raise RuntimeError(f"Unable to generate unique username for {email}")

        password_hash = hash_password(temp_password_for(username))
        cur.execute(
            """
            INSERT INTO users (
                username, email, full_name, password, is_verified,
                created_at, account_status, is_superadmin, role,
                timesheet_required, division_name
            ) VALUES (
                %s, %s, %s, %s, 1,
                %s, 'active', 0, 'staff',
                TRUE, %s
            )
            """,
            (username, email, full_name, password_hash, now, department),
        )
        existing_emails[email] = username
        existing_usernames.add(username)
        inserted += 1
        print(f"{email}\t{username}\t{full_name}\t{department}\tinserted")

    conn.commit()
    cur.close()
    conn.close()

    print()
    print(f"Inserted: {inserted}")
    print(f"Skipped existing: {skipped}")
    print(f"Filled empty department on existing: {updated_division}")
    print("Temporary password pattern: Welcome{FirstLetterOfUsername}123!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
