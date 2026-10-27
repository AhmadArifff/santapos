import Link from 'next/link';
import FuzzyText from '@/components/FuzzyText';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-orb not-found-orb--one" aria-hidden />
      <div className="not-found-orb not-found-orb--two" aria-hidden />
      <div className="not-found-noise" aria-hidden />

      <section className="not-found-card">
        <FuzzyText
          className="not-found-fuzzy"
          baseIntensity={0.2}
          hoverIntensity={0.5}
          enableHover
        >
          404
        </FuzzyText>

        <h1 className="not-found-title">This page could not be found.</h1>
        <p className="not-found-description">
          Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau URL yang dimasukkan belum tepat.
        </p>
        <p className="not-found-help">Coba kembali ke beranda untuk melanjutkan aktivitas Anda.</p>

        <Link href="/" className="not-found-home-link">
          Kembali ke Beranda
        </Link>
      </section>
    </main>
  );
}
