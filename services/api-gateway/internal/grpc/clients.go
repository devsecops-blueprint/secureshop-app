package grpc

import (
"log"

"github.com/devsecops-blueprint/secureshop/api-gateway/internal/config"
pb "github.com/devsecops-blueprint/secureshop/api-gateway/proto"
"google.golang.org/grpc"
"google.golang.org/grpc/credentials/insecure"
)

type Clients struct {
UserConn    *grpc.ClientConn
ProductConn *grpc.ClientConn
OrderConn   *grpc.ClientConn
PaymentConn *grpc.ClientConn
Users       pb.UserServiceClient
Products    pb.ProductServiceClient
Orders      pb.OrderServiceClient
}

func NewClients(cfg *config.Config) (*Clients, error) {
dial := func(addr string) (*grpc.ClientConn, error) {
return grpc.NewClient(addr,
grpc.WithTransportCredentials(insecure.NewCredentials()),
)
}

userConn, err := dial(cfg.UserServiceAddr)
if err != nil {
return nil, err
}
productConn, err := dial(cfg.ProductServiceAddr)
if err != nil {
return nil, err
}
orderConn, err := dial(cfg.OrderServiceAddr)
if err != nil {
return nil, err
}
paymentConn, err := dial(cfg.PaymentServiceAddr)
if err != nil {
return nil, err
}

log.Println("gRPC clients initialized")
return &Clients{
UserConn:    userConn,
ProductConn: productConn,
OrderConn:   orderConn,
PaymentConn: paymentConn,
Users:       pb.NewUserServiceClient(userConn),
Products:    pb.NewProductServiceClient(productConn),
Orders:      pb.NewOrderServiceClient(orderConn),
}, nil
}

func (c *Clients) Close() {
c.UserConn.Close()
c.ProductConn.Close()
c.OrderConn.Close()
c.PaymentConn.Close()
}
