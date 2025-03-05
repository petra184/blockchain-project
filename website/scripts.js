// Canvas setup and drawing functionality
document.addEventListener("DOMContentLoaded", () => {
    // Get the current page
    const currentPage = window.location.pathname.split("/").pop()
  
    // Initialize canvas if on drawing page
    if (currentPage === "index.html" || currentPage === "") {
      initializeCanvas()
    }
  
    // Initialize gallery if on gallery page
    if (currentPage === "gallery.html") {
      loadGallery()
      setupGalleryControls()
    }
  
    // Setup notification system
    setupNotifications()
  })
  
  // Canvas variables
  let canvas, ctx
  let isDrawing = false
  let lastX = 0
  let lastY = 0
  let brushSize = 5
  let currentColor = "#4361ee"
  let isEraser = false
  
  function initializeCanvas() {
    // Get canvas and context
    canvas = document.getElementById("drawCanvas")
    ctx = canvas.getContext("2d")
  
    // Set canvas size
    resizeCanvas()
  
    // Event listeners for drawing
    canvas.addEventListener("mousedown", startDrawing)
    canvas.addEventListener("mousemove", draw)
    canvas.addEventListener("mouseup", stopDrawing)
    canvas.addEventListener("mouseout", stopDrawing)
  
    // Touch support
    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchmove", handleTouchMove)
    canvas.addEventListener("touchend", stopDrawing)
  
    // Tool controls
    document.getElementById("brushSize").addEventListener("input", updateBrushSize)
    document.getElementById("colorPicker").addEventListener("input", updateColor)
    document.getElementById("eraser").addEventListener("click", toggleEraser)
    document.getElementById("clear").addEventListener("click", clearCanvas)
    document.getElementById("saveDrawing").addEventListener("click", saveDrawing)
  
    // Handle window resize
    window.addEventListener("resize", resizeCanvas)
  
    // Initial brush size
    updateBrushSize()
  }
  
  function resizeCanvas() {
    const container = document.querySelector(".canvas-container")
    const containerWidth = container.clientWidth
  
    // Set canvas dimensions
    canvas.width = Math.min(containerWidth - 30, 800)
    canvas.height = 500
  
    // Set white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  
  function startDrawing(e) {
    isDrawing = true
    const coords = getCoordinates(e)
    lastX = coords.x
    lastY = coords.y
  
    // Draw a single dot if just clicked
    ctx.beginPath()
    ctx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = isEraser ? "#ffffff" : currentColor
    ctx.fill()
  }
  
  function draw(e) {
    if (!isDrawing) return
  
    const coords = getCoordinates(e)
    const x = coords.x
    const y = coords.y
  
    // Start drawing
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.strokeStyle = isEraser ? "#ffffff" : currentColor
    ctx.lineWidth = brushSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
  
    // Update last position
    lastX = x
    lastY = y
  }
  
  function stopDrawing() {
    isDrawing = false
  }
  
  function getCoordinates(e) {
    let x, y
  
    if (e.type.includes("touch")) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.offsetX
      y = e.offsetY
    }
  
    return { x, y }
  }
  
  function handleTouchStart(e) {
    e.preventDefault()
    startDrawing(e)
  }
  
  function handleTouchMove(e) {
    e.preventDefault()
    draw(e)
  }
  
  function updateBrushSize() {
    brushSize = document.getElementById("brushSize").value
  }
  
  function updateColor() {
    currentColor = document.getElementById("colorPicker").value
    isEraser = false
    document.getElementById("eraser").classList.remove("active")
  }
  
  function toggleEraser() {
    isEraser = !isEraser
    document.getElementById("eraser").classList.toggle("active")
  }
  
  function clearCanvas() {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  
  function saveDrawing() {
    const drawingName = document.getElementById("drawingName").value || "Untitled Artwork"
  
    // Get canvas data
    const imageData = canvas.toDataURL("image/png")
  
    // Create artwork object
    const artwork = {
      id: Date.now().toString(),
      name: drawingName,
      date: new Date().toISOString(),
      image: imageData,
    }
  
    // Get existing artwork from localStorage
    const savedArtwork = JSON.parse(localStorage.getItem("artwork")) || []
  
    // Add new artwork
    savedArtwork.push(artwork)
  
    // Save to localStorage
    localStorage.setItem("artwork", JSON.stringify(savedArtwork))
  
    // Show notification
    showNotification("Artwork saved successfully!")
  
    // Clear input
    document.getElementById("drawingName").value = ""
  }
  
  // Gallery functionality
  function loadGallery() {
    const galleryContainer = document.getElementById("gallery-container")
    const savedArtwork = JSON.parse(localStorage.getItem("artwork")) || []
  
    // Clear gallery container
    galleryContainer.innerHTML = ""
  
    if (savedArtwork.length === 0) {
      // Show empty state
      galleryContainer.innerHTML = `
              <div class="empty-gallery">
                  <i class="fas fa-image"></i>
                  <p>Your gallery is empty. Start creating some artwork!</p>
                  <a href="index.html" class="primary-btn">Create Artwork</a>
              </div>
          `
      return
    }
  
    // Display each artwork
    savedArtwork.forEach((artwork) => {
      const galleryItem = document.createElement("div")
      galleryItem.className = "gallery-item"
      galleryItem.dataset.id = artwork.id
  
      const date = new Date(artwork.date)
      const formattedDate = date.toLocaleDateString()
  
      galleryItem.innerHTML = `
              <img src="${artwork.image}" alt="${artwork.name}" class="gallery-item-image">
              <div class="gallery-item-info">
                  <h3 class="gallery-item-title">${artwork.name}</h3>
                  <p class="gallery-item-date">${formattedDate}</p>
              </div>
          `
  
      galleryItem.addEventListener("click", () => openArtworkModal(artwork))
  
      galleryContainer.appendChild(galleryItem)
    })
  }
  
  function setupGalleryControls() {
    // Search functionality
    const searchInput = document.getElementById("searchArtwork")
    if (searchInput) {
      searchInput.addEventListener("input", filterGallery)
    }
  
    // Sort functionality
    const sortSelect = document.getElementById("sortBy")
    if (sortSelect) {
      sortSelect.addEventListener("change", sortGallery)
    }
  
    // Modal close button
    const closeModal = document.querySelector(".close-modal")
    if (closeModal) {
      closeModal.addEventListener("click", closeArtworkModal)
    }
  
    // Download button in modal
    const downloadBtn = document.getElementById("download-artwork")
    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadArtwork)
    }
  
    // Delete button in modal
    const deleteBtn = document.getElementById("delete-artwork")
    if (deleteBtn) {
      deleteBtn.addEventListener("click", deleteArtwork)
    }
  }
  
  function filterGallery() {
    const searchTerm = document.getElementById("searchArtwork").value.toLowerCase()
    const galleryItems = document.querySelectorAll(".gallery-item")
  
    galleryItems.forEach((item) => {
      const title = item.querySelector(".gallery-item-title").textContent.toLowerCase()
      if (title.includes(searchTerm)) {
        item.style.display = "block"
      } else {
        item.style.display = "none"
      }
    })
  }
  
  function sortGallery() {
    const sortBy = document.getElementById("sortBy").value
    const galleryContainer = document.getElementById("gallery-container")
    const savedArtwork = JSON.parse(localStorage.getItem("artwork")) || []
  
    // Sort artwork
    const sortedArtwork = [...savedArtwork]
  
    switch (sortBy) {
      case "newest":
        sortedArtwork.sort((a, b) => new Date(b.date) - new Date(a.date))
        break
      case "oldest":
        sortedArtwork.sort((a, b) => new Date(a.date) - new Date(b.date))
        break
      case "name":
        sortedArtwork.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
  
    // Update localStorage
    localStorage.setItem("artwork", JSON.stringify(sortedArtwork))
  
    // Reload gallery
    loadGallery()
  }
  
  function openArtworkModal(artwork) {
    const modal = document.getElementById("artwork-modal")
    const modalTitle = document.getElementById("modal-title")
    const modalDate = document.getElementById("modal-date")
    const modalImage = document.getElementById("modal-image")
  
    // Set modal content
    modalTitle.textContent = artwork.name
  
    const date = new Date(artwork.date)
    modalDate.textContent = `Created on: ${date.toLocaleDateString()}`
  
    modalImage.src = artwork.image
    modalImage.alt = artwork.name
  
    // Store artwork ID in modal
    modal.dataset.artworkId = artwork.id
  
    // Show modal
    modal.style.display = "block"
  
    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeArtworkModal()
      }
    })
  }
  
  function closeArtworkModal() {
    const modal = document.getElementById("artwork-modal")
    modal.style.display = "none"
  }
  
  function downloadArtwork() {
    const modalImage = document.getElementById("modal-image")
    const modalTitle = document.getElementById("modal-title")
  
    // Create download link
    const downloadLink = document.createElement("a")
    downloadLink.href = modalImage.src
    downloadLink.download = `${modalTitle.textContent}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  
    showNotification("Artwork downloaded successfully!")
  }
  
  function deleteArtwork() {
    const modal = document.getElementById("artwork-modal")
    const artworkId = modal.dataset.artworkId
  
    // Get saved artwork
    let savedArtwork = JSON.parse(localStorage.getItem("artwork")) || []
  
    // Filter out the artwork to delete
    savedArtwork = savedArtwork.filter((artwork) => artwork.id !== artworkId)
  
    // Update localStorage
    localStorage.setItem("artwork", JSON.stringify(savedArtwork))
  
    // Close modal
    closeArtworkModal()
  
    // Reload gallery
    loadGallery()
  
    showNotification("Artwork deleted successfully!")
  }
  
  // Notification system
  function setupNotifications() {
    // Nothing to set up initially
  }
  
  function showNotification(message) {
    const notification = document.getElementById("notification")
    const notificationMessage = document.getElementById("notification-message")
  
    // Set message
    notificationMessage.textContent = message
  
    // Show notification
    notification.classList.add("show")
  
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show")
    }, 3000)
  }
  
  