package grpc

import (
"log"

"github.com/devsecops-blueprint/secureshop/api-gateway/internal/config"
"google.golang.org/grpc"
"google.golang.org/grpc/credentials/insecure"
)

// Clients holds live gRPC connections to all downstream services.
// In production (with Istio mTLS STRICT), these use insecure.NewCredentials()
// because Istio's sidecar proxy handles mTLS transparently — the app code
// stays credential-free and the mesh enforces encryption at the network layer.
type Clients struct {
UserConn    *grpc.ClientConn
ProductConn *grpc.ClientConn
OrderConn   *grpc.ClientConn
PaymentConn *grpc.ClientConn
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
}, nil
}

func (c *Clients) Close() {
c.UserConn.Close()
c.ProductConn.Close()
c.OrderConn.Close()
c.PaymentConn.Close()
}
