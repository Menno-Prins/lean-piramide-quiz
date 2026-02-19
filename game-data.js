// Game Data - Lean Piramide Technische Unie

const gameData = {
    // Ronde 1: De 3 aspecten rechtsboven de piramide
    aspecten: [
        { naam: "Elke dag beter", positie: 1, kleur: "oranje" },
        { naam: "Gewenst gedrag", positie: 2, kleur: "groen" },
        { naam: "In control", positie: 3, kleur: "groen-donker" }
    ],

    // Ronde 2: De 6 treden van de piramide
    treden: [
        { naam: "Inzicht", niveau: 1 },
        { naam: "Beheersen", niveau: 2 },
        { naam: "Verbeteren", niveau: 3 },
        { naam: "Van buiten naar binnen", niveau: 4 },
        { naam: "Met ketenpartners klantgericht", niveau: 5 },
        { naam: "Continu verbeteren voor de klant", niveau: 6 }
    ],

    // Ronde 3 & 4: Bouwblokken per trede
    bouwblokken: [
        // Trede 1 - Inzicht (7 bouwblokken - geel)
        {
            naam: "Urgentie voor verbeteren",
            trede: 1,
            volwassenheid: "Lean Scan is leidend voor alle verbeteringen en wordt elk kwartaal opnieuw gehanteerd"
        },
        {
            naam: "Stem van de klant",
            trede: 1,
            volwassenheid: "In alle geledingen is het besef zeer hoog om te verbeteren n.a.v. Klantfeedback"
        },
        {
            naam: "Stip op de horizon",
            trede: 1,
            volwassenheid: "Meerjarenplan is uitgewerkt tot op medewerkerniveau, welke bijdrage er geleverd wordt"
        },
        {
            naam: "Leiderschap en gedrag",
            trede: 1,
            volwassenheid: "Leiderschap pyramide is omgekeerd, leider is onderdeel van het team"
        },
        {
            naam: "Vaststellen KPI's",
            trede: 1,
            volwassenheid: "KPI's zijn vastgesteld en doorvertaald op basis van klant"
        },
        {
            naam: "Visueel Management",
            trede: 1,
            volwassenheid: "Inzichten worden gebruikt om elke dag een stap beter te doen op basis van klantstuuritems"
        },
        {
            naam: "Dag- en weekstarts",
            trede: 1,
            volwassenheid: "Dialoog wordt gevoerd door medewerkers en ze spreken elkaar aan op de geleverde prestaties en verbeteren continue, management faciliteert"
        },

        // Trede 2 - Beheersen (6 bouwblokken - groen)
        {
            naam: "Standaard proces inrichten",
            trede: 2,
            volwassenheid: "PDCA routine leid tot veteringen en future state VSM en dagelijks wordt er aan verbeteringen gewerkt"
        },
        {
            naam: "Definiëren van waardestromen",
            trede: 2,
            volwassenheid: "Waardestroom is leidend bij alle processtappen en verbeterroutine"
        },
        {
            naam: "Kennis van Lean",
            trede: 2,
            volwassenheid: "Er wordt gestreefd naar perfectie vanuit alle 5 de pricipes"
        },
        {
            naam: "Kennis van technieken",
            trede: 2,
            volwassenheid: "Lean technieken worden dagelijks toegepast om verbeteringen zichtbaar en meetbaar te maken"
        },
        {
            naam: "Verbeterroutine",
            trede: 2,
            volwassenheid: "Onbewust bekwaam maakt de organisatie dagelijks gebruik van KATA/Verbetrroutine"
        },
        {
            naam: "6S Implementatie",
            trede: 2,
            volwassenheid: "Organisatie is volledig 6S ingericht en verbeterd hier dagelijks op"
        },

        // Trede 3 - Verbeteren (5 bouwblokken - groen)
        {
            naam: "Effectieve waardestromen",
            trede: 3,
            volwassenheid: "Klanten zijn onderdeel van verbeteringen vanuit de waardestroom"
        },
        {
            naam: "Efficiënte waardestromen",
            trede: 3,
            volwassenheid: "Processen zijn ingericht naar waardestromen en organisatie is hier op aangepast"
        },
        {
            naam: "Implementatie Gembawalks",
            trede: 3,
            volwassenheid: "GembaWalk is vast onderdeel van de agenda van iedere leidinggevende"
        },
        {
            naam: "Besluitvorming o.b.v. feiten",
            trede: 3,
            volwassenheid: "Verbeteren is altijd op basis van data en gericht op grondoorzaken weg te nemen"
        },
        {
            naam: "A3 probleem oplossen",
            trede: 3,
            volwassenheid: "Grondoorzaken keren niet meer terug door juist gebruik A3"
        },

        // Trede 4 - Van buiten naar binnen (3 bouwblokken - groen)
        {
            naam: "Organisatie inrichting naar waardestromen",
            trede: 4,
            volwassenheid: "Organisatie is volledig ingericht naar klantprocessen"
        },
        {
            naam: "Medewerkers 'empowered'",
            trede: 4,
            volwassenheid: "Medewerkers nemen zelfstandig beslissingen in het belang van de klant"
        },
        {
            naam: "Werken aan klanttevredenheid",
            trede: 4,
            volwassenheid: "Klanttevredenheid is de belangrijkste KPI voor alle medewerkers"
        },

        // Trede 5 - Met ketenpartners klantgericht (3 bouwblokken - groen/oranje)
        {
            naam: "Business partners betrokken in Lean proces",
            trede: 5,
            volwassenheid: "Leveranciers en partners zijn actief betrokken bij verbeterinitiatieven"
        },
        {
            naam: "Medewerkers werken volgens Lean principes",
            trede: 5,
            volwassenheid: "Alle medewerkers passen dagelijks Lean principes toe in hun werk"
        },
        {
            naam: "PDCA mentaliteit",
            trede: 5,
            volwassenheid: "Plan-Do-Check-Act is de standaard werkwijze voor alle verbeteringen"
        },

        // Trede 6 - Continu verbeteren voor de klant (3 bouwblokken - oranje)
        {
            naam: "Klant centraal",
            trede: 6,
            volwassenheid: "De klant staat centraal in alle beslissingen en processen"
        },
        {
            naam: "Continu verbeteren",
            trede: 6,
            volwassenheid: "Verbeteren is een continu proces dat nooit stopt"
        },
        {
            naam: "Lean organisatie",
            trede: 6,
            volwassenheid: "De organisatie is een volwassen Lean organisatie"
        }
    ],

    // Helper functies
    getBouwblokkenByTrede: function(tredeNummer) {
        return this.bouwblokken.filter(b => b.trede === tredeNummer);
    },

    getBouwblokkenByTredes: function(tredeNummers) {
        return this.bouwblokken.filter(b => tredeNummers.includes(b.trede));
    },

    getAllBouwblokNamen: function() {
        return this.bouwblokken.map(b => b.naam);
    },

    getRandomVolwassenheidVragen: function(aantal) {
        const shuffled = [...this.bouwblokken].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, aantal);
    }
};

