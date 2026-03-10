# Digital Ocean App Platform Configuration

## SPA Route Configuration

This app is configured specifically for Digital Ocean App Platform:

- **routes**: Define specific routes that exist (/produto/[id], /aprovado)
- **catchall_document**: Serves index.html for all other routes  
- **React Router**: Handles client-side routing for SPA functionality

## Build Process

1. `npm install && npm run build` - Standard Vite build
2. Outputs to `dist/` directory
3. Digital Ocean serves index.html for all routes via catchall_document
4. React Router takes over for client-side navigation

## Routes

- `/` - Home page
- `/produto/[id]` - Product detail pages  
- `/aprovado` - Payment confirmation page

All routes serve the same index.html file and React Router handles the routing on the client side.