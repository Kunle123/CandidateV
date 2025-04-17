FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["node", "src/index.js"] 