// Ronde configuratie
const rondeConfig = [
    {
        nummer: 1,
        titel: "De 3 Aspecten",
        beschrijving: "De piramide bestaat uit bouwblokken in drie categorieën die ieder een eigen kleur hebben. Welke kleur is wat?",
        type: "aspecten",
        aantalVragen: 1, // 1 vraag met 3 items om te plaatsen
        puntenPerCorrect: 100
    },
    {
        nummer: 2,
        titel: "De 6 Treden",
        beschrijving: "Plaats de zes treden van de piramide op de juiste volgorde (van laag naar hoog)",
        type: "treden",
        aantalVragen: 1, // 1 vraag met 6 items om te plaatsen
        puntenPerCorrect: 100
    },
    {
        nummer: 3,
        titel: "Bouwblokken Trede 1 - Inzicht",
        beschrijving: "Welke 7 bouwblokken zijn onderdeel van de eerste trede 'Inzicht'?",
        type: "bouwblokken-selectie",
        targetTrede: 1,
        aantalVragen: 7,
        puntenPerCorrect: 100
    },
    {
        nummer: 4,
        titel: "Bouwblokken Trede 2 - Beheersen",
        beschrijving: "Welke 6 bouwblokken zijn onderdeel van de tweede trede 'Beheersen'?",
        type: "bouwblokken-selectie",
        targetTrede: 2,
        aantalVragen: 6,
        puntenPerCorrect: 100
    },
    {
        nummer: 5,
        titel: "Bouwblokken Trede 3 - Verbeteren",
        beschrijving: "Welke 5 bouwblokken zijn onderdeel van de derde trede 'Verbeteren'?",
        type: "bouwblokken-selectie",
        targetTrede: 3,
        aantalVragen: 5,
        puntenPerCorrect: 100
    },
    {
        nummer: 6,
        titel: "Volwassenheidsniveau",
        beschrijving: "Koppel de omschrijving van het hoogste volwassenheidsniveau aan het juiste bouwblok",
        type: "volwassenheid",
        aantalVragen: 5,
        puntenPerCorrect: 200
    }
];

// Export voor gebruik in andere bestanden
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameData, rondeConfig };
}
