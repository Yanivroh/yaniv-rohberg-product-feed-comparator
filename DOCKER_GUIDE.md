# 🐳 Docker Quick Start Guide

## The Easiest Way to Run This Application!

**With Docker, you don't need to install Node.js or any dependencies!**  
Just install Docker Desktop and you're ready to go! 🚀

---

## ✅ Prerequisites

**Only Docker Desktop is required:**
- Download from: https://www.docker.com/products/docker-desktop
- Available for: Mac, Windows, Linux
- Free for personal use

---

## 🚀 Quick Start

### For Mac Users:
**Double-click:** `START_DOCKER.command`

### For Windows Users:
**Double-click:** `START_DOCKER.bat`

### For Linux Users:
**Run in terminal:**
```bash
./START_DOCKER.sh
```

---

## 🎯 What Happens?

The script will:
1. ✅ Check if Docker is installed and running
2. ✅ Build the application container (first time only)
3. ✅ Start the container
4. ✅ Open your browser at http://localhost:3000

**That's it! No Node.js, no npm, no dependencies!** 🎉

---

## 🛠️ Manual Docker Commands

If you prefer to use the command line:

### Start the application:
```bash
docker-compose up -d
```

### Stop the application:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Rebuild after changes:
```bash
docker-compose up --build
```

---

## 🔄 Updating the Application

If you receive an updated version:

1. **Stop the current container:**
   ```bash
   docker-compose down
   ```

2. **Replace the files** with the new version

3. **Rebuild and start:**
   ```bash
   docker-compose up --build -d
   ```

---

## 🌐 Accessing the Application

Once running, open your browser at:
- **Local:** http://localhost:3000
- **Network:** http://YOUR_IP_ADDRESS:3000

---

## ❓ Troubleshooting

### "Docker is not installed"
- Install Docker Desktop from https://www.docker.com/products/docker-desktop
- Restart your computer
- Run the start script again

### "Docker is not running"
- Start Docker Desktop application
- Wait for it to fully start (whale icon should be steady)
- Run the start script again

### Port 3000 is already in use
Stop any other application using port 3000, or edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change 3001 to any available port
```

### Container won't start
View the logs:
```bash
docker-compose logs
```

---

## 💡 Why Docker?

### Advantages:
✅ **No dependencies** - Don't need Node.js or npm installed  
✅ **Consistent** - Works the same on Mac, Windows, Linux  
✅ **Isolated** - Doesn't affect your system  
✅ **Clean** - Remove everything with one command  

### vs Traditional Method:
| Feature | Docker | Traditional |
|---------|--------|-------------|
| Node.js Required | ❌ No | ✅ Yes |
| npm install | ❌ No | ✅ Yes |
| System Dependencies | ❌ No | ✅ Yes |
| Cross-platform | ✅ Perfect | ⚠️ May vary |
| Cleanup | One command | Manual |

---

## 🧹 Cleanup

To completely remove the application and free up space:

```bash
# Stop and remove containers
docker-compose down

# Remove the image
docker rmi product-feed-comparator

# (Optional) Remove all unused Docker data
docker system prune -a
```

---

## 📊 Resource Usage

The Docker container uses:
- **RAM:** ~200MB
- **Disk:** ~500MB (includes Node.js base image)
- **CPU:** Minimal when idle

---

## 🎓 Learn More

- Docker Documentation: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose

---

**Enjoy the Product Feed Comparator! 🎉**
