// Modal Manager Class
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal(this.activeModal);
            }
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target.classList.contains('modal-base')) {
                this.closeModal(this.activeModal);
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Close any active modal first
        if (this.activeModal) {
            this.closeModal(this.activeModal);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.activeModal = modal;

        // Trigger custom event
        modal.dispatchEvent(new CustomEvent('modalOpen'));
    }

    closeModal(modal) {
        if (!modal) return;

        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.activeModal = null;

        // Trigger custom event
        modal.dispatchEvent(new CustomEvent('modalClose'));
    }
}

// Toast Manager Class
class ToastManager {
    constructor() {
        this.createToastContainer();
    }

    createToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIconForType(type);
        
        toast.innerHTML = `
            ${icon}
            <div class="toast-content">
                <p>${message}</p>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        const container = document.querySelector('.toast-container');
        container.appendChild(toast);
        
        // Add click event for close button
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => this.removeToast(toast));
        
        // Auto-remove after 5 seconds
        setTimeout(() => this.removeToast(toast), 5000);
    }

    removeToast(toast) {
        if (toast.parentNode) {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }

    getIconForType(type) {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        return icons[type] || icons.info;
    }
}

// Video Modal Manager Class
class VideoModalManager {
    constructor() {
        this.modal = document.getElementById('courseTrailer');
        this.iframe = this.modal?.querySelector('iframe');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.modal) return;

        // Handle modal close
        const closeBtn = this.modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeVideo());
        }

        // Handle trailer buttons
        document.querySelectorAll('.trailer-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseCard = e.target.closest('.featured-course');
                if (courseCard) {
                    const courseTitle = courseCard.querySelector('.preview-content h3').textContent;
                    this.openVideo(courseTitle);
                }
            });
        });

        // Handle modal backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeVideo();
            }
        });
    }

    openVideo(courseTitle) {
        if (!this.modal || !this.iframe) return;

        const courseTrailers = {
            'Navigating Global Development Finance': 'videos/data_journalism.mp4',
            'Data Analysis and Visualization': 'videos/DataAnalysis.mp4',
            'Securing Development Funding': 'videos/Funding.mp4',
            'Navigating Debt Distress': 'videos/Debt.mp4'
        };

        const videoSrc = courseTrailers[courseTitle];
        if (videoSrc) {
            this.iframe.src = videoSrc;
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeVideo() {
        if (!this.modal || !this.iframe) return;

        this.modal.classList.remove('active');
        this.iframe.src = 'about:blank';
        document.body.style.overflow = '';
    }
}

// Initialize managers
const modalManager = new ModalManager();
const toastManager = new ToastManager();
const videoModalManager = new VideoModalManager();

// Export managers for use in other files
export { modalManager, toastManager, videoModalManager }; 