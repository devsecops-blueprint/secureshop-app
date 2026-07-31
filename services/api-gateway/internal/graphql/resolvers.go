package graphql

import (
"context"
"fmt"
"log"

graphqlgo "github.com/graph-gophers/graphql-go"
"github.com/devsecops-blueprint/secureshop/api-gateway/internal/grpc"
"github.com/devsecops-blueprint/secureshop/api-gateway/internal/middleware"
pb "github.com/devsecops-blueprint/secureshop/api-gateway/proto"
)

type RootResolver struct {
clients *grpc.Clients
}

func userIDFromCtx(ctx context.Context) (string, error) {
id, ok := ctx.Value(middleware.ContextKeyUserID).(string)
if !ok || id == "" {
return "", fmt.Errorf("unauthenticated")
}
return id, nil
}

func (r *RootResolver) Me(ctx context.Context) (*UserResolver, error) {
userID, err := userIDFromCtx(ctx)
if err != nil {
return nil, err
}
resp, err := r.clients.Users.GetUser(ctx, &pb.GetUserRequest{UserId: userID})
if err != nil {
log.Printf("ERROR GetUser: %v", err)
return nil, err
}
return protoToUser(resp), nil
}

type LoginArgs struct {
Email    string
Password string
}

func (r *RootResolver) Login(ctx context.Context, args LoginArgs) (*AuthPayloadResolver, error) {
resp, err := r.clients.Users.Login(ctx, &pb.LoginRequest{
Email:    args.Email,
Password: args.Password,
})
if err != nil {
log.Printf("ERROR Login: %v", err)
return nil, fmt.Errorf("invalid credentials")
}
return &AuthPayloadResolver{
token: resp.Token,
user:  protoToUser(resp.User),
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
resp, err := r.clients.Users.Register(ctx, &pb.RegisterRequest{
Name:     args.Input.Name,
Email:    args.Input.Email,
Password: args.Input.Password,
})
if err != nil {
log.Printf("ERROR Register: %v", err)
return nil, fmt.Errorf("registration failed")
}
return &AuthPayloadResolver{
token: resp.Token,
user:  protoToUser(resp.User),
}, nil
}

func (r *RootResolver) Product(ctx context.Context, args struct{ ID graphqlgo.ID }) (*ProductResolver, error) {
resp, err := r.clients.Products.GetProduct(ctx, &pb.GetProductRequest{
ProductId: string(args.ID),
})
if err != nil {
log.Printf("ERROR GetProduct: %v", err)
return nil, err
}
return protoToProduct(resp), nil
}

func (r *RootResolver) Products(ctx context.Context, args struct {
Page     *int32
PageSize *int32
Category *string
}) (*ProductListResolver, error) {
req := &pb.ListProductsRequest{}
if args.Page != nil {
req.Page = *args.Page
}
if args.PageSize != nil {
req.PageSize = *args.PageSize
}
if args.Category != nil {
req.Category = *args.Category
}
resp, err := r.clients.Products.ListProducts(ctx, req)
if err != nil {
log.Printf("ERROR ListProducts: %v", err)
return &ProductListResolver{products: []*ProductResolver{}, total: 0}, nil
}
products := make([]*ProductResolver, len(resp.Products))
for i, p := range resp.Products {
products[i] = protoToProduct(p)
}
return &ProductListResolver{products: products, total: resp.Total}, nil
}

func (r *RootResolver) SearchProducts(ctx context.Context, args struct{ Query string }) (*ProductListResolver, error) {
resp, err := r.clients.Products.SearchProducts(ctx, &pb.SearchProductsRequest{
Query: args.Query,
})
if err != nil {
log.Printf("ERROR SearchProducts: %v", err)
return &ProductListResolver{products: []*ProductResolver{}, total: 0}, nil
}
products := make([]*ProductResolver, len(resp.Products))
for i, p := range resp.Products {
products[i] = protoToProduct(p)
}
return &ProductListResolver{products: products, total: resp.Total}, nil
}

func (r *RootResolver) Order(ctx context.Context, args struct{ ID graphqlgo.ID }) (*OrderResolver, error) {
if _, err := userIDFromCtx(ctx); err != nil {
return nil, err
}
resp, err := r.clients.Orders.GetOrder(ctx, &pb.GetOrderRequest{
OrderId: string(args.ID),
})
if err != nil {
log.Printf("ERROR GetOrder: %v", err)
return nil, err
}
return protoToOrder(resp), nil
}

func (r *RootResolver) MyOrders(ctx context.Context) ([]*OrderResolver, error) {
userID, err := userIDFromCtx(ctx)
if err != nil {
return nil, err
}
resp, err := r.clients.Orders.ListOrders(ctx, &pb.ListOrdersRequest{
UserId: userID,
})
if err != nil {
log.Printf("ERROR ListOrders: %v", err)
return []*OrderResolver{}, nil
}
orders := make([]*OrderResolver, len(resp.Orders))
for i, o := range resp.Orders {
orders[i] = protoToOrder(o)
}
return orders, nil
}

type CreateOrderArgs struct {
Input struct {
Items []struct {
ProductID graphqlgo.ID
Quantity  int32
}
}
}

func (r *RootResolver) CreateOrder(ctx context.Context, args CreateOrderArgs) (*OrderResolver, error) {
userID, err := userIDFromCtx(ctx)
if err != nil {
return nil, err
}
items := make([]*pb.OrderItem, len(args.Input.Items))
for i, item := range args.Input.Items {
items[i] = &pb.OrderItem{
ProductId: string(item.ProductID),
Quantity:  item.Quantity,
}
}
resp, err := r.clients.Orders.CreateOrder(ctx, &pb.CreateOrderRequest{
UserId: userID,
Items:  items,
})
if err != nil {
log.Printf("ERROR CreateOrder: %v", err)
return nil, err
}
return protoToOrder(resp), nil
}

func protoToUser(u *pb.UserResponse) *UserResolver {
if u == nil {
return nil
}
return &UserResolver{id: u.Id, name: u.Name, email: u.Email, role: u.Role}
}

func protoToProduct(p *pb.ProductResponse) *ProductResolver {
return &ProductResolver{
id: p.Id, name: p.Name, description: p.Description,
price: p.Price, stock: p.Stock, category: p.Category, imageURL: p.ImageUrl,
}
}

func protoToOrder(o *pb.OrderResponse) *OrderResolver {
items := make([]*OrderItemResolver, len(o.Items))
for i, item := range o.Items {
items[i] = &OrderItemResolver{
productID:   item.ProductId,
productName: item.ProductName,
quantity:    item.Quantity,
unitPrice:   item.UnitPrice,
}
}
return &OrderResolver{
id: o.Id, status: o.Status, total: o.Total,
items: items, createdAt: o.CreatedAt,
}
}

type UserResolver struct{ id, name, email, role string }

func (u *UserResolver) ID() graphqlgo.ID { return graphqlgo.ID(u.id) }
func (u *UserResolver) Name() string     { return u.name }
func (u *UserResolver) Email() string    { return u.email }
func (u *UserResolver) Role() string     { return u.role }

type ProductResolver struct {
id, name, description, category, imageURL string
price                                     float64
stock                                     int32
}

func (p *ProductResolver) ID() graphqlgo.ID    { return graphqlgo.ID(p.id) }
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

func (oi *OrderItemResolver) ProductId() graphqlgo.ID { return graphqlgo.ID(oi.productID) }
func (oi *OrderItemResolver) ProductName() string     { return oi.productName }
func (oi *OrderItemResolver) Quantity() int32         { return oi.quantity }
func (oi *OrderItemResolver) UnitPrice() float64      { return oi.unitPrice }

type OrderResolver struct {
id, status, createdAt string
total                 float64
items                 []*OrderItemResolver
}

func (o *OrderResolver) ID() graphqlgo.ID            { return graphqlgo.ID(o.id) }
func (o *OrderResolver) Status() string              { return o.status }
func (o *OrderResolver) Total() float64              { return o.total }
func (o *OrderResolver) Items() []*OrderItemResolver { return o.items }
func (o *OrderResolver) CreatedAt() string           { return o.createdAt }

type AuthPayloadResolver struct {
token string
user  *UserResolver
}

func (a *AuthPayloadResolver) Token() string       { return a.token }
func (a *AuthPayloadResolver) User() *UserResolver { return a.user }
