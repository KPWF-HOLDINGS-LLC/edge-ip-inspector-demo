# Edge IP Inspector Demo

A browser interface and edge Worker for inspecting synthetic IP context. The interface uses safe text rendering, and the API validates IPv4 and IPv6 addresses before returning a fixture.

## Run

Use Node.js 18 or newer and run `node --test`. For a local browser preview, install Wrangler in your development environment and run `wrangler dev`; open the local address shown by Wrangler. The app has no token, external request, or production route.

Try `192.0.2.10`, `198.51.100.20`, or `2001:db8::10`. These are documentation addresses. Any other valid address returns no context.

## Design notes

The response includes only fixture data. The interface inserts data with `textContent`, and the page uses a restrictive content security policy. The default public Worker subdomain is disabled. Before connecting a real provider, add authentication, abuse controls, bounded upstream calls, and a separate review of data terms and privacy.
