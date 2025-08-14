# BenchRacers

BenchRacers is a full-stack web platform for car enthusiasts to showcase their builds, rate others, and get inspired. Built with Next.js, React, TypeScript, and Tailwind CSS on the frontend, and Node.js/Express with TypeScript on the backend, BenchRacers offers a modern, intuitive, and professional experience for the automotive community.

---

## Features

### Frontend
- **Home:** Hero section with large photo, floating title/description, quick links, top cars of the week, and a professional footer.
- **About:** "Our Story" timeline and "Meet the Team" sections.
- **Auth:** Modular login/sign-up modal with tab switching.
- **Car:** Card component displaying car information and modifications.
- **Explore:** Tinder-style swipe interface to like/dislike car builds, with comments and stats.
- **Following:** Modular tabs for Build Feed, Following, and Discover (suggested users).
- **My Garage:** Profile card and a section for your cars.
- **Rankings:** Leaderboard with top 3 placements and modular tabs for Exotic, Sport, and Off Road categories.
- **Magazine:** Dedicated section for BenchRacers Magazine with features and subscription CTA.
- **Responsive Design:** Fully responsive and mobile-friendly.
- **Modern UI:** Built with Tailwind CSS and Lucide icons.

### Backend
- **REST API:** Node.js/Express with TypeScript.
- **Authentication:** JWT-based user authentication.
- **Database:** SQL schema for cars, users, mods, comments, tags, and photos.
- **Admin & Explore Routes:** For moderation and car discovery.
- **Garage Management:** Add, update, and delete car builds and modifications.

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Lucide Icons, Axios
- **Backend:** Node.js, Express, TypeScript, SQL (MySQL/Postgres), JWT
- **Other:** Vite, ESLint, PostCSS

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- SQL database (MySQL or Postgres)

### Installation

#### Frontend

```sh
cd frontend
npm install
# or
yarn install
```

#### Backend

```sh
cd backend
npm install
# or
yarn install
```

### Running Locally

#### Frontend

```sh
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000)

#### Backend

```sh
npm run dev
# or
yarn dev
```
API runs on [http://localhost:5000](http://localhost:5000) by default.

---

## Project Structure

```
BenchRacers/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── styles/
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   └── ...
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── routes/
│   │   │   └── ...
│   ├── server.ts
│   ├── package.json
│   └── ...
```

---

## Environment Variables

- **Frontend:**  
  Create a `.env` file in `/frontend` for API endpoints, etc.

- **Backend:**  
  Create a `.env` file in `/backend` for DB connection, JWT secrets, etc.

---

## Deployment

- Deploy frontend to Vercel, Netlify, or any Next.js-compatible host.
- Deploy backend to any Node.js server (Heroku, AWS, DigitalOcean, etc).

---


**BenchRacers** — Rate. Build. Inspire.