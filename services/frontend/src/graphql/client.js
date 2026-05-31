import { GraphQLClient } from 'graphql-request'

// In development Vite proxies /graphql to localhost:8080.
// In production (Docker/K8s) VITE_GRAPHQL_URL is set via environment.
const endpoint = import.meta.env.VITE_GRAPHQL_URL || '/graphql'

export const gqlClient = new GraphQLClient(endpoint, {
  headers: () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
})
