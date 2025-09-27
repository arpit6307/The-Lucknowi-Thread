import React, { useEffect, useRef } from 'react';

const CustomCursor = () => {
    const cursorRef = useRef(null);

    // A list of all elements that should trigger the hover effect
    const hoverableSelectors = 'a, button, .gallery-card-v2, .product-card-v2, .form-check-label, .qty-btn, .scroll-to-top-btn, .contact-card, .feature-item, .nav-link';

    useEffect(() => {
        const onMouseMove = (e) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };

        const onMouseDown = () => {
            if (cursorRef.current) {
                cursorRef.current.classList.add('clicked');
            }
        };

        const onMouseUp = () => {
            if (cursorRef.current) {
                cursorRef.current.classList.remove('clicked');
            }
        };

        const addHoverClass = () => {
            if (cursorRef.current) {
                cursorRef.current.classList.add('hover');
            }
        };
        const removeHoverClass = () => {
            if (cursorRef.current) {
                cursorRef.current.classList.remove('hover');
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);

        const elements = document.querySelectorAll(hoverableSelectors);
        elements.forEach(el => {
            el.addEventListener('mouseenter', addHoverClass);
            el.addEventListener('mouseleave', removeHoverClass);
        });

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            elements.forEach(el => {
                el.removeEventListener('mouseenter', addHoverClass);
                el.removeEventListener('mouseleave', removeHoverClass);
            });
        };
    }, []);

    return <div ref={cursorRef} className="custom-cursor" />;
};

export default CustomCursor;