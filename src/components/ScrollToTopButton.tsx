import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface ScrollToTopButtonProps {
  variant?: 'dark' | 'light';
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ variant = 'dark' }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down more than 300px
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <StyledWrapper $variant={variant}>
          <button className="button" onClick={scrollToTop} aria-label="Scroll to top">
            <svg className="svgIcon" viewBox="0 0 384 512">
              <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" />
            </svg>
          </button>
        </StyledWrapper>
      )}
    </>
  );
};

const StyledWrapper = styled.div<{ $variant: 'dark' | 'light' }>`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;

  .button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: ${props => props.$variant === 'light' ? '#171717' : 'rgb(20, 20, 20)'};
    border: none;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${props => props.$variant === 'light' 
      ? '0px 0px 0px 4px rgba(0, 0, 0, 0.1)' 
      : '0px 0px 0px 4px rgba(16, 185, 129, 0.253)'};
    cursor: pointer;
    transition-duration: 0.3s;
    overflow: hidden;
    position: relative;
  }

  .svgIcon {
    width: 12px;
    transition-duration: 0.3s;
  }

  .svgIcon path {
    fill: white;
  }

  .button:hover {
    width: 140px;
    border-radius: 50px;
    transition-duration: 0.3s;
    background-color: ${props => props.$variant === 'light' ? '#475569' : '#10b981'};
    align-items: center;
  }

  .button:hover .svgIcon {
    transition-duration: 0.3s;
    transform: translateY(-200%);
  }

  .button::before {
    position: absolute;
    bottom: -20px;
    content: "Back to Top";
    color: white;
    font-size: 0px;
  }

  .button:hover::before {
    font-size: 13px;
    opacity: 1;
    bottom: unset;
    transition-duration: 0.3s;
  }
`;

export default ScrollToTopButton;
