import Link from "next/link";
import { Calculator, UserCheck, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <span className="text-xl font-bold text-foreground">
            Net<span className="text-primary">AprèsTax</span>
          </span>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:px-4"
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 md:py-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            Ton CA, c&apos;est pas ton salaire.{" "}
            <span className="text-primary">Calcule ce qu&apos;il te reste.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Entre ton chiffre d&apos;affaires, vois instantanément ce qu&apos;il te reste
            après cotisations, impôts et frais. Gratuit. Sans prise de tête.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              Calculer mon vrai revenu
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Inscription en 30 secondes. Aucune CB requise.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Tu factures. Mais tu sais vraiment combien tu gardes ?
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <PainPoint
              title="Le flou permanent"
              description="Tu reçois un virement de 3 000€ et tu te sens riche. Sauf qu'après les cotisations URSSAF, l'impôt et tes frais... il reste combien exactement ?"
            />
            <PainPoint
              title="Le tableur bricolé"
              description="Tu as un fichier Excel trouvé sur internet. Tu oublies de le remplir un mois sur deux. Et tu n'es même pas sûr que les taux soient à jour."
            />
            <PainPoint
              title="La déclaration dans le stress"
              description="Chaque trimestre c'est la même chose. Tu te demandes combien tu dois, combien tu as mis de côté, et tu croises les doigts."
            />
          </div>
          <p className="mx-auto mt-12 max-w-2xl text-center text-lg text-muted-foreground">
            Le problème, c&apos;est pas que tu gagnes pas assez. C&apos;est que{" "}
            <strong className="text-foreground">
              tu ne sais pas ce que tu gagnes vraiment.
            </strong>
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Le seul chiffre qui compte :{" "}
            <span className="text-primary">ce qui reste dans ta poche</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-muted-foreground">
            Tu entres ton CA du mois et tes frais. On calcule tout automatiquement
            — cotisations URSSAF, impôt sur le revenu, CFP — avec les taux
            officiels 2026.
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <BenefitCard
              icon={<Calculator className="h-8 w-8 text-primary" />}
              title="Ton vrai revenu en 10 secondes"
              description="Cotisations sociales, impôt, contribution formation — tout est calculé avec les taux officiels URSSAF. Tu vois immédiatement ce que tu gardes."
            />
            <BenefitCard
              icon={<UserCheck className="h-8 w-8 text-primary" />}
              title="Adapté à TA situation"
              description="BIC, BNC, versement libératoire, ACRE, TVA — ton profil fiscal est configuré une seule fois. Chaque calcul est personnalisé."
            />
            <BenefitCard
              icon={<TrendingUp className="h-8 w-8 text-primary" />}
              title="Suis ton évolution"
              description="Ce n'est pas un simulateur qu'on utilise une fois. C'est ton tableau de bord financier, mois après mois."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            3 étapes. 30 secondes. Ton vrai revenu.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            <Step
              number="1"
              title="Crée ton profil"
              description="Inscription gratuite en 30 secondes. On te demande ton activité, ton régime fiscal, et c'est tout."
            />
            <Step
              number="2"
              title="Entre ton CA du mois"
              description="Un seul champ à remplir. Ajoute tes frais si tu veux être encore plus précis."
            />
            <Step
              number="3"
              title="Vois ce qu'il te reste"
              description="Cotisations, impôt, frais — tout est détaillé. Tu sais exactement combien tu peux te verser."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Un prix qui te laisse de l&apos;argent dans la poche
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-2 md:max-w-3xl md:mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-border p-8">
              <h3 className="text-lg font-semibold text-foreground">Gratuit</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pour savoir combien tu gardes vraiment
              </p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-foreground">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </p>
              <Link
                href="/register"
                className="mt-8 block rounded-lg border border-primary bg-white px-6 py-3 text-center font-medium text-primary hover:bg-primary/5"
              >
                Commencer gratuitement
              </Link>
              <ul className="mt-8 space-y-3">
                <PricingFeature text="Calculateur de net réel illimité" />
                <PricingFeature text="Saisie de tes frais réels" />
                <PricingFeature text="Suivi du mois en cours" />
                <PricingFeature text="Taux URSSAF officiels 2026" />
                <PricingFeature text="Support ACRE" />
              </ul>
            </div>
            {/* Pro */}
            <div className="rounded-2xl border-2 border-primary p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                Bientôt disponible
              </div>
              <h3 className="text-lg font-semibold text-foreground">Pro</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pour piloter ton activité comme un pro
              </p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-foreground">7€</span>
                <span className="text-muted-foreground">/mois</span>
              </p>
              <div className="mt-8 block rounded-lg bg-muted px-6 py-3 text-center font-medium text-muted-foreground cursor-not-allowed">
                Prochainement
              </div>
              <ul className="mt-8 space-y-3">
                <PricingFeature text="Tout le plan Gratuit" />
                <PricingFeature text="Historique complet mois par mois" />
                <PricingFeature text="Graphiques d'évolution" />
                <PricingFeature text="Alertes seuils auto-entrepreneur" />
                <PricingFeature text="Simulation de scénarios" />
                <PricingFeature text="Rappels de déclarations" />
                <PricingFeature text="Export PDF/CSV" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Questions fréquentes
          </h2>
          <div className="mt-12 space-y-6">
            <FAQ
              question="C'est vraiment gratuit ?"
              answer="Oui. Le calculateur de revenu net, la saisie des frais et le suivi mensuel sont 100% gratuits. Le plan Pro avec des fonctionnalités avancées arrivera bientôt, mais le cœur de l'app restera gratuit."
            />
            <FAQ
              question="Quels statuts sont supportés ?"
              answer="Pour l'instant, uniquement les auto-entrepreneurs (micro-entreprise). BIC vente, BIC prestation de services, et BNC activités libérales."
            />
            <FAQ
              question="Est-ce que ça remplace mon comptable ?"
              answer="Non. NetAprèsTax est un outil d'estimation et de suivi. Il te donne une vision claire de ta rentabilité, mais ne se substitue pas à un conseil fiscal personnalisé."
            />
            <FAQ
              question="Comment sont calculées les cotisations ?"
              answer="On applique les taux URSSAF officiels 2026 selon ton type d'activité. Si tu bénéficies de l'ACRE, les taux réduits sont automatiquement appliqués. La CFP est aussi incluse."
            />
            <FAQ
              question="Mes données sont en sécurité ?"
              answer="Tes données sont hébergées en Europe, chiffrées, et ne sont jamais partagées. On ne te demande pas d'accès bancaire. Tu entres tes chiffres toi-même."
            />
            <FAQ
              question="Je suis en versement libératoire, ça change quoi ?"
              answer="Tout est automatique. Si tu as le versement libératoire, on applique le taux forfaitaire sur ton CA. Sinon, on estime ton impôt avec le barème progressif en fonction de ta situation familiale."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Tu factures. On te dit ce que tu gardes.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Crée ton compte en 30 secondes. Entre ton CA. Vois ton vrai revenu
            net. C&apos;est aussi simple que ça.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            Calculer mon vrai revenu — c&apos;est gratuit
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Gratuit. Sans CB. Données hébergées en France.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-5">
        <div className="mx-auto max-w-[900px] px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Accueil">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-7 w-7">
                <rect width="32" height="32" rx="6" fill="#2563eb"/>
                <text x="16" y="21.5" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="12" fill="white">NAT</text>
              </svg>
            </Link>
            <div className="flex flex-wrap justify-end gap-5 text-[13px] text-muted-foreground">
              <Link href="/mentions-legales" className="hover:text-foreground transition-colors">
                Mentions légales
              </Link>
              <Link href="/cgu" className="hover:text-foreground transition-colors">
                CGU
              </Link>
              <Link href="/confidentialite" className="hover:text-foreground transition-colors">
                Confidentialité
              </Link>
              <a href="mailto:contact@netaprestax.fr" className="hover:text-foreground transition-colors">
                contact@netaprestax.fr
              </a>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground/70">
            © 2026 NetAprèsTax
          </p>
        </div>
      </footer>
    </div>
  );
}

function PainPoint({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <h3 className="mt-6 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
        {number}
      </div>
      <h3 className="mt-6 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
      <span className="text-sm text-foreground">{text}</span>
    </li>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-xl bg-white p-6 shadow-sm">
      <summary className="cursor-pointer list-none font-semibold text-foreground">
        {question}
      </summary>
      <p className="mt-4 leading-relaxed text-muted-foreground">{answer}</p>
    </details>
  );
}
