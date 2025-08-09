"use client";

import React from 'react';

// Toast component
const Toast = () => {
  return null; // This component doesn't render anything itself
};

// Function to show toast
export const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.textContent = message;
    
    // Base styling
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.padding = '16px 24px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    toast.style.fontWeight = '500';
    toast.style.fontSize = '14px';
    toast.style.lineHeight = '1.5';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '12px';
    toast.style.transform = 'translateX(150%)';
    toast.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    toast.style.cursor = 'pointer';
    toast.style.overflow = 'hidden';
    
    // Add icon based on type
    const icon = document.createElement('span');
    icon.style.fontSize = '20px';
    
    switch(type) {
        case 'success':
            toast.style.backgroundColor = '#22c55e';
            icon.textContent = '✓';
            break;
        case 'error':
            toast.style.backgroundColor = '#ef4444';
            icon.textContent = '✕';
            break;
        case 'warning':
            toast.style.backgroundColor = '#f59e0b';
            icon.textContent = '⚠';
            break;
        default: // info
            toast.style.backgroundColor = '#3b82f6';
            icon.textContent = 'ⓘ';
    }
    
    toast.prepend(icon);
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.style.position = 'absolute';
    progressBar.style.bottom = '0';
    progressBar.style.left = '0';
    progressBar.style.height = '4px';
    progressBar.style.backgroundColor = 'rgba(255,255,255,0.4)';
    progressBar.style.width = '100%';
    progressBar.style.transformOrigin = 'left';
    progressBar.style.transform = 'scaleX(1)';
    progressBar.style.transition = 'transform 3s linear';
    toast.appendChild(progressBar);
    
    document.body.appendChild(toast);
    
    // Trigger the slide-in animation
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        
        // Start progress bar animation
        setTimeout(() => {
            progressBar.style.transform = 'scaleX(0)';
        }, 10);
    }, 10);
    
    // Remove toast after 3 seconds
    const removeToast = () => {
        toast.style.transform = 'translateX(150%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    
    const timeoutId = setTimeout(removeToast, 3000);
    
    // Allow click to dismiss
    toast.addEventListener('click', () => {
        clearTimeout(timeoutId);
        removeToast();
    });
};

export default Toast;
