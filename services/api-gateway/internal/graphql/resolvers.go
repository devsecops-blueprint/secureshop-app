package graphql

import (
"context"
"fmt"

"github.com/devsecops-blueprint/secureshop/api-gateway/internal/grpc"
"github.com/devsecops-blueprint/secureshop/api-gateway/internal/middleware"
)

// RootResolver satisfies the GraphQL schema.
type RootResolver struct {
clients *grpc.Clients
}

// ── Auth helpers ──────────────────────────────────────────────

func userIDFromCtx(ctx context.Context) (string, error) {
id, ok := ctx.Value(middleware.ContextKeyUserID).(string)
if !ok || id == "" {
return "", fmt.Errorf("unauthenticated")
}
return id, nil
}

// ── Query resolvers ───────────────────────────────────────────

func (r *RootResolver) Me(ctx context.Context) (*UserResolver, error) {
userID, err := userIDFromCtx(ctx)
if err != nil {
return nil, err
}
// TODO: call user-service gRPC GetUser(userID)
return &UserResolver{id: userID, name: "Demo User", email: "demo@example.com", role: "customer"}, nil
}

func (r *RootResolver) Product(ctx context.Context, args struct{ ID string }) (*ProductResolver, error) {
// TODO: call product-service gRPC GetProduct(args.ID)
return &ProductResolver{
id: args.ID, name: "Sample Product", description: "A great product",
price: 29.99, stock: 100, category: "electronics", imageURL: "/placeholder.jpg",
}, nil
}

func (r *RootResolver) Products(ctx context.Context, args struct {
Page     *int32
PageSize *int32
Category *string
}) (*ProductListResolver, error) {
// TODO: call product-service gRPC ListProducts
return &ProductListResolver{products: []*ProductResolver{}, total: 0}, nil
}

func (r *RootResolver) SearchProducts(ctx context.Context, args struct{ Query string }) (*ProductListResolver, error) {
// TODO: call product-service gRPC SearchProducts
return &ProductListResolver{products: []*ProductResolver{}, total: 0}, nil
}

func (r *RootResolver) Order(ctx context.Context, args struct{ ID string }) (*OrderResolver, error) {
if _, err := userIDFromCtx(ctx); err != nil {
return nil, err
}
// TODO: call order-service gRPC GetOrder(args.ID)
return nil, nil
}

func (r *RootResolver) MyOrders(ctx context.Context) ([]*OrderResolver, error) {
if _, err := userIDFromCtx(ctx); err != nil {
return nil, err
}
// TODO: call order-service gRPC ListOrders
return []*OrderResolver{}, nil
}

// ── Mutation resolvers ────────────────────────────────────────

type LoginArgs struct {
Email    string
Password string
}

func (r *RootResolver) Login(ctx context.Context, args LoginArgs) (*AuthPayloadResolver, error) {
// TODO: call user-service gRPC Authenticate(email, password) → get token
return &AuthPayloadResolver{
token: "dev-token",
user:  &UserResolver{id: "1", name: "Demo", email: args.Email, role: "customer"},
}, nil
}

type RegisterArgs struct {
Input struct {
Name     string
Email    string
Password string
}
}

func (r *RootResolver) Register(ctx context.Context, args RegisterArgs) (*AuthPayloadResolver, error) {
// TODO: call user-service gRPC Register
return &AuthPayloadResolver{
token: "dev-token",
user:  &UserResolver{id: "2", name: args.Input.Name, email: args.Input.Email, role: "customer"},
}, nil
}

type CreateOrderArgs struct {
Input struct {
Items []struct {
ProductID string
Quantity  int32
}
}
}

func (r *RootResolver) CreateOrder(ctx context.Context, args CreateOrderArgs) (*OrderResolver, error) {
userID, err := userIDFromCtx(ctx)
if err != nil {
return nil, err
}
_ = userID
// TODO: call order-service gRPC CreateOrder
return &OrderResolver{id: "new-order", status: "pending", total: 0, items: []*OrderItemResolver{}}, nil
}

// ── Type resolvers ────────────────────────────────────────────

type UserResolver struct {
id, name, email, role string
}

func (u *UserResolver) ID() string    { return u.id }
func (u *UserResolver) Name() string  { return u.name }
func (u *UserResolver) Email() string { return u.email }
func (u *UserResolver) Role() string  { return u.role }

type ProductResolver struct {
id, name, description, category, imageURL string
price                                     float64
stock                                     int32
}

func (p *ProductResolver) ID() string          { return p.id }
func (p *ProductResolver) Name() string        { return p.name }
func (p *ProductResolver) Description() string { return p.description }
func (p *ProductResolver) Price() float64      { return p.price }
func (p *ProductResolver) Stock() int32        { return p.stock }
func (p *ProductResolver) Category() string    { return p.category }
func (p *ProductResolver) ImageUrl() string    { return p.imageURL }

type ProductListResolver struct {
products []*ProductResolver
total    int32
}

func (pl *ProductListResolver) Products() []*ProductResolver { return pl.products }
func (pl *ProductListResolver) Total() int32                 { return pl.total }

type OrderItemResolver struct {
productID, productName string
quantity               int32
unitPrice              float64
}

func (oi *OrderItemResolver) ProductId() string    { return oi.productID }
func (oi *OrderItemResolver) ProductName() string  { return oi.productName }
func (oi *OrderItemResolver) Quantity() int32      { return oi.quantity }
func (oi *OrderItemResolver) UnitPrice() float64   { return oi.unitPrice }

type OrderResolver struct {
id, status, createdAt string
total                 float64
items                 []*OrderItemResolver
}

func (o *OrderResolver) ID() string                  { return o.id }
func (o *OrderResolver) Status() string              { return o.status }
func (o *OrderResolver) Total() float64              { return o.total }
func (o *OrderResolver) Items() []*OrderItemResolver { return o.items }
func (o *OrderResolver) CreatedAt() string           { return o.createdAt }

type AuthPayloadResolver struct {
token string
user  *UserResolver
}

func (a *AuthPayloadResolver) Token() string      { return a.token }
func (a *AuthPayloadResolver) User() *UserResolver { return a.user }
