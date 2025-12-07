import gsap from 'gsap';

/**
 * GSAP Animation Utilities
 * Reusable animation functions for the dashboard
 */

// Fade in animation
export const fadeIn = (element, duration = 0.5, delay = 0) => {
    return gsap.fromTo(
        element,
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration,
            delay,
            ease: 'power2.out'
        }
    );
};

// Slide in from left
export const slideInLeft = (element, duration = 0.6, delay = 0) => {
    return gsap.fromTo(
        element,
        { opacity: 0, x: -50 },
        {
            opacity: 1,
            x: 0,
            duration,
            delay,
            ease: 'power3.out'
        }
    );
};

// Slide in from right
export const slideInRight = (element, duration = 0.6, delay = 0) => {
    return gsap.fromTo(
        element,
        { opacity: 0, x: 50 },
        {
            opacity: 1,
            x: 0,
            duration,
            delay,
            ease: 'power3.out'
        }
    );
};

// Scale in animation
export const scaleIn = (element, duration = 0.5, delay = 0) => {
    return gsap.fromTo(
        element,
        { opacity: 0, scale: 0.8 },
        {
            opacity: 1,
            scale: 1,
            duration,
            delay,
            ease: 'back.out(1.7)'
        }
    );
};

// Stagger animation for lists
export const staggerFadeIn = (elements, stagger = 0.1) => {
    return gsap.fromTo(
        elements,
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger,
            ease: 'power2.out'
        }
    );
};

// Count up animation for numbers
export const countUp = (element, endValue, duration = 2) => {
    const obj = { value: 0 };

    return gsap.to(obj, {
        value: endValue,
        duration,
        ease: 'power1.out',
        onUpdate: () => {
            if (element) {
                element.textContent = Math.floor(obj.value).toLocaleString();
            }
        }
    });
};

// Pulse animation
export const pulse = (element, scale = 1.05) => {
    return gsap.to(element, {
        scale,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut'
    });
};

// Shake animation (for errors)
export const shake = (element) => {
    return gsap.to(element, {
        x: [-10, 10, -10, 10, 0],
        duration: 0.5,
        ease: 'power1.inOut'
    });
};

// Page transition
export const pageTransition = (element) => {
    return gsap.fromTo(
        element,
        { opacity: 0, scale: 0.95 },
        {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        }
    );
};

// Notification slide in
export const notificationSlideIn = (element) => {
    return gsap.fromTo(
        element,
        { x: 400, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out'
        }
    );
};

// Notification slide out
export const notificationSlideOut = (element) => {
    return gsap.to(element, {
        x: 400,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
    });
};

// Loading spinner rotation
export const rotateSpinner = (element) => {
    return gsap.to(element, {
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: 'linear'
    });
};

// Hover scale effect
export const hoverScale = (element, scale = 1.05) => {
    element.addEventListener('mouseenter', () => {
        gsap.to(element, {
            scale,
            duration: 0.3,
            ease: 'power2.out'
        });
    });

    element.addEventListener('mouseleave', () => {
        gsap.to(element, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
        });
    });
};

// Progress bar animation
export const animateProgress = (element, progress, duration = 1) => {
    return gsap.to(element, {
        width: `${progress}%`,
        duration,
        ease: 'power2.out'
    });
};

export default {
    fadeIn,
    slideInLeft,
    slideInRight,
    scaleIn,
    staggerFadeIn,
    countUp,
    pulse,
    shake,
    pageTransition,
    notificationSlideIn,
    notificationSlideOut,
    rotateSpinner,
    hoverScale,
    animateProgress
};
