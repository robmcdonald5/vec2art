# vec2art Frontend

SvelteKit 5 frontend for the vec2art image-to-SVG conversion tool.

## Setup

1. Install dependencies:
```sh
npm install
```

2. Configure environment variables:
```sh
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API keys:
# - PUBLIC_FORMSPARK_ENDPOINT_ID: Get from https://formspark.io/
# - PUBLIC_TURNSTILE_SITE_KEY: Get from https://dash.cloudflare.com/
```

## Environment Variables

The following public environment variables are required for the contact form:

- `PUBLIC_FORMSPARK_ENDPOINT_ID`: Your Formspark form endpoint ID
- `PUBLIC_TURNSTILE_SITE_KEY`: Your Cloudflare Turnstile site key

See `.env.example` for the complete configuration.

## Developing

Start the development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
