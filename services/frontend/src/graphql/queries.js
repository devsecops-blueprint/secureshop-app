// ── Auth ──────────────────────────────────────────────────────
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

export const ME_QUERY = `
  query Me {
    me { id name email role }
  }
`

// ── Products ──────────────────────────────────────────────────
export const PRODUCTS_QUERY = `
  query Products($page: Int, $pageSize: Int, $category: String) {
    products(page: $page, pageSize: $pageSize, category: $category) {
      products {
        id name description price stock category imageUrl
      }
      total
    }
  }
`

export const PRODUCT_QUERY = `
  query Product($id: ID!) {
    product(id: $id) {
      id name description price stock category imageUrl
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

// ── Orders ────────────────────────────────────────────────────
export const MY_ORDERS_QUERY = `
  query MyOrders {
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
