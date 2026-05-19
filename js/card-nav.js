document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.querySelector('.card-nav');
    if (!navContainer) return;

    const hamburger = document.querySelector('.hamburger-menu');
    const content = document.querySelector('.card-nav-content');
    const cards = document.querySelectorAll('.nav-card');
    const hasGsap = typeof gsap !== 'undefined';
    
    // Configuration
    const ease = 'power3.out';
    let isExpanded = false;
    let tl = null;

    // Calculate the height needed for the expanded state
    const calculateHeight = () => {
        if (!navContainer) return 260; // Default desktop height
        
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile && content) {
             // Temporarily reset styles to measure natural height
             const prevVis = content.style.visibility;
             const prevPos = content.style.position;
             const prevH = content.style.height;
             const prevPointer = content.style.pointerEvents;
             
             content.style.visibility = 'visible';
             content.style.position = 'static';
             content.style.height = 'auto';
             content.style.pointerEvents = 'auto';
             
             // Force reflow
             // void content.offsetHeight;
             
             const contentHeight = content.scrollHeight;
             const topBarHeight = document.querySelector('.card-nav-top')?.offsetHeight || 60;
             const padding = 16;
             
             // Restore styles
             content.style.visibility = prevVis;
             content.style.position = prevPos;
             content.style.height = prevH;
             content.style.pointerEvents = prevPointer;
             
             return topBarHeight + contentHeight + padding;
        }
        return 260;
    };

    // Create the GSAP animation timeline
    const createTimeline = () => {
        if (!hasGsap) return null;

        // Initial setup
        if (!isExpanded) {
            gsap.set(navContainer, { height: 60 });
            gsap.set(cards, { y: 50, opacity: 0 });
        }

        const timeline = gsap.timeline({ paused: true });
        
        timeline.to(navContainer, {
            height: calculateHeight(),
            duration: 0.4,
            ease: ease
        });
        
        timeline.to(cards, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: ease,
            stagger: 0.08
        }, '-=0.1'); // Overlap slightly

        return timeline;
    };

    const setupFallbackState = () => {
        navContainer.style.height = '60px';
        navContainer.style.transition = 'height 0.35s ease';
        cards.forEach((card) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        });
    };

    const setFallbackCardsVisible = (visible) => {
        cards.forEach((card, index) => {
            const delay = visible ? index * 60 : 0;
            window.setTimeout(() => {
                card.style.opacity = visible ? '1' : '0';
                card.style.transform = visible ? 'translateY(0)' : 'translateY(50px)';
            }, delay);
        });
    };

    const toggleMenuFallback = () => {
        if (!isExpanded) {
            hamburger.classList.add('open');
            navContainer.classList.add('open');
            isExpanded = true;
            navContainer.style.height = `${calculateHeight()}px`;
            setFallbackCardsVisible(true);
        } else {
            hamburger.classList.remove('open');
            setFallbackCardsVisible(false);
            navContainer.style.height = '60px';
            isExpanded = false;
            window.setTimeout(() => {
                if (!isExpanded) {
                    navContainer.classList.remove('open');
                }
            }, 350);
        }
    };

    // Initialize animation timeline
    if (hasGsap) {
        tl = createTimeline();
    } else {
        setupFallbackState();
    }

    // Toggle menu state
    const toggleMenu = () => {
        if (!hasGsap) {
            toggleMenuFallback();
            return;
        }

        if (!tl) return;
        
        if (!isExpanded) {
            // Opening
            hamburger.classList.add('open');
            navContainer.classList.add('open');
            isExpanded = true;
            
            // Re-calculate timeline in case of resize/content change before open
            if(tl) tl.kill();
            tl = createTimeline();
            
            tl.play();
        } else {
            // Closing
            hamburger.classList.remove('open');
            
            tl.eventCallback('onReverseComplete', () => {
                navContainer.classList.remove('open');
                isExpanded = false;
                // Clean up callback
                tl.eventCallback('onReverseComplete', null);
            });
            tl.reverse();
        }
    };

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
        // Accessibility
        hamburger.addEventListener('keydown', (e) => {
             if (e.key === 'Enter' || e.key === ' ') {
                 toggleMenu();
                 e.preventDefault();
             }
        });
    }

    // Close navbar when clicking outside of it
    document.addEventListener('click', (e) => {
        if (isExpanded && navContainer && hamburger) {
            // Check if click is outside navbar and hamburger
            const isClickInsideNav = navContainer.contains(e.target);
            const isClickOnHamburger = hamburger.contains(e.target);
            
            if (!isClickInsideNav && !isClickOnHamburger) {
                toggleMenu(); // Close the menu
            }
        }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!hasGsap) {
                if (isExpanded) {
                    navContainer.style.height = `${calculateHeight()}px`;
                }
                return;
            }

            if(isExpanded) {
                // If menu is open, refresh the timeline to adjust height
                if(tl) tl.kill();
                
                // Reset to ensure clean calculation
                // gsap.set(navContainer, { height: 'auto' }); 
                
                tl = createTimeline();
                tl.progress(1); // Jump to end state (open)
            } else {
                // If closed, just reset timeline for next open
                if(tl) tl.kill();
                tl = createTimeline();
            }
        }, 100);
    });
});
