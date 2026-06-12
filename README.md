# CT Quiz Lab

Media pembelajaran interaktif berbasis web untuk siswa SMP. Aplikasi ini berfokus pada gim edukasi pemecahan kasus yang mengintegrasikan empat pilar Computational Thinking:

- Decomposition
- Pattern Recognition
- Abstraction
- Algorithmic Thinking

Fitur utama:

- Role guru dan siswa
- Paket kuis interaktif berbasis materi
- Quiz utama berbasis materi
- Soal interaktif per pilar CT
- Feedback langsung yang membimbing alasan berpikir siswa
- Dashboard guru berbasis analisis pilar CT
- Dashboard siswa untuk progress, hasil, dan badge
- CRUD prototype untuk kuis, soal, dan aktivitas interaktif
- Laporan kemampuan CT siswa

Stack:

- Next.js
- React
- Tailwind CSS
- PostgreSQL
- Prisma

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://127.0.0.1:3000`.

## Database

Salin `.env.example` menjadi `.env`, lalu sesuaikan `DATABASE_URL`.

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

Login prototype:

- Guru: `guru@ctmission.test`
- Siswa: `naya@ctmission.test`
- Password demo: `prototype-password`
