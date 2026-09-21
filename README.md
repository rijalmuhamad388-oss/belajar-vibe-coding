# Belajar Vibe Coding: ElysiaJS + Drizzle + MySQL dengan Bun

Project backend yang diinisialisasi menggunakan Bun sebagai runtime, ElysiaJS sebagai framework web, dan Drizzle ORM untuk interaksi dengan database MySQL.

## 🚀 Fitur & Stack

- **Runtime**: [Bun](https://bun.sh/) (v1.4.2+)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Driver**: [mysql2](https://github.com/sidorares/node-mysql2)
- **Migration & Tooling**: Drizzle Kit

---

## 📁 Struktur Project

```text
.
├── drizzle/              # Folder file migrasi SQL hasil generate
├── src/
│   ├── db/
│   │   ├── index.ts      # Koneksi database pool & inisialisasi Drizzle ORM
│   │   └── schema.ts     # Definisi skema tabel MySQL
│   └── index.ts          # Entry point server ElysiaJS
├── .env.example          # Contoh variabel lingkungan
├── .gitignore            # Berkas yang diabaikan Git
├── drizzle.config.ts     # Konfigurasi Drizzle Kit
├── package.json          # Metadata project & daftar script
├── tsconfig.json         # Konfigurasi TypeScript
└── README.md
```

---

## 🛠️ Instalasi & Setup

1. **Clone repository & masuk ke direktori**:
   ```bash
   git clone https://github.com/rijalmuhamad388-oss/belajar-vibe-coding.git
   cd belajar-vibe-coding
   ```

2. **Install dependensi**:
   ```bash
   bun install
   ```

3. **Setup Environment Variables**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan `DATABASE_URL` dan `PORT` sesuai konfigurasi MySQL lokal Anda:
   ```env
   PORT=3000
   DATABASE_URL=mysql://root:password@localhost:3306/belajar_vibe_coding
   ```

---

## 🚦 Menjalankan Aplikasi

- **Development mode (dengan hot reload)**:
  ```bash
  bun run dev
  ```

- **Production mode**:
  ```bash
  bun run start
  ```

Buka browser atau kirim request ke:
```bash
curl http://localhost:3000/
# Output: Hello World
```

---

## 🗄️ Manajemen Database (Drizzle Kit)

- **Generate migration SQL**:
  ```bash
  bun run db:generate
  ```

- **Push schema langsung ke database**:
  ```bash
  bun run db:push
  ```

- **Jalankan migrasi**:
  ```bash
  bun run db:migrate
  ```

- **Buka Drizzle Studio (Web UI GUI)**:
  ```bash
  bun run db:studio
  ```
