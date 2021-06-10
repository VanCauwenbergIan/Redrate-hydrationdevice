# Projectgegevens

**Ian Van Cauwenberg:**

**Sparringpartner: Maxime Ryheul**

**Track je waterconsumptie en krijg feedback**

**Redrate:**

# Tips voor feedbackgesprekken

## Voorbereiding

> Bepaal voor jezelf waar je graag feedback op wil. Schrijf op voorhand een aantal punten op waar je zeker feedback over wil krijgen. Op die manier zal het feedbackgesprek gerichter verlopen en zullen vragen, die je zeker beantwoord wil hebben, aan bod komen.

## Tijdens het gesprek:

> **Luister actief:** Schiet niet onmiddellijk in de verdediging maar probeer goed te luisteren. Laat verbaal en non-verbaal ook zien dat je aandacht hebt voor de feedback door een open houding (oogcontact, rechte houding), door het maken van aantekeningen, knikken...

> **Maak notities:** Schrijf de feedback op zo heb je ze nog nadien. Noteer de kernwoorden en zoek naar een snelle noteer methode voor jezelf. Als je goed noteert,kan je op het einde van het gesprek je belangrijkste feedback punten kort overlopen.

> **Vat samen:** Wacht niet op een samenvatting door de docenten, dit is jouw taak: Check of je de boodschap goed hebt begrepen door actief te luisteren en samen te vatten in je eigen woorden.

> **Sta open voor de feedback:** Wacht niet op een samenvatting door de docenten, dit is jouw taak: Check of je de boodschap goed hebt begrepen door actief te luisteren en samen te vatten in je eigen woorden.`

> **Denk erover na:** Denk na over wat je met de feedback gaat doen en koppel terug. Vind je de opmerkingen terecht of onterecht? Herken je je in de feedback? Op welke manier ga je dit aanpakken?

## NA HET GESPREK

> Herlees je notities en maak actiepunten. Maak keuzes uit alle feedback die je kreeg: Waar kan je mee aan de slag en wat laat je even rusten. Wat waren de prioriteiten? Neem de opdrachtfiche er nog eens bij om je focuspunten te bepalen.Noteer je actiepunten op de feedbackfiche.

# Feedforward gesprekken

## Gesprek 1 (Datum: 16/03/2021)

Lector: Geert & Frederik

Vragen voor dit gesprek:

- [x] vraag 1: Wat zou jezelf aanpassen? (bvb. een ander type sensoren)
- [x] vraag 2: Is het project haalbaar volgens u?
- [x] vraag 3: Ik dacht erover om ook een mini-luidspreker toe te voegen, is het beter om deze te plaatsen onder nice-to haves (eerst focussen op led strip)?
- [ ] vraag 4: Zou het beter zijn om ook gebruik te maken van een arduino of esp32 idpv enkel een rasp?

Dit is de feedback op mijn vragen.

- feedback
  Voor een gewoon geluidje af te spelen zou een luidspreker geen probleem mogen zijn. Gebruik het veschil in gewicht om ook te bepalen of er een nieuwe fles is opgeplaatst. Ik zou enkel een knop gebruiken om een neiuwe fles zwaardere of lichtere fles aan te geven.

Hier komt de feedforward: wat ga ik concreet doen?

- [x] ToDo 1
      nadenken over hoe ik de code ga aanpakken, nadenken over het ontwerp
- [x] ToDo 2
      blokschema aanpassen (display en knop)

## Gesprek 2 (Datum: dd/mm/yyyy)

niet van toepassing

# Toermoment1 (Datum: 26/05/2021)

Lector: Stijn & Dieter

corrupte sd kaart :(

# Consult 1 (Datum: 27/05/2021)

Lector: Simon

Vragen voor dit gesprek:

- [x] vraag 1: Gaat het design de goede richting uit?

- feedback

  - Andere kleuren nemen (heeft meer weg van de zee of een donker meer dan een glas water)
  - Zet settings apart, niet onder details
  - Maak de knop iets opvallender
  - Begin met het eerst in te kaderen, het design valt moeilijk uit te rekken

- [x] ToDo 1
      Nieuw kleurenschema opstellen
- [x] ToDo 2
      Settings apart plaatsen onder een icon
- [x] ToDo 3
      Knop opvallender maken met icon erbij

# Consult 2 (Datum: 31/05/2021)

Lector: Pieter-Jan

Vragen voor dit gesprek:

- [x] vraag 1: Zijn gewone breadboard jumpers geschikt om grotere stromen van +- 1A te dragen?

- feedback

  - waarschijnlijk wel, maar als je het veilig wil spelen begin je best met een kleiner stuk. Je kunt altijd later een dikkere kabel aan een ander stuk solderen.

- [x] ToDo 1
      Test ledstrip maken
- [ ] ToDo 2
      Finale versie maken

# Consult 3 (Datum: 01/06/2021)

Lector: Geert

Vragen voor dit gesprek:

- [x] vraag 1: De ledstrip zorgt voor storing op de vochtigheidssensor, hoe los ik dit op?

- feedback

  - massaprobleem

- [x] ToDo 1
      Ground verstoken

# Tourmoment 2 (Datum: 03/06/2021)

Lector: Dieter & Frederik

Vragen voor dit gesprek:

- [x] vraag 1: De ledstrip zorgt voor storing op de lcd

- feedback

  - geen werkende actuator -> boek consult elektronica
  - geen behuizing!
  - site op schema

- [x] ToDo 1
      Nieuw consult elektronica
- [x] ToDo 2
      Behuizing maken (dummy), waarom? origineel te duur en tijdsgebrek

# Consult 4 (Datum: 04/06/2021)

Lector: Geert

Vragen voor dit gesprek:

- [x] vraag 1: De ledstrip zorgt voor storing op de lcd, hoe los ik dit op?

- feedback

  - massaprobleem, maar niet op te lossen vanop afstand

- [x] ToDo 1
      Nieuw consult boeken

# Consult 5 (Datum: 07/06/2021)

Lector: Geert & Pieter-Jan

Vragen voor dit gesprek:

- [x] vraag 1: De ledstrip zorgt voor storing op de lcd, hoe los ik dit op?

- feedback

  - massaprobleem, enable pin lcd geschakeld met weerstand op 3.3V en GPIO pin (laatste is normaal). Grotere weerstanden op transistoren

- [x] ToDo 1
      Loadcell toevoegen aan MVP

# Tourmoment 3 (Datum: 10/06/2021)

Lector: Dieter & Frederik

- feedback

  - werk de behuizing nog wat verder af
  - display de humidity en temperatuur op de homepage
  - foutje fraction
  - pas settings aan (rephrasen en min hoeveelheid aanpassen)
  -

- [ ] ToDo 1
      Settings aanpassen
- [ ] ToDo 2
      Behuizing afwerken
- [ ] ToDo 3
      Homepage aanpassen
