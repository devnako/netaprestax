import Link from "next/link";

export default function ConfidentialitePage() {
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
        <h1 className="text-3xl font-bold text-foreground">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : mars 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-semibold">Responsable du traitement</h2>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>Finako — SALGADO FERNANDES Filipe</p>
              <p>8 Boulevard du Tenao, 06240 Beausoleil</p>
              <p>Email : contact@netaprestax.fr</p>
              <p>SIRET : 90916449300027</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Données collectées</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Données de compte :</strong> email, nom, mot de passe (chiffré)</li>
              <li><strong>Profil fiscal :</strong> type d&apos;activité, options fiscales, SIRET, adresse</li>
              <li><strong>Données financières :</strong> revenus, frais, facturation</li>
              <li><strong>Données techniques :</strong> IP, logs de connexion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Finalités</h2>
            <p className="mt-3 text-muted-foreground">
              Fourniture du service, sécurité, amélioration de l&apos;expérience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Conservation</h2>
            <p className="mt-3 text-muted-foreground">
              Données conservées pendant la durée d&apos;utilisation + 3 ans après dernière connexion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Partage</h2>
            <p className="mt-3 text-muted-foreground">
              Données jamais vendues. Sous-traitant technique : Vercel (hébergement), couvert par les clauses contractuelles types UE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Sécurité</h2>
            <p className="mt-3 text-muted-foreground">
              NetAprèsTax ne se connecte jamais à vos comptes bancaires. Toutes les données sont saisies manuellement. Les mots de passe sont chiffrés.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Vos droits (RGPD)</h2>
            <p className="mt-3 text-muted-foreground">
              Accès, rectification, effacement, portabilité, opposition. Pour exercer ces droits : contact@netaprestax.fr. En cas de litige :{" "}
              <a href="https://www.cnil.fr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                www.cnil.fr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Cookies</h2>
            <p className="mt-3 text-muted-foreground">
              Uniquement des cookies techniques nécessaires à l&apos;authentification. Aucun cookie publicitaire ou de tracking.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
