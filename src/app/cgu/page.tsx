import Link from "next/link";

export default function CGUPage() {
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
        <h1 className="text-3xl font-bold text-foreground">Conditions Générales d&apos;Utilisation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : mars 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-semibold">Article 1 — Objet</h2>
            <p className="mt-3 text-muted-foreground">
              Les présentes CGU régissent l&apos;accès et l&apos;utilisation de l&apos;application web NetAprèsTax, éditée par Finako (SALGADO FERNANDES Filipe, SIRET 90916449300027). NetAprèsTax est un outil de gestion financière destiné aux auto-entrepreneurs français.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Article 2 — Acceptation</h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;utilisation de NetAprèsTax implique l&apos;acceptation pleine et entière des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Article 3 — Accès au service</h2>
            <p className="mt-3 text-muted-foreground">
              NetAprèsTax est accessible gratuitement. L&apos;éditeur se réserve le droit de modifier, suspendre ou interrompre l&apos;accès au service à tout moment. La création d&apos;un compte nécessite une adresse email valide. L&apos;utilisateur est responsable de la confidentialité de ses identifiants.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Article 4 — Utilisation du service</h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;utilisateur s&apos;engage à utiliser NetAprèsTax conformément à sa destination et aux lois en vigueur, à ne pas tenter de contourner les mesures de sécurité, et à fournir des informations exactes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Article 5 — Données fiscales</h2>
            <p className="mt-3 text-muted-foreground">
              Les calculs fournis sont basés sur les taux officiels URSSAF et donnés à titre indicatif uniquement. Ils ne constituent pas un conseil fiscal ou comptable. L&apos;utilisateur est seul responsable de ses déclarations fiscales et sociales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Article 6 — Facturation</h2>
            <p className="mt-3 text-muted-foreground">
              Les documents générés (devis, factures, avoirs) sont fournis à titre d&apos;aide à la gestion. L&apos;éditeur ne stocke pas les PDFs. L&apos;utilisateur est responsable de la conservation de ses documents comptables (10 ans).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Article 7 — Propriété intellectuelle</h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;ensemble des éléments de NetAprèsTax est la propriété exclusive de Finako. Toute reproduction sans autorisation est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Article 8 — Limitation de responsabilité</h2>
            <p className="mt-3 text-muted-foreground">
              L&apos;éditeur ne peut garantir un fonctionnement ininterrompu et ne saurait être tenu responsable des dommages résultant de l&apos;utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Article 9 — Droit applicable</h2>
            <p className="mt-3 text-muted-foreground">
              Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence des tribunaux français.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
