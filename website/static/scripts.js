document.addEventListener("DOMContentLoaded", () => {
  // Common elements
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")

  // Show notification
  function showNotification(message, type = "success") {
    notificationMessage.textContent = message
    notification.className = "notification show " + type

    setTimeout(() => {
      notification.className = "notification"
    }, 3000)
  }

  // Drawing page functionality
  if (document.getElementById("drawCanvas")) {
    const canvas = document.getElementById("drawCanvas")
    const ctx = canvas.getContext("2d")
    const brushSizeInput = document.getElementById("brushSize")
    const colorPicker = document.getElementById("colorPicker")
    const eraserBtn = document.getElementById("eraser")
    const clearBtn = document.getElementById("clear")
    const saveBtn = document.getElementById("saveDrawing")
    const drawingNameInput = document.getElementById("drawingName")
    const drawingCategoryInput = document.getElementById("drawingCategory")
    const drawingPriceInput = document.getElementById("drawingPrice")

    let isDrawing = false
    let lastX = 0
    let lastY = 0
    let isEraser = false
    let originalColor = colorPicker.value

    // Set canvas size
    function resizeCanvas() {
      const container = canvas.parentElement
      canvas.width = container.clientWidth > 800 ? 800 : container.clientWidth - 20
      canvas.height = 500

      // Fill with white background
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Drawing functions
    function startDrawing(e) {
      isDrawing = true
      ;[lastX, lastY] = getCoordinates(e)
    }

    function draw(e) {
      if (!isDrawing) return

      const [currentX, currentY] = getCoordinates(e)

      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.lineWidth = brushSizeInput.value
      ctx.strokeStyle = isEraser ? "white" : colorPicker.value

      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(currentX, currentY)
      ctx.stroke()
      ;[lastX, lastY] = [currentX, currentY]
    }

    function stopDrawing() {
      isDrawing = false
    }

    function getCoordinates(e) {
      const rect = canvas.getBoundingClientRect()
      const x = e.type.includes("touch") ? e.touches[0].clientX - rect.left : e.clientX - rect.left
      const y = e.type.includes("touch") ? e.touches[0].clientY - rect.top : e.clientY - rect.top
      return [x, y]
    }

    // Event listeners for drawing
    canvas.addEventListener("mousedown", startDrawing)
    canvas.addEventListener("mousemove", draw)
    canvas.addEventListener("mouseup", stopDrawing)
    canvas.addEventListener("mouseout", stopDrawing)

    // Touch support
    canvas.addEventListener("touchstart", startDrawing)
    canvas.addEventListener("touchmove", draw)
    canvas.addEventListener("touchend", stopDrawing)

    // Tool buttons
    eraserBtn.addEventListener("click", () => {
      if (!isEraser) {
        originalColor = colorPicker.value
        isEraser = true
        eraserBtn.classList.add("active")
      } else {
        isEraser = false
        colorPicker.value = originalColor
        eraserBtn.classList.remove("active")
      }
    })

    clearBtn.addEventListener("click", () => {
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    })

    // Color picker
    colorPicker.addEventListener("change", () => {
      if (isEraser) {
        isEraser = false
        eraserBtn.classList.remove("active")
      }
    })

    // Save drawing
    saveBtn.addEventListener("click", () => {
      const drawingName = drawingNameInput.value.trim() || "Untitled Artwork"
      const category = drawingCategoryInput.value
      const price = Number.parseFloat(drawingPriceInput.value) || 0
      const forSale = price > 0

      // Convert canvas to data URL
      const dataURL = canvas.toDataURL("image/png")

      // Create artwork object
      const artwork = {
        id: Date.now().toString(),
        name: drawingName,
        category: category,
        dataURL: dataURL,
        date: new Date().toISOString(),
        forSale: forSale,
        price: price,
      }

      // Get existing artworks from localStorage
      const artworks = JSON.parse(localStorage.getItem("artworks") || "[]")

      // Add new artwork
      artworks.push(artwork)

      // Save to localStorage
      localStorage.setItem("artworks", JSON.stringify(artworks))

      // Show notification
      showNotification(`"${drawingName}" saved successfully!`)

      // Reset drawing name and price
      drawingNameInput.value = ""
      drawingPriceInput.value = ""
    })
  }

  // Gallery page functionality
  if (document.getElementById("gallery-container")) {
    const galleryContainer = document.getElementById("gallery-container")
    const searchInput = document.getElementById("searchArtwork")
    const sortSelect = document.getElementById("sortBy")
    const modal = document.getElementById("artwork-modal")
    const modalTitle = document.getElementById("modal-title")
    const modalDate = document.getElementById("modal-date")
    const modalCategory = document.getElementById("modal-category")
    const modalPrice = document.getElementById("modal-price")
    const modalImage = document.getElementById("modal-image")
    const downloadBtn = document.getElementById("download-artwork")
    const deleteBtn = document.getElementById("delete-artwork")
    const sellBtn = document.getElementById("sell-artwork")
    const closeModal = document.querySelector(".close-modal")

    let currentArtworkId = null
    let artworks = []

    // Load artworks from localStorage
    function loadArtworks() {
      artworks = JSON.parse(localStorage.getItem("artworks") || "[]")
      displayArtworks(artworks)
    }

    // Display artworks in gallery
    function displayArtworks(artworksToDisplay) {
      if (artworksToDisplay.length === 0) {
        // Check if this is initial load or search result
        if (searchInput.value.trim() !== "") {
          galleryContainer.innerHTML = "No artwork found"
        } else {
          galleryContainer.innerHTML = "Your gallery is empty. Start creating some artwork!"
        }
        return
      }

      galleryContainer.innerHTML = ""

      artworksToDisplay.forEach((artwork) => {
        const artworkCard = document.createElement("div")
        artworkCard.className = "artwork-card"
        artworkCard.dataset.id = artwork.id

        const formattedDate = new Date(artwork.date).toLocaleDateString()
        const categoryDisplay = artwork.category
          ? artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1)
          : "Uncategorized"
        const priceDisplay = artwork.price > 0 ? `$${artwork.price.toFixed(2)}` : "Not for sale"

        artworkCard.innerHTML = `
          <img src="${artwork.dataURL}" alt="${artwork.name}" class="artwork-image">
          <div class="artwork-info">
            <h3>${artwork.name}</h3>
            <p>${formattedDate}</p>
            <p>Category: ${categoryDisplay}</p>
            <p>Price: ${priceDisplay}</p>
          </div>
        `

        artworkCard.addEventListener("click", () => openArtworkModal(artwork))

        galleryContainer.appendChild(artworkCard)
      })
    }

    // Open artwork modal
    function openArtworkModal(artwork) {
      currentArtworkId = artwork.id
      modalTitle.textContent = artwork.name
      modalDate.textContent = `Created on: ${new Date(artwork.date).toLocaleDateString()}`

      // Display category
      const categoryDisplay = artwork.category
        ? artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1)
        : "Uncategorized"
      modalCategory.textContent = `Category: ${categoryDisplay}`

      // Display price
      const priceDisplay = artwork.price > 0 ? `$${artwork.price.toFixed(2)}` : "Not for sale"
      modalPrice.textContent = `Price: ${priceDisplay}`

      modalImage.src = artwork.dataURL

      if (artwork.forSale) {
        sellBtn.textContent = `Listed for $${artwork.price.toFixed(2)}`
        sellBtn.disabled = true
      } else {
        sellBtn.textContent = "Sell on Marketplace"
        sellBtn.disabled = false
      }

      modal.style.display = "block"
    }

    // Close modal
    closeModal.addEventListener("click", () => {
      modal.style.display = "none"
    })

    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none"
      }
    })

    // Download artwork
    downloadBtn.addEventListener("click", () => {
      const artwork = artworks.find((a) => a.id === currentArtworkId)
      if (!artwork) return

      const link = document.createElement("a")
      link.download = `${artwork.name}.png`
      link.href = artwork.dataURL
      link.click()
    })

    // Delete artwork
    deleteBtn.addEventListener("click", () => {
      if (!currentArtworkId) return

      const updatedArtworks = artworks.filter((a) => a.id !== currentArtworkId)
      localStorage.setItem("artworks", JSON.stringify(updatedArtworks))

      showNotification("Artwork deleted successfully")
      modal.style.display = "none"

      loadArtworks()
    })

    // Sell artwork
    if (sellBtn) {
      sellBtn.addEventListener("click", () => {
        if (!currentArtworkId) return

        const pricePrompt = prompt("Enter the price for your artwork ($):", "50")
        if (pricePrompt === null) return

        const price = Number.parseFloat(pricePrompt)
        if (isNaN(price) || price <= 0) {
          showNotification("Please enter a valid price", "error")
          return
        }

        // Update artwork with price and forSale flag
        const updatedArtworks = artworks.map((a) => {
          if (a.id === currentArtworkId) {
            return { ...a, forSale: true, price }
          }
          return a
        })

        localStorage.setItem("artworks", JSON.stringify(updatedArtworks))

        showNotification("Artwork listed for sale successfully")
        modal.style.display = "none"

        loadArtworks()
      })
    }

    // Search functionality
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase()

      // Create a placeholder for "no results" that maintains layout
      const emptyGalleryHTML = searchTerm
        ? `<div class="empty-gallery">
          <i class="fas fa-search"></i>
          <p>No artwork found</p>
        </div>`
        : `<div class="empty-gallery">
          <i class="fas fa-image"></i>
          <p>Your gallery is empty. Start creating some artwork!</p>
          <a href="draw.html" class="primary-btn">Create Artwork</a>
        </div>`

      // Filter the artworks by name only
      const filteredArtworks = artworks.filter((artwork) => artwork.name.toLowerCase().includes(searchTerm))

      // If no results, show placeholder with consistent height
      if (filteredArtworks.length === 0) {
        galleryContainer.innerHTML = emptyGalleryHTML
        return
      }

      // Display the filtered artworks
      displayArtworks(filteredArtworks)
    })

    // Sort functionality
    sortSelect.addEventListener("change", () => {
      const sortValue = sortSelect.value
      const sortedArtworks = [...artworks]

      switch (sortValue) {
        case "newest":
          sortedArtworks.sort((a, b) => new Date(b.date) - new Date(a.date))
          break
        case "oldest":
          sortedArtworks.sort((a, b) => new Date(a.date) - new Date(b.date))
          break
        case "name":
          sortedArtworks.sort((a, b) => a.name.localeCompare(b.name))
          break
        case "price-low":
          sortedArtworks.sort((a, b) => a.price - b.price)
          break
        case "price-high":
          sortedArtworks.sort((a, b) => b.price - a.price)
          break
      }

      displayArtworks(sortedArtworks)
    })

    // Load artworks on page load
    loadArtworks()
  }

  // Marketplace page functionality
  if (document.getElementById("marketplace-grid")) {
    const marketplaceGrid = document.getElementById("marketplace-grid")
    const searchInput = document.getElementById("search-input") // Updated to match HTML
    const categoryFilter = document.getElementById("category-filter") // Updated to match HTML
    const priceFilter = document.getElementById("price-filter") // Updated to match HTML
    const sortFilter = document.getElementById("sort-filter") // Updated to match HTML

    // Create marketplace modal elements if they don't exist
    let marketplaceModal = document.getElementById("marketplace-modal")
    if (!marketplaceModal) {
      marketplaceModal = document.createElement("div")
      marketplaceModal.id = "marketplace-modal"
      marketplaceModal.className = "modal"

      marketplaceModal.innerHTML = `
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <div class="artwork-details">
            <h2 id="marketplace-modal-title">Artwork Title</h2>
            <p id="marketplace-modal-category">Category: </p>
            <p id="marketplace-modal-price">Price: </p>
            <div class="modal-image-container">
              <img id="marketplace-modal-image" src="/placeholder.svg?height=400&width=600" alt="Artwork">
            </div>
            <div class="modal-actions">
              <button id="buy-artwork" class="btn btn-primary">
                <i class="fas fa-shopping-cart"></i> Buy Now
              </button>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(marketplaceModal)
    }

    const marketplaceModalTitle = document.getElementById("marketplace-modal-title")
    const marketplaceModalCategory = document.getElementById("marketplace-modal-category")
    const marketplaceModalPrice = document.getElementById("marketplace-modal-price")
    const marketplaceModalImage = document.getElementById("marketplace-modal-image")
    const buyBtn = document.getElementById("buy-artwork")
    const closeMarketplaceModal = marketplaceModal.querySelector(".close-modal")

    let currentMarketplaceItemId = null
    let marketplaceItems = []

    // Load artworks from localStorage
    function loadMarketplaceItems() {
      const artworks = JSON.parse(localStorage.getItem("artworks") || "[]")
      marketplaceItems = artworks.filter((artwork) => artwork.forSale)

      if (marketplaceItems.length === 0) {
        // If no user artworks are for sale, show empty state
        marketplaceGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-message">
              <i class="fas fa-store text-muted-foreground text-4xl mb-4"></i>
              <p>No artwork available in the marketplace</p>
              <a href="draw.html" class="btn btn-primary mt-4">Create and sell your art</a>
            </div>
          </div>
        `
        return
      }

      // Clear sample items
      marketplaceGrid.innerHTML = ""

      // Display user's for-sale artworks
      displayMarketplaceItems(marketplaceItems)
    }

    // Display marketplace items - IMPROVED VERSION
    function displayMarketplaceItems(itemsToDisplay) {
      if (itemsToDisplay.length === 0) {
        marketplaceGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-message">
              <i class="fas fa-search text-muted-foreground text-4xl mb-4"></i>
              <p>No artwork found matching your criteria</p>
            </div>
          </div>
        `
        return
      }

      marketplaceGrid.innerHTML = ""

      // Add CSS for the improved card design if it doesn't exist
      if (!document.getElementById("marketplace-card-styles")) {
        const styleEl = document.createElement("style")
        styleEl.id = "marketplace-card-styles"
        styleEl.textContent = `
          .artwork-card {
            border-radius: var(--radius);
            overflow: hidden;
            background-color: var(--card);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          
          .artwork-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }
          
          .artwork-image-container {
            position: relative;
            padding-top: 75%; /* 4:3 aspect ratio */
            overflow: hidden;
          }
          
          .artwork-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
          }
          
          .artwork-card:hover .artwork-image {
            transform: scale(1.05);
          }
          
          .artwork-info {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
          }
          
          .artwork-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .artwork-category {
            font-size: 0.75rem;
            color: var(--muted-foreground);
            margin-bottom: 0.5rem;
          }
          
          .artwork-description {
            font-size: 0.85rem;
            color: var(--muted-foreground);
            margin-bottom: 0.75rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .artwork-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
          }
          
          .artwork-price {
            font-size: 1rem;
            font-weight: 700;
            color: var(--primary);
          }
          
          .artwork-artist {
            font-size: 0.75rem;
            color: var(--muted-foreground);
          }
          
          .artwork-actions {
            padding: 0 1rem 1rem;
          }
          
          .artwork-actions .btn {
            width: 100%;
            font-size: 0.875rem;
          }
      
          /* Modal image styles */
          .modal-image-container img {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        `
        document.head.appendChild(styleEl)
      }
      
      itemsToDisplay.forEach((artwork) => {
        const artworkCard = document.createElement("div")
        artworkCard.className = "artwork-card"
        artworkCard.dataset.id = artwork.id
      
        const formattedDate = new Date(artwork.date).toLocaleDateString()
        const categoryDisplay = artwork.category
          ? artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1)
          : "Uncategorized"
        
        // Create a description from the category if no description exists
        const description = artwork.description || `A beautiful piece of ${categoryDisplay.toLowerCase()} art.`
      
        artworkCard.innerHTML = `
          <div class="artwork-image-container">
            <img src="${artwork.dataURL}" alt="${artwork.name}" class="artwork-image">
          </div>
          <div class="artwork-info">
            <h3 class="artwork-title">${artwork.name}</h3>
            <div class="artwork-category">${categoryDisplay}</div>
            <div class="artwork-description">${description}</div>
            <div class="artwork-meta">
              <div class="artwork-price">$${artwork.price.toFixed(2)}</div>
              <div class="artwork-artist">by You</div>
            </div>
          </div>
          <div class="artwork-actions">
            <button class="btn btn-primary">
              <i class="fas fa-shopping-cart"></i> Buy Now
            </button>
          </div>
        `
      
        // Add click event to the artwork card
        artworkCard.addEventListener("click", (e) => {
          // Don't open modal if Buy Now button was clicked
          if (e.target.closest(".btn")) {
            showNotification("Purchase functionality will be implemented with your Python backend")
            return
          }
          openMarketplaceModal(artwork)
        })
      
        marketplaceGrid.appendChild(artworkCard)
      })
    }

    // Open marketplace modal
    function openMarketplaceModal(artwork) {
      currentMarketplaceItemId = artwork.id
      
      // Update title
      const marketplaceModalTitle = document.getElementById("marketplace-modal-title")
      marketplaceModalTitle.textContent = artwork.name
    
      // Display category
      const categoryDisplay = artwork.category
        ? artwork.category.charAt(0).toUpperCase() + artwork.category.slice(1)
        : "Uncategorized"
      const marketplaceModalCategory = document.getElementById("marketplace-modal-category")
      marketplaceModalCategory.textContent = categoryDisplay
    
      // Display price
      const marketplaceModalPrice = document.getElementById("marketplace-modal-price")
      marketplaceModalPrice.textContent = `$${artwork.price.toFixed(2)}`
    
      // Set image
      const marketplaceModalImage = document.getElementById("marketplace-modal-image")
      marketplaceModalImage.src = artwork.dataURL
    
      // Show modal
      const marketplaceModal = document.getElementById("marketplace-modal")
      marketplaceModal.style.display = "block"
      
      // Add body class to prevent scrolling
      document.body.classList.add('modal-open')
    }

    // Close marketplace modal
    closeMarketplaceModal.addEventListener("click", () => {
      marketplaceModal.style.display = "none"
    })

    window.addEventListener("click", (e) => {
      if (e.target === marketplaceModal) {
        marketplaceModal.style.display = "none"
      }
    })

    // Buy artwork button in modal
    buyBtn.addEventListener("click", () => {
      showNotification("Purchase functionality will be implemented with your Python backend")
      marketplaceModal.style.display = "none"
    })

    // Search functionality - using unified filter function
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        filterItems(
          marketplaceItems,
          searchInput.value,
          categoryFilter ? categoryFilter.value : null,
          priceFilter ? priceFilter.value : null,
          sortFilter ? sortFilter.value : "newest",
          displayMarketplaceItems,
          "marketplace",
        )
      })
    }

    // Event listeners for filters
    if (categoryFilter) {
      categoryFilter.addEventListener("change", () => {
        filterItems(
          marketplaceItems,
          searchInput ? searchInput.value : "",
          categoryFilter.value,
          priceFilter ? priceFilter.value : null,
          sortFilter ? sortFilter.value : "newest",
          displayMarketplaceItems,
          "marketplace",
        )
      })
    }

    if (priceFilter) {
      priceFilter.addEventListener("change", () => {
        filterItems(
          marketplaceItems,
          searchInput ? searchInput.value : "",
          categoryFilter ? categoryFilter.value : null,
          priceFilter.value,
          sortFilter ? sortFilter.value : "newest",
          displayMarketplaceItems,
          "marketplace",
        )
      })
    }

    if (sortFilter) {
      sortFilter.addEventListener("change", () => {
        filterItems(
          marketplaceItems,
          searchInput ? searchInput.value : "",
          categoryFilter ? categoryFilter.value : null,
          priceFilter ? priceFilter.value : null,
          sortFilter.value,
          displayMarketplaceItems,
          "marketplace",
        )
      })
    }

    // Load marketplace items
    loadMarketplaceItems()
  }

  // Unified search/filter function for both gallery and marketplace
  function filterItems(items, searchTerm, category, price, sort, displayCallback, context) {
    searchTerm = searchTerm ? searchTerm.toLowerCase() : ""

    // Filter by search term
    let filteredItems = items.filter((item) => !searchTerm || item.name.toLowerCase().includes(searchTerm))

    // Filter by category (marketplace only)
    if (category && category !== "all") {
      filteredItems = filteredItems.filter((item) => item.category === category)
    }

    // Filter by price (marketplace only)
    if (context === "marketplace" && price && price !== "all") {
      filteredItems = filteredItems.filter((item) => {
        const priceValue = item.price
        switch (price) {
          case "under-50":
            return priceValue < 50
          case "50-100":
            return priceValue >= 50 && priceValue <= 100
          case "100-200":
            return priceValue > 100 && priceValue <= 200
          case "over-200":
            return priceValue > 200
          default:
            return true
        }
      })
    }

    // Sort items
    if (sort) {
      switch (sort) {
        case "newest":
          filteredItems.sort((a, b) => new Date(b.date) - new Date(a.date))
          break
        case "oldest":
          filteredItems.sort((a, b) => new Date(a.date) - new Date(b.date))
          break
        case "name":
          filteredItems.sort((a, b) => a.name.localeCompare(b.name))
          break
        case "price-low":
          filteredItems.sort((a, b) => a.price - b.price)
          break
        case "price-high":
          filteredItems.sort((a, b) => b.price - a.price)
          break
        case "popular":
          // This would normally use a popularity metric
          // For now, just randomize
          filteredItems.sort(() => Math.random() - 0.5)
          break
      }
    }

    // Display the filtered items
    displayCallback(filteredItems)
  }
})

