import Link from "next/link";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link href="/" className="text-xl font-bold text-foreground">
            Net<span className="text-primary">AprèsTax</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <h1 className="text-3xl font-bold text-foreground">Mentions légales</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-semibold">Éditeur du site</h2>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>Nom : SALGADO FERNANDES Filipe</p>
              <p>Nom commercial : Finako</p>
              <p>Adresse : 8 Boulevard du Tenao, 06240 Beausoleil, France</p>
              <p>SIRET : 90916449300027</p>
              <p>Email : contact@netaprestax.fr</p>
              <p>Statut : Micro-entrepreneur</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Hébergement</h2>
            <p className="mt-3 text-muted-foreground">
              Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA —{" "}
              <a href="https://vercel.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                https://vercel.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
