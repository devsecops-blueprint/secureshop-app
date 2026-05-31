package grpc

import (
"context"
"log"
"net"

"google.golang.org/grpc"
"google.golang.org/grpc/codes"
"google.golang.org/grpc/status"

pb "github.com/devsecops-blueprint/secureshop/order-service/proto"
"github.com/devsecops-blueprint/secureshop/order-service/internal/services"
)

type orderServer struct {
pb.UnimplementedOrderServiceServer
svc *services.OrderService
}

func NewServer(svc *services.OrderService) *grpc.Server {
srv := grpc.NewServer()
pb.RegisterOrderServiceServer(srv, &orderServer{svc: svc})
return srv
}

func Start(srv *grpc.Server, port string) {
lis, err := net.Listen("tcp", ":"+port)
if err != nil {
log.Fatalf("failed to listen on port %s: %v", port, err)
}
log.Printf("order-service gRPC server listening on port %s", port)
if err := srv.Serve(lis); err != nil {
log.Fatalf("gRPC server error: %v", err)
}
}

func (s *orderServer) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.OrderResponse, error) {
items := make([]services.OrderItem, len(req.Items))
for i, item := range req.Items {
items[i] = services.OrderItem{
ProductID:   item.ProductId,
ProductName: item.ProductName,
Quantity:    item.Quantity,
UnitPrice:   item.UnitPrice,
}
}

order, err := s.svc.CreateOrder(ctx, req.UserId, items)
if err != nil {
return nil, status.Errorf(codes.Internal, "failed to create order: %v", err)
}
return orderToProto(order), nil
}

func (s *orderServer) GetOrder(ctx context.Context, req *pb.GetOrderRequest) (*pb.OrderResponse, error) {
order, err := s.svc.GetOrder(ctx, req.OrderId)
if err != nil {
return nil, status.Errorf(codes.NotFound, "order not found: %v", err)
}
return orderToProto(order), nil
}

func (s *orderServer) ListOrders(ctx context.Context, req *pb.ListOrdersRequest) (*pb.ListOrdersResponse, error) {
orders, err := s.svc.ListOrders(ctx, req.UserId)
if err != nil {
return nil, status.Errorf(codes.Internal, "failed to list orders: %v", err)
}

protoOrders := make([]*pb.OrderResponse, len(orders))
for i, o := range orders {
protoOrders[i] = orderToProto(o)
}
return &pb.ListOrdersResponse{Orders: protoOrders}, nil
}

func orderToProto(o *services.Order) *pb.OrderResponse {
items := make([]*pb.OrderItem, len(o.Items))
for i, item := range o.Items {
items[i] = &pb.OrderItem{
ProductId:   item.ProductID,
ProductName: item.ProductName,
Quantity:    item.Quantity,
UnitPrice:   item.UnitPrice,
}
}
return &pb.OrderResponse{
Id:        o.ID,
UserId:    o.UserID,
Status:    o.Status,
Total:     o.Total,
Items:     items,
CreatedAt: o.CreatedAt,
}
}
