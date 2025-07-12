// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initScrollAnimations();
    initCounterAnimations();
    initContactForm();
    initNewsletterForm();
    initGalleryInteractions();
    initParallaxEffects();
    initSmoothScrolling();
    initCertificationForm(); // <-- Add this line
    initRegistrationForm(); // <-- For register.html
});

// Navigation Functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(45, 90, 39, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Active navigation link highlighting
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.product-card, .method-item, .gallery-item, .contact-item, .stat-item');
    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Counter Animations
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60fps
                let current = 0;

                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };

                updateCounter();
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Contact Form Handling
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const message = formData.get('message');

            // Simple validation
            if (!name || !email || !message) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }

            // Simulate form submission
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            // Simulate API call
            setTimeout(() => {
                showNotification('Thank you! Your message has been sent successfully.', 'success');
                contactForm.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2000);
        });
    }
}

// Newsletter Form Handling
function initNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput.value;

            if (!email || !isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }

            // Simulate subscription
            const submitButton = newsletterForm.querySelector('button');
            const originalHTML = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            submitButton.disabled = true;

            setTimeout(() => {
                showNotification('Thank you for subscribing to our newsletter!', 'success');
                emailInput.value = '';
                submitButton.innerHTML = originalHTML;
                submitButton.disabled = false;
            }, 1500);
        });
    }
}

// Gallery Interactions
function initGalleryInteractions() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const title = this.querySelector('h3').textContent;
            const description = this.querySelector('p').textContent;
            
            // Create modal for gallery item
            showGalleryModal(title, description, category);
        });
    });
}

// Parallax Effects
function initParallaxEffects() {
    const floatingItems = document.querySelectorAll('.floating-item');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        
        floatingItems.forEach(item => {
            const speed = parseFloat(item.getAttribute('data-speed')) || 1;
            const yPos = -(scrolled * speed * 0.5);
            item.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// Smooth Scrolling
function initSmoothScrolling() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Certification Form Handling
function initCertificationForm() {
    const form = document.getElementById('certificationForm');
    const cropsContainer = document.getElementById('cropsContainer');
    const addCropBtn = document.getElementById('addCropBtn');

    if (!form || !cropsContainer || !addCropBtn) return;

    // Add Crop Entry
    addCropBtn.addEventListener('click', function() {
        const cropEntry = document.createElement('div');
        cropEntry.className = 'crop-entry';
        cropEntry.innerHTML = `
            <input type="text" name="cropType[]" placeholder="Crop Type (e.g., Wheat)" required>
            <input type="text" name="seedVariety[]" placeholder="Seed Variety (e.g., Heirloom)" required>
            <input type="text" name="seedSource[]" placeholder="Seed Source (e.g., Own Saved)" required>
            <input type="date" name="sowingDate[]" placeholder="Sowing Date" required>
            <input type="date" name="harvestDate[]" placeholder="Harvest Date" required>
            <button type="button" class="remove-crop-btn">Remove</button>
        `;
        cropsContainer.appendChild(cropEntry);
        updateRemoveButtons();
    });

    // Remove Crop Entry
    cropsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-crop-btn')) {
            e.target.parentElement.remove();
            updateRemoveButtons();
        }
    });

    // Show remove button only if more than one crop
    function updateRemoveButtons() {
        const cropEntries = cropsContainer.querySelectorAll('.crop-entry');
        cropEntries.forEach((entry, idx) => {
            const btn = entry.querySelector('.remove-crop-btn');
            if (btn) btn.style.display = cropEntries.length > 1 ? 'inline-block' : 'none';
        });
    }
    updateRemoveButtons();

    // Form Validation and Submission
    form.addEventListener('submit', function(e) {
        // Validate all crop fields
        const cropEntries = cropsContainer.querySelectorAll('.crop-entry');
        let valid = true;
        cropEntries.forEach(entry => {
            const inputs = entry.querySelectorAll('input');
            inputs.forEach(input => {
                if (!input.value) {
                    input.classList.add('input-error');
                    valid = false;
                } else {
                    input.classList.remove('input-error');
                }
            });
        });
        if (!valid) {
            e.preventDefault();
            showNotification('Please fill in all crop details.', 'error');
            return;
        }
        // Optionally, handle displaying the profile here
        // e.preventDefault();
        // displayFarmerProfile(form, cropEntries);
    });
}

