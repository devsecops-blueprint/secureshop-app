// All GraphQL queries and mutations used by the frontend.
// Centralising them here makes it easy to see the full API surface.

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id name email role }
    }
  }
`

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { id name email role }
    }
  }
`

export const GET_PRODUCTS_QUERY = `
  query GetProducts($page: Int, $pageSize: Int, $category: String) {
    products(page: $page, pageSize: $pageSize, category: $category) {
      products {
        id name description price stock category imageUrl
      }
      total
    }
  }
`

export const SEARCH_PRODUCTS_QUERY = `
  query SearchProducts($query: String!) {
    searchProducts(query: $query) {
      products {
        id name description price stock category imageUrl
      }
      total
    }
  }
`

export const GET_PRODUCT_QUERY = `
  query GetProduct($id: ID!) {
    product(id: $id) {
      id name description price stock category imageUrl
    }
  }
`

export const GET_MY_ORDERS_QUERY = `
  query GetMyOrders {
    myOrders {
      id status total createdAt
      items { productId productName quantity unitPrice }
    }
  }
`

export const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id status total createdAt
    }
  }
`
