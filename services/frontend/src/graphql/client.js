import { GraphQLClient } from 'graphql-request'

// In Docker, requests go directly to api-gateway.
// In local dev, Vite proxies /graphql to avoid CORS.
const endpoint = '/graphql'

// Create a single shared client instance.
// The token is read fresh on every request so login state is reflected immediately.
export function getClient() {
  const token = localStorage.getItem('token')
  return new GraphQLClient(endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
