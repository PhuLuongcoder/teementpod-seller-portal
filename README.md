This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



# Teemochi Seller Portal

> A comprehensive B2B Dashboard built for Print-on-Demand (POD) sellers to manage their stores, catalog, designs, and order fulfillment efficiently.

[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## Overview

**Teemochi Seller Portal** is the frontend B2B interface of the larger TeementPOD ecosystem. It is designed to empower individual POD sellers with a robust set of tools to run their dropshipping business seamlessly. 

Instead of juggling multiple spreadsheets and emails, sellers can use this portal to track real-time base costs, upload custom designs, route orders directly to our fulfillment center, and monitor shipping statuses—all in one place.

## Key Features

*   **Secure Authentication:** JWT-based login and registration system protecting seller data.
*   **Interactive Dashboard:** Real-time metrics tracking total spend, order volumes, and fulfillment rates.
*   **Catalog & Base Cost Management:** Real-time sync with the central MedusaJS backend to display available product blanks and transparent base costs.
*   **Design Library:** Upload, manage, and attach custom artworks to different product variants.
*   **Order Routing:** Automated order creation and tracking (Pending -> Processing -> Shipped) with tracking code integration.
*   **Multi-Store Management:** Capability to link and manage multiple storefronts (e.g., WooCommerce, Shopify) from a single account.

## Tech Stack

This project strictly follows modern frontend development practices:

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript (Strict mode)
*   **Styling:** Tailwind CSS & PostCSS
*   **State Management:** React Context API (`AuthContext`, `ShopContext`, `ConfirmContext`)
*   **Data Fetching:** Axios (with interceptors for token management)

## Project Architecture

The codebase is organized using the Next.js App Router paradigm for optimal routing and server/client component separation:

```text
src/
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── dashboard/        # Protected seller routes (catalog, designs, orders, stores)
│   ├── login/            # Public authentication routes
│   └── globals.css       # Global Tailwind styling
├── components/           # Reusable UI components (Topbar, Modals, etc.)
├── context/              # Global state management
└── lib/                  # Utility functions and Axios configurations
