import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './faq.page.html',
  styleUrl: './faq.page.css'
})
export class FaqPage implements OnInit {
  ngOnInit(): void {
    // TODO: Add SEO service when available
  }

  readonly sections: FAQSection[] = [
    {
      title: 'Questions sur les formations',
      items: [
        {
          question: "Vos diplômes sont reconnus par l'État ?",
          answer:
            `Oui ! Tous nos titres diplômants sont inscrits au RNCP (Répertoire National de la Certification Professionnelle). Ça veut dire qu'ils sont reconnus par l'État et valables partout en France et en Europe. Le RNCP, c'est la garantie officielle que votre diplôme a une vraie valeur sur le marché du travail. Chaque niveau correspond à un niveau de compétences et de responsabilités reconnu.`,
        },
        {
          question: 'Je peux entrer à Unlock sans le bac ?',
          answer:
            `Oui, c'est possible ! Le bac n'est pas obligatoire pour démarrer chez nous. Vous pouvez commencer par un titre de niveau bac dans une spécialité précise, puis progresser jusqu'à un niveau bac +3/4 si vous le souhaitez. L'important, c'est votre motivation et votre projet.`,
        },
        {
          question: `Vous m'aidez à trouver une alternance ou un stage ?`,
          answer:
            `Carrément ! On vous accompagne à toutes les étapes. Avant la formation, notre équipe relations entreprises vous rencontre, évalue votre motivation, vous aide à peaufiner votre CV et vous entraîne pour les entretiens. On vous met aussi en relation avec nos entreprises partenaires qui recrutent. Pendant la formation, vous avez accès à un module "Techniques de Recherche d'Emploi" et à toutes les offres de nos partenaires. Après la formation, on organise des ateliers CV et des sessions de "Speed Recruiting" pour vous aider à décrocher un job ou continuer en alternance. Pour les stages, on diffuse les offres et on peut vous mettre en contact avec notre réseau.`,
        },
        {
          question: `Je trouve une alternance en cours d'année, ça se passe comment ?`,
          answer:
            `Pas de souci ! Notre école est flexible : vous pouvez passer en alternance à tout moment de l'année. Si vous démarrez en initial et que vous trouvez une alternance en cours de route, on rembourse les frais de formation au prorata du temps passé. On adapte votre planning à vos objectifs et aux besoins de votre entreprise, tout en respectant bien sûr le programme pédagogique (on ne peut pas faire le cours avancé avant le cours de base !).`,
        },
      ],
    },
    {
      title: 'Financer mes études',
      items: [
        {
          question: 'Comment financer mes études avec un prêt étudiant ?',
          answer:
            `On vous aide ! Unlock vous met en relation avec plusieurs banques partenaires pour obtenir un prêt étudiant aux meilleures conditions. On vous accompagne dans vos démarches pour trouver le financement qui vous convient.`,
        },
        {
          question: 'Je peux faire un prêt dans une autre banque que la mienne ?',
          answer:
            `Oui, bien sûr ! Même si c'est souvent plus simple de commencer par demander à votre banque actuelle (ils peuvent vous faire des conditions sympa pour vous garder), vous pouvez tout à fait aller voir ailleurs et comparer les offres.`,
        },
        {
          question: 'Comment je m\'y prends ?',
          answer:
            `Stratégie simple : commencez par voir votre banque actuelle (ils vous connaissent, c'est un avantage). Puis allez voir la concurrence pour comparer. Ça vous donnera des arguments pour négocier avec votre banque ('La banque X me propose mieux, vous pouvez faire quelque chose ?'). Et même si vous prenez un prêt ailleurs, vous pouvez garder votre compte actuel. Les banques veulent garder les jeunes clients, alors jouez-en !`,
        },
        {
          question: 'Je suis retraité, je peux me former ?',
          answer:
            `Oui ! Même si vous ne pouvez plus utiliser votre CPF, vous pouvez bénéficier d'autres dispositifs, notamment dans le cadre d'activités bénévoles ou associatives. N'hésitez pas à nous contacter pour qu'on vous oriente vers les bonnes solutions.`,
        },
        {
          question: 'Comment la banque évalue ma demande de prêt ?',
          answer:
            `La banque regarde plusieurs choses avant de dire oui : vos garanties (souvent, il faut quelqu'un qui se porte garant pour vous), votre capacité de remboursement (en fonction de vos études et de vos revenus futurs estimés), votre historique bancaire (pas d'incidents de paiement, c'est mieux !), et votre situation personnelle globale. Si le montant est élevé, le dossier peut remonter au siège pour validation. Une fois tout ça analysé, la banque vous donne sa réponse.`,
        },
      ],
    },
    {
      title: 'Formations conventionnées (pour demandeurs d\'emploi)',
      items: [
        {
          question: "C'est quoi une formation conventionnée ?",
          answer:
            `C'est une formation dont les frais sont entièrement pris en charge par un financeur public (Région, Pôle Emploi, etc.). Vous ne payez rien ou presque (parfois juste des frais de dossier ou de kit numérique). C'est l'opportunité parfaite si vous êtes demandeur d'emploi !`,
        },
        {
          question: 'Qui peut postuler ?',
          answer:
            "Seuls les demandeurs d'emploi inscrits à Pôle Emploi peuvent candidater. Les prérequis spécifiques sont indiqués sur chaque fiche de formation conventionnée. Vérifiez bien que votre profil correspond avant de postuler.",
        },
        {
          question: 'Comment je postule ?',
          answer:
            `Directement en ligne ! Consultez notre offre de formations conventionnées, lisez bien le programme et les prérequis, puis cliquez sur "Postuler". Vous pouvez même postuler à plusieurs formations en même temps si plusieurs vous intéressent. Tout se fait depuis votre espace candidat.`,
        },
        {
          question: 'Comment vous sélectionnez les candidats ?',
          answer:
            "Notre équipe pédagogique traite les candidatures en priorité pour les sessions qui démarrent bientôt. On vérifie que votre profil correspond bien aux prérequis. Si c'est bon, on vous recontacte entre 1 mois et demi et 1 semaine avant le démarrage pour une réunion d'info et des tests de niveau. Attention : les places sont limitées ! Si la session est complète, on garde votre dossier pour la suivante.",
        },
        {
          question: 'Je serai payé pendant la formation ?',
          answer:
            "Vous continuerez à toucher vos allocations chômage si vous y avez droit. Par contre, si vos droits sont terminés, vous ne serez pas rémunéré. En formation conventionnée, c'est uniquement le coût de la formation qui est pris en charge, pas votre salaire.",
        },
      ],
    },
    {
      title: 'Mon Compte Personnel de Formation (CPF)',
      items: [
        {
          question: "Je n'ai pas assez d'heures CPF, je fais comment ?",
          answer:
            `Pas de panique ! Pour les formations courtes, vous pouvez demander un "abondement" : c'est un complément qui vient compléter vos heures CPF. Ça marche pour les salariés et les demandeurs d'emploi. Pour les formations longues avec reconversion pro, vous pouvez utiliser le CPF de transition (ou Projet de Transition Professionnelle) qui finance les formations longues diplômantes.`,
        },
        {
          question: "C'est quoi le CPF de transition ?",
          answer:
            `C'est le dispositif qui a remplacé l'ancien CIF (Congé Individuel de Formation) en 2019. Il permet à tout salarié de suivre une formation longue pour se reconvertir. C'est géré par les organismes "Transitions Pro" (anciennement Fongecif). Ce dispositif finance les formations diplômantes éligibles au CPF. Attention : vous devez monter un dossier et obtenir l'accord de Transitions Pro.`,
        },
        {
          question: "Je dois demander l'accord de mon employeur ?",
          answer:
            `Ça dépend ! Si la formation a lieu pendant votre temps de travail, oui, il faut l'accord de votre employeur. Vous devez faire une demande écrite au moins 60 jours avant (pour une formation de moins de 6 mois) ou 120 jours avant (pour une formation de plus de 6 mois). Votre employeur a 30 jours pour répondre. Pas de réponse = accord automatique ! Il peut reporter votre départ en formation de maximum 9 mois. Si la formation a lieu hors temps de travail (soirs, week-ends), pas besoin de son accord, vous gérez tout sur MonCompteFormation.`,
        },
        {
          question: 'Je serai payé pendant ma formation ?',
          answer:
            `Ça dépend du type de formation. Formation courte sur temps de travail : votre employeur continue de vous payer normalement. Formation hors temps de travail : pas de rémunération. Formation longue avec CPF de transition : l'organisme financeur (Transitions Pro) vous verse une rémunération, mais attention, elle peut être partielle selon votre situation.`,
        },
        {
          question:
            "Je suis demandeur d'emploi, comment utiliser mon CPF ?",
          answer:
            `Vous utilisez les heures que vous avez accumulées pendant vos périodes d'activité. Important : les formations que vous choisissez doivent être diplômantes. Si vous n'avez pas assez d'heures, parlez-en à votre conseiller Pôle Emploi qui peut débloquer un complément. Pour la rémunération : vous continuez à toucher vos allocations si vous y avez droit. Si vous n'êtes pas indemnisé, vous pouvez demander la RFPE (Rémunération des Formations de Pôle Emploi). Si la formation dure plus longtemps que votre période d'indemnisation, vous pouvez sous certaines conditions demander la RFF (Rémunération de Fin de Formation).`,
        },
      ],
    },
  ];
}

