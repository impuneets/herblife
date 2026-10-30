<<<<<<< HEAD
# Herblife — Node.js website

A responsive farmland rental homepage and enquiry form built with Node.js, Express, HTML, CSS, and browser JavaScript.

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract this folder.
2. Open a terminal in the project folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the website:
   ```bash
   npm start
   ```
5. Visit http://localhost:3000

For development with automatic server restarts, use `npm run dev`.

## Where requests are saved
Successful form submissions are appended to `data/requests.json` on the server. The file is excluded from version control by `.gitignore`. Keep this file private because it contains customer contact details. Back it up securely and do not put it in the public folder.

## Before you launch publicly
- Confirm the farm location and add your real phone number, email, and contact details.
- Update the form choices to match the land, facilities, crops, and farm products you offer.
- Add your real phone number, email, address, and privacy policy.
- Configure HTTPS, backups, rate limiting, and a database for production use. JSON file storage is suitable only for a small prototype; it is not ideal for concurrent requests or multiple server instances.
- The page uses a remotely hosted Unsplash hero image and Google Fonts, so those assets need an internet connection.

## API
- `POST /api/requests` — validates and saves a crop-growing enquiry.
- `GET /api/health` — basic health check.

Required fields: name, phone, location, farm interest, and requested land area. Email is optional.


## Herblife customization

This version is branded for **Herblife**, based in India. The enquiry form is designed for farmland rental interest and includes crop/farm interests such as vegetables, grains, pulses, fruits, honey/beekeeping, milk and dairy products, vermi compost, other farm by-products, and mixed farming. It asks for preferred land area, rental start timeframe, rental duration, location, and additional requirements.

The website does not advertise confirmed land availability or set rental prices. Contact each enquiry to discuss location, facilities, rates, and written rental terms before making any commitment.
=======
# herblife
>>>>>>> 29879af59af4739440bc1f0e7d699d887f9108ae
