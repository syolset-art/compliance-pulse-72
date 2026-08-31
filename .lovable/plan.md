# Tydeligere formulering av partnerandelen på fakturagrunnlaget

Lenken under perspektivbytteren på `/msp-invoices` sier i dag «30 % partnerandel · Partneravtale». Formuleringen leser som en handling eller en innstilling brukeren kan endre her, mens den i realiteten kun gjengir satsen som allerede er registrert i fakturainnstillingene og partneravtalen.

## Endringen

Teksten omformuleres til en nøytral, opplysende setning som gjør kilden tydelig:

> Partnerens andel: 30 % — registrert i fakturainnstillinger og partneravtale

Lenken beholdes til `/msp-billing`, men presenteres som «Se innstillinger» i klartekst ved hjelp av understreking på hover som i dag. Satsen hentes fortsatt fra `partnerSharePct`, altså den registrerte verdien — ingen ny beregning og ingen redigering på denne siden.

## Teknisk

- Kun `src/pages/MSPInvoices.tsx`, linje 192–197: oppdatert lenketekst, samme rute og styling.
- Ingen endring i datakilde, beregninger eller backend.
