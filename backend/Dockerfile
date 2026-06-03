FROM node:22-alpine

WORKDIR /app

# Copy backend source
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/

# Copy static folders so backend can serve them in production
# backend/index.js resolves: path.join(__dirname, '..', 'admin')  → /app/admin
#                             path.join(__dirname, '..', 'frontend') → /app/frontend
COPY admin/ ./admin/
COPY frontend/ ./frontend/

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "index.js"]
