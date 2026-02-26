# Backend Architecture Rules

1.  **External Backend Hosting**: The backend for this project is hosted externally (e.g., on Render).
2.  **API Routes**: Do NOT implement API logic (like database connections, webhook handlers, etc.) within the Next.js frontend `app/api` routes. The frontend is strictly for UI and client-side logic.
3.  **API Communication**: All API calls should be directed to the external backend URL, typically configured via `NEXT_PUBLIC_API_BASE`.
4.  **Webhooks**: Stripe and other webhooks are handled directly by the external backend services, not by the Next.js frontend.
5.  **Payment API Calls**: Payment initiation (Stripe/PayPal) should be implemented directly in the frontend components (e.g., `Checkout.tsx`) by calling the appropriate backend endpoints (e.g., `/api/integrations/stripe/create-intent` or `/api/integrations/paypal/create-order`).
do not run npm lint at all
do not npm run type-check

# Package Management Rules
1. **Use pnpm**: Always use `pnpm` instead of `npm` or `yarn` for installing dependencies and running scripts.
