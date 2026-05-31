package graphql

import (
"encoding/json"
"net/http"

"github.com/devsecops-blueprint/secureshop/api-gateway/internal/config"
"github.com/devsecops-blueprint/secureshop/api-gateway/internal/grpc"
"github.com/graph-gophers/graphql-go"
"github.com/graph-gophers/graphql-go/relay"
)

// Handler wraps the GraphQL executor and owns the gRPC client connections.
type Handler struct {
schema    *graphql.Schema
clients   *grpc.Clients
relayHandler *relay.Handler
}

func NewHandler(cfg *config.Config) (*Handler, error) {
clients, err := grpc.NewClients(cfg)
if err != nil {
return nil, err
}

resolver := &RootResolver{clients: clients}

schemaString, err := loadSchema()
if err != nil {
return nil, err
}

schema := graphql.MustParseSchema(schemaString, resolver)

h := &Handler{
schema:  schema,
clients: clients,
relayHandler: &relay.Handler{Schema: schema},
}
return h, nil
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
h.relayHandler.ServeHTTP(w, r)
}

func (h *Handler) Close() {
h.clients.Close()
}

// loadSchema reads the .graphql file embedded at build time.
// For simplicity in dev, we inline a minimal schema here.
func loadSchema() (string, error) {
// In production this would use //go:embed schema.graphql
return schemaStr, nil
}

// writeJSON is a helper used by resolver tests.
func writeJSON(w http.ResponseWriter, code int, v interface{}) {
w.WriteHeader(code)
json.NewEncoder(w).Encode(v)
}

const schemaStr = `
type Query {
me: User
product(id: ID!): Product
products(page: Int, pageSize: Int, category: String): ProductList
searchProducts(query: String!): ProductList
order(id: ID!): Order
myOrders: [Order!]!
}
type Mutation {
login(email: String!, password: String!): AuthPayload!
register(input: RegisterInput!): AuthPayload!
createOrder(input: CreateOrderInput!): Order!
}
type AuthPayload { token: String! user: User! }
input RegisterInput { name: String! email: String! password: String! }
type User { id: ID! name: String! email: String! role: String! }
type Product { id: ID! name: String! description: String! price: Float! stock: Int! category: String! imageUrl: String! }
type ProductList { products: [Product!]! total: Int! }
type Order { id: ID! status: String! total: Float! items: [OrderItem!]! createdAt: String! }
type OrderItem { productId: ID! productName: String! quantity: Int! unitPrice: Float! }
input CreateOrderInput { items: [OrderItemInput!]! }
input OrderItemInput { productId: ID! quantity: Int! }
`
