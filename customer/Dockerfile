# Build Vite (React) → Nginx phục vụ static (SPA)
# Build-arg VITE_API_BASE_URL: URL BE (bắt buộc set khi build nếu FE gọi API tuyệt đối)
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t fe-store .

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
