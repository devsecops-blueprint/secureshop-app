package middleware

import (
"context"
"fmt"
"log"
"net/http"
"strings"
"time"

"github.com/golang-jwt/jwt/v5"
"github.com/google/uuid"
)

type contextKey string

const (
ContextKeyRequestID contextKey = "request_id"
ContextKeyUserID    contextKey = "user_id"
ContextKeyUserRole  contextKey = "user_role"
)

// Chain applies middleware in the order given (first = outermost).
func Chain(h http.Handler, middlewares ...func(http.Handler) http.Handler) http.Handler {
for i := len(middlewares) - 1; i >= 0; i-- {
h = middlewares[i](h)
}
return h
}

// RequestID attaches a unique request ID to every request.
func RequestID(next http.Handler) http.Handler {
return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
id := r.Header.Get("X-Request-ID")
if id == "" {
id = uuid.New().String()
}
ctx := context.WithValue(r.Context(), ContextKeyRequestID, id)
w.Header().Set("X-Request-ID", id)
next.ServeHTTP(w, r.WithContext(ctx))
})
}

// Logger logs method, path, duration, and status for every request.
func Logger(next http.Handler) http.Handler {
return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
start := time.Now()
rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
next.ServeHTTP(rw, r)
reqID, _ := r.Context().Value(ContextKeyRequestID).(string)
log.Printf("[%s] %s %s %d %s", reqID, r.Method, r.URL.Path, rw.status, time.Since(start))
})
}

type responseWriter struct {
http.ResponseWriter
status int
}

func (rw *responseWriter) WriteHeader(code int) {
rw.status = code
rw.ResponseWriter.WriteHeader(code)
}

// CORS sets permissive CORS headers for allowed origins.
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
allowed := make(map[string]struct{}, len(allowedOrigins))
for _, o := range allowedOrigins {
allowed[o] = struct{}{}
}
return func(next http.Handler) http.Handler {
return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
origin := r.Header.Get("Origin")
if _, ok := allowed[origin]; ok {
w.Header().Set("Access-Control-Allow-Origin", origin)
w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
w.Header().Set("Access-Control-Allow-Credentials", "true")
}
if r.Method == http.MethodOptions {
w.WriteHeader(http.StatusNoContent)
return
}
next.ServeHTTP(w, r)
})
}
}

// Auth validates JWTs on protected routes.
// GraphQL introspection and login/register mutations are public.
func Auth(secret string) func(http.Handler) http.Handler {
return func(next http.Handler) http.Handler {
return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
authHeader := r.Header.Get("Authorization")
if authHeader == "" {
// Allow unauthenticated — resolvers enforce per-field auth
next.ServeHTTP(w, r)
return
}
parts := strings.SplitN(authHeader, " ", 2)
if len(parts) != 2 || parts[0] != "Bearer" {
http.Error(w, `{"error":"invalid authorization header"}`, http.StatusUnauthorized)
return
}
token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
}
return []byte(secret), nil
})
if err != nil || !token.Valid {
http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
return
}
claims, ok := token.Claims.(jwt.MapClaims)
if !ok {
http.Error(w, `{"error":"invalid claims"}`, http.StatusUnauthorized)
return
}
ctx := context.WithValue(r.Context(), ContextKeyUserID, claims["sub"])
ctx = context.WithValue(ctx, ContextKeyUserRole, claims["role"])
next.ServeHTTP(w, r.WithContext(ctx))
})
}
}
