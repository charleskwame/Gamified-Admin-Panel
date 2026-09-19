# React + Vite

## Password reset email setup

Password reset emails are requested by the Cloudflare Pages Function in
`functions/api/send-password-reset.js`. It uses Firebase Authentication's
REST API, so it works without Firebase Cloud Functions or the Blaze plan. Add
these variables in Cloudflare Pages Settings > Variables and Secrets:

- `FIREBASE_WEB_API_KEY`: the Firebase web API key
- `PASSWORD_RESET_CONTINUE_URL`: `https://gamified-admin-panel.pages.dev`

Add `gamified-admin-panel.pages.dev` to Firebase Authentication's authorized
domains. Cloudflare deploys the Pages Function automatically from the
`functions/` directory. This path uses Firebase's built-in reset email; the
EmailJS template cannot receive the generated reset link without a separate
Node backend.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
