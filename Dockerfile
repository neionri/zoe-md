FROM node:20-slim

# Install system dependencies (FFmpeg for media, Python for yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install app dependencies
# Menggunakan package-lock.json jika ada untuk versi yang konsisten
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Pastikan folder esensial ada
RUN mkdir -p scratch/voice scratch/temp_visuals zoe media

# Mode Produksi
ENV NODE_ENV=production

# Jalankan Zoe
CMD [ "npm", "start" ]