// Registration Form Handling for register.html
function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    // Dynamic crop fields (reuse logic)
    const cropsContainer = document.getElementById('cropsContainer');
    const addCropBtn = document.getElementById('addCropBtn');
    if (cropsContainer && addCropBtn) {
        addCropBtn.addEventListener('click', function() {
            const cropEntry = document.createElement('div');
            cropEntry.className = 'crop-entry';
            cropEntry.innerHTML = `
                <input type="text" name="cropType[]" placeholder="Crop Type (e.g., Wheat)" required>
                <input type="text" name="seedVariety[]" placeholder="Seed Variety (e.g., Heirloom)" required>
                <input type="text" name="seedSource[]" placeholder="Seed Source (e.g., Own Saved)" required>
                <input type="date" name="sowingDate[]" placeholder="Sowing Date" required>
                <input type="date" name="harvestDate[]" placeholder="Harvest Date" required>
                <button type="button" class="remove-crop-btn">Remove</button>
            `;
            cropsContainer.appendChild(cropEntry);
            updateRemoveButtons();
        });
        cropsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-crop-btn')) {
                e.target.parentElement.remove();
                updateRemoveButtons();
            }
        });
        function updateRemoveButtons() {
            const cropEntries = cropsContainer.querySelectorAll('.crop-entry');
            cropEntries.forEach((entry, idx) => {
                const btn = entry.querySelector('.remove-crop-btn');
                if (btn) btn.style.display = cropEntries.length > 1 ? 'inline-block' : 'none';
            });
        }
        updateRemoveButtons();
    }

    // Form validation and submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        let valid = true;
        // Validate required fields
        const name = form.farmerName.value.trim();
        const phone = form.contactNumber.value.trim();
        const address = form.address.value.trim();
        const certLevel = form.certificationLevel.value;
        const certFile = form.certificateUpload.files[0];
        const bio = form.bio.value.trim();
        const harvestMethod = form.harvestMethod.value.trim();
        const storage = form.storage.value.trim();
        const packaging = form.packaging.value.trim();
        // Phone validation
        if (!/^\d{10}$/.test(phone)) {
            showNotification('Please enter a valid 10-digit contact number.', 'error');
            form.contactNumber.classList.add('input-error');
            valid = false;
        } else {
            form.contactNumber.classList.remove('input-error');
        }
        // File validation
        if (!certFile || !['application/pdf','image/jpeg','image/png'].includes(certFile.type)) {
            showNotification('Certificate must be PDF, JPG, or PNG.', 'error');
            form.certificateUpload.classList.add('input-error');
            valid = false;
        } else {
            form.certificateUpload.classList.remove('input-error');
        }
        // At least one farming method
        const farmingMethods = Array.from(form.querySelectorAll('input[name="farmingMethods"]:checked')).map(cb => cb.value);
        if (farmingMethods.length === 0) {
            showNotification('Please select at least one farming method.', 'error');
            valid = false;
        }
        // Validate crops
        const cropEntries = cropsContainer ? cropsContainer.querySelectorAll('.crop-entry') : [];
        cropEntries.forEach(entry => {
            const inputs = entry.querySelectorAll('input');
            inputs.forEach(input => {
                if (!input.value) {
                    input.classList.add('input-error');
                    valid = false;
                } else {
                    input.classList.remove('input-error');
                }
            });
            // Date logic: sowing <= harvest
            const sowing = entry.querySelector('input[name="sowingDate[]"]');
            const harvest = entry.querySelector('input[name="harvestDate[]"]');
            if (sowing && harvest && sowing.value && harvest.value && sowing.value > harvest.value) {
                showNotification('Sowing date must be before harvest date.', 'error');
                sowing.classList.add('input-error');
                harvest.classList.add('input-error');
                valid = false;
            }
        });
        // Validate harvest/post-harvest
        if (!harvestMethod || !storage || !packaging) {
            showNotification('Please fill in all harvest/post-harvest details.', 'error');
            valid = false;
        }
        // Validate bio
        if (!bio) {
            showNotification('Please enter your bio/story.', 'error');
            form.bio.classList.add('input-error');
            valid = false;
        } else {
            form.bio.classList.remove('input-error');
        }
        // Images validation (optional, up to 3)
        const images = form.profileImages.files;
        if (images.length > 3) {
            showNotification('You can upload up to 3 images.', 'error');
            valid = false;
        }
        // If not valid, stop
        if (!valid) return;
        // Prepare data for localStorage
        const crops = Array.from(cropEntries).map(entry => ({
            cropType: entry.querySelector('input[name="cropType[]"]').value,
            seedVariety: entry.querySelector('input[name="seedVariety[]"]').value,
            seedSource: entry.querySelector('input[name="seedSource[]"]').value,
            sowingDate: entry.querySelector('input[name="sowingDate[]"]').value,
            harvestDate: entry.querySelector('input[name="harvestDate[]"]').value
        }));
        // Read images as Data URLs
        const imageData = await Promise.all(Array.from(images).map(file => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve({name: file.name, data: e.target.result});
            reader.readAsDataURL(file);
        })));
        // Only store certificate file name/type for privacy
        const certInfo = certFile ? {name: certFile.name, type: certFile.type} : null;
        // Save all data
        const farmerProfile = {
            name,
            phone,
            address,
            certificationLevel: certLevel,
            certificate: certInfo,
            farmingMethods,
            crops,
            harvestMethod,
            storage,
            packaging,
            bio,
            images: imageData,
            products: [] // For future product management
        };
        // MULTI-FARMER SUPPORT
        let farmers = [];
        try {
            farmers = JSON.parse(localStorage.getItem('farmers')) || [];
        } catch (e) { farmers = []; }
        farmers.push(farmerProfile);
        localStorage.setItem('farmers', JSON.stringify(farmers));
        // Store current farmer index for profile editing
        localStorage.setItem('currentFarmerIndex', (farmers.length - 1).toString());
        // For backward compatibility, also update single farmerProfile
        localStorage.setItem('farmerProfile', JSON.stringify(farmerProfile));
        // Redirect to profile page
        window.location.href = 'profile.html';
    });
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function showGalleryModal(title, description, category) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'gallery-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-image">
                        <i class="fas ${getCategoryIcon(category)}"></i>
                    </div>
                    <p>${description}</p>
                    <div class="modal-category">
                        <span class="category-tag">${category}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const overlay = modal.querySelector('.modal-overlay');
    overlay.style.cssText = `
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const content = modal.querySelector('.modal-content');
    content.style.cssText = `
        background: white;
        border-radius: 20px;
        max-width: 500px;
        width: 100%;
        transform: scale(0.7);
        transition: transform 0.3s ease;
    `;

    const header = modal.querySelector('.modal-header');
    header.style.cssText = `
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const closeButton = modal.querySelector('.modal-close');
    closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.3s ease;
    `;

    const body = modal.querySelector('.modal-body');
    body.style.cssText = `
        padding: 1.5rem;
    `;

    const image = modal.querySelector('.modal-image');
    image.style.cssText = `
        width: 100px;
        height: 100px;
        background: var(--gradient-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: white;
        margin: 0 auto 1rem;
    `;

    const categoryTag = modal.querySelector('.category-tag');
    categoryTag.style.cssText = `
        background: var(--accent-gold);
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
        display: inline-block;
        margin-top: 1rem;
    `;

    // Add to page
    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => {
        modal.style.opacity = '1';
        content.style.transform = 'scale(1)';
    }, 100);

    // Close functionality
    const closeModal = () => {
        modal.style.opacity = '0';
        content.style.transform = 'scale(0.7)';
        setTimeout(() => modal.remove(), 300);
    };

    closeButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function getCategoryIcon(category) {
    const icons = {
        'fields': 'fa-wheat-awn',
        'vegetables': 'fa-carrot',
        'fruits': 'fa-apple-alt',
        'herbs': 'fa-seedling',
        'workers': 'fa-users',
        'equipment': 'fa-tractor'
    };
    return icons[category] || 'fa-image';
}

// Add CSS for notifications and modals
const additionalStyles = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
    }
    
    .modal-close:hover {
        background: #f0f0f0;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Performance optimization: Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Apply throttling to scroll events
window.addEventListener('scroll', throttle(function() {
    // Scroll-based animations are handled by CSS and Intersection Observer
}, 16)); // ~60fps
