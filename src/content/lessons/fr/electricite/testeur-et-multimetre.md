---
title: Utiliser un testeur de tension et un multimètre
summary: Quel outil pour quelle mesure, comment régler un multimètre, et les trois erreurs qui rendent la mesure dangereuse.
order: 2
minutes: 20
level: beginner
risk: medium
safety: Pour mesurer une prise, utilisez un multimètre en bon état, cordons sans coupure, réglé sur V~ avant de toucher la prise. Tenez les pointes par la partie isolée, derrière les gardes, et ne touchez jamais le métal des pointes.
tools:
  - name: Vérificateur d’absence de tension (VAT)
    shelf: travaux-electricite
  - name: Multimètre
    shelf: travaux-outillage-general
  - name: Une pile neuve pour vous entraîner
callAPro:
  - Une prise affiche souvent moins de 200 V ou plus de 250 V.
  - Vous mesurez plusieurs dizaines de volts entre le neutre et la terre.
  - Il n’y a pas de tension entre la phase et la terre alors que la prise marche. La terre est sans doute absente ou coupée.
quiz:
  - question: Le tournevis testeur ne s’allume pas. Pouvez-vous toucher les fils ?
    options:
      - Oui
      - Non, il ne garantit pas l’absence de tension
      - Oui, si vous portez des gants
    answer: 1
    explanation: Le tournevis testeur peut rester éteint sur un fil sous tension (chaussures isolantes, mauvais contact, testeur usé). Seul un VAT ou un multimètre vérifié permet de conclure.
  - question: Pour mesurer une prise, sur quelle position mettre le multimètre ?
    options:
      - Ω (résistance)
      - V~ (tension alternative)
      - A (courant)
    answer: 1
    explanation: Le courant d’une prise est alternatif. Sur la position A, le multimètre fait court-circuit.
  - question: Le mode continuité (bip) s’utilise…
    options:
      - Sur un circuit hors tension uniquement
      - Sur une prise branchée
      - Sur le tableau électrique
    answer: 0
    explanation: En continuité, le multimètre envoie lui-même un petit courant. Sur un circuit sous tension, vous risquez de l’abîmer et de vous blesser.
---

## Trois outils, trois usages

| Outil | Ce qu’il dit | À quoi il sert |
|---|---|---|
| **Tournevis testeur** | « Il y a peut-être du courant » | Repérer la phase, pas plus. **Il ne prouve jamais l’absence de tension.** |
| **VAT** (vérificateur d’absence de tension) | « Il y a du courant, ou il n’y en a pas » | Vérifier qu’on peut toucher les fils avant un travail |
| **Multimètre** | Une valeur précise : volts, ohms | Mesurer une prise, une pile, tester un fusible ou une rallonge |

## La règle du VAT : tester, vérifier, tester

Un VAT en panne qui affiche « pas de tension », c’est le pire des pièges. Avant chaque utilisation :

1. **Testez** le VAT sur une prise qui marche : il doit indiquer la tension.
2. **Vérifiez** le circuit sur lequel vous allez travailler : entre les deux fils, puis entre chaque fil et la terre.
3. **Testez** à nouveau le VAT sur la prise qui marche. S’il fonctionne toujours, votre mesure est fiable.

## Régler le multimètre

Sur le cadran, vous trouverez :

- **V~** ou **VAC** : tension alternative, celle des prises.
- **V⎓** ou **VDC** : tension continue, celle des piles et des batteries.
- **Ω** : résistance, et souvent le symbole d’un haut-parleur pour la **continuité** (bip).
- **A** : courant. On ne s’en sert pas ici.

Le cordon **noir** va toujours dans la prise **COM**. Le cordon **rouge** va dans la prise marquée **VΩ**, jamais dans la prise **A** pour mesurer une tension : ce serait un court-circuit dans vos mains.

## Mesure 1 : une pile

Réglez sur V⎓, posez la pointe rouge sur le + et la noire sur le −. Une pile neuve de 1,5 V affiche un peu plus de 1,5 V. Commencez toujours par là : c’est sans danger et vous apprenez le geste.

> **Astuce** : la batterie de la voiture se mesure de la même façon, moteur arrêté depuis quelques heures. Vers 12,6 V elle est pleine. En dessous de 12,2 V, elle est à moitié vide et mérite une recharge.

## Mesure 2 : une prise de courant

1. Réglez sur **V~**, sur un calibre supérieur à 250 V si votre multimètre n’est pas automatique.
2. Enfoncez les deux pointes dans les deux trous de la prise. Vous devez lire environ **220 à 230 V**.
3. Entre la phase et la broche de terre, vous lisez à peu près la même valeur. Entre le neutre et la terre, presque rien.

## Mesure 3 : la continuité d’une rallonge

**Rallonge débranchée**, réglez sur la continuité. Posez une pointe sur une broche de la fiche et l’autre dans chaque trou de la prise au bout, l’un après l’autre. Un bip : ce fil est intact. Aucun bip sur aucun trou : le fil est coupé quelque part, la rallonge est à jeter.

## Les trois erreurs à éviter

- Mesurer une tension avec le cordon rouge dans la prise **A**.
- Utiliser la continuité ou les ohms sur un circuit **sous tension**.
- Faire confiance à un tournevis testeur pour dire « c’est coupé ».
