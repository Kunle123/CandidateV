FROM node:18

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV NODE_OPTIONS=--tls-min-v1.2

# Expose port
EXPOSE 8000

# Run the gateway
CMD ["node", "simplified-gateway.js"] 