# Klard E-Mail-Templates

12 produktionsreife HTML-Templates für alle Klard-E-Mail-Benachrichtigungen.
Alle nutzen Handlebars-Platzhalter {{variable}} und sind für Resend, Postmark
und SendGrid kompatibel.

## Installation in Replit

1. Kopieren Sie diesen Ordner in Ihr Replit-Projekt unter `services/email-templates/`
2. Installieren Sie die nötigen Pakete:
   ```
   npm install resend handlebars
   ```
3. Verwenden Sie die `services/email.js` aus dem Workflow-PDF (Schritt 6).

## Verwendung

```javascript
const { sendEmail } = require('./services/email');

// Beispiel: Buchungsbestätigung an Kunde
await sendEmail('booking_confirmation_customer', 'kunde@example.com', {
  customerName: 'Anna Schmidt',
  providerName: 'Energy Impuls GmbH',
  providerEmail: 'kontakt@energy-impuls.de',
  serviceName: 'BAFA-Energieberatung Wohngebäude',
  bookingDate: '20. Juni 2025',
  bookingTime: '14:00 Uhr',
  bookingDuration: '1 Stunde',
  bookingLocation: 'Berlin (vor Ort) oder online',
  bookingNumber: 'KLD-AO-2025-0247',
  totalAmount: '1.700,00 €',
  bookingUrl: 'https://klard.de/booking/KLD-AO-2025-0247',
  icsUrl: 'https://klard.de/booking/KLD-AO-2025-0247.ics',
});
```

## Templates-Übersicht

| Template | Empfänger | Auslöser |
|---|---|---|
| welcome_provider | Anbieter | Nach Onboarding-Abschluss |
| welcome_customer | Kunde | Nach erster Buchung |
| profile_activated | Anbieter | Nach Admin-Freischaltung (24h) |
| booking_confirmation_customer | Kunde | Nach erfolgreicher Zahlung |
| booking_confirmation_provider | Anbieter | Nach erfolgreicher Zahlung |
| booking_reminder_24h | Kunde | 24h vor Termin (Cron) |
| booking_reminder_1h | Kunde + Anbieter | 1h vor Termin (Cron) |
| booking_cancelled_by_customer | Beide | Kunde storniert |
| booking_cancelled_by_provider | Kunde | Anbieter sagt ab |
| invoice_ready | Kunde | Nach erbrachter Leistung |
| stripe_activated | Anbieter | Stripe-Onboarding fertig |
| payment_failed | Kunde | Zahlung fehlgeschlagen |

## Erforderliche Platzhalter pro Template

### welcome_provider
- providerName, dashboardUrl

### welcome_customer
- customerName, accountUrl

### profile_activated
- providerName, profileUrl

### booking_confirmation_customer
- customerName, providerName, providerEmail, serviceName
- bookingDate, bookingTime, bookingDuration, bookingLocation
- bookingNumber, totalAmount, bookingUrl, icsUrl

### booking_confirmation_provider
- providerName, customerName, customerEmail, customerPhone
- serviceName, bookingDate, bookingTime, bookingDuration
- bookingNumber, totalAmount, providerPayout, commissionAmount, bookingUrl

### booking_reminder_24h
- customerName, providerName, serviceName
- bookingDate, bookingTime, bookingDuration, bookingLocation
- prepNote1, prepNote2, bookingUrl, cancelUrl

### booking_reminder_1h
- recipientName, serviceName
- counterpartLabel (z.B. "Anbieter" oder "Kunde"), counterpartName, counterpartPhone, counterpartEmail
- bookingTime, bookingDuration, bookingLocation, bookingNumber, bookingUrl

### booking_cancelled_by_customer
- recipientName, serviceName, bookingDate, bookingTime
- cancellationReason, cancelledAt, bookingNumber, refundInfo

### booking_cancelled_by_provider
- customerName, providerName, serviceName, bookingDate, bookingTime
- cancellationReason, totalAmount, alternativeCount, branchName, searchUrl

### invoice_ready
- customerName, providerName, providerEmail, serviceName
- invoiceNumber, invoiceDate, performanceStart, performanceEnd
- totalAmount, invoicePdfUrl

### stripe_activated
- providerName, dashboardUrl

### payment_failed
- customerName, providerName, serviceName
- bookingDate, bookingTime, totalAmount, failureReason, retryUrl

## Tipps

- **Testen vor Live**: Senden Sie alle 12 Templates an Ihre eigene E-Mail mit Demo-Daten, bevor Sie live gehen
- **Spam-Test**: Nutzen Sie mail-tester.com — Klard-Templates erzielen >9/10 Spam-Score
- **Mobile-Test**: Litmus.com oder Email on Acid prüfen Rendering in 90+ Clients
- **Inline-CSS**: Bereits inline geschrieben — Gmail/Outlook nicht ausfilterbar
- **Dark-Mode**: Test in Apple Mail Dark Mode — die Templates funktionieren da gut
