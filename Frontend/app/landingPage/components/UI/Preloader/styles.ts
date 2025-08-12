'use client';
import { styled } from 'styled-components';

export const Wrapper = styled.div`
  background: var(--Background);
  color: var(--white);
  position: fixed;
  height: 100vh;
  width: 100vw;
  z-index: 9999;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Inner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2em;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  height: 100vh;
  width: 100%;

  .logo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    
    svg {
      width: 150px;
      height: 150px;
    }
    
    span {
      font-weight: 700;
      font-size: 4rem;
      color: var(--text-color);
      letter-spacing: -0.02em;
    }
  }

  .text-container {
    display: flex;
    align-items: center;
    gap: 0.1em;
    overflow: hidden;

    span {
      font-weight: 600;
      font-size: 8rem;
      color: var(--text-color);
      display: inline-block;
    }
  }

  @media (max-width: 768px) {
    .logo-container {
      svg {
        width: 100px;
        height: 100px;
      }
      
      span {
        font-size: 2.5rem;
      }
    }

    .text-container {
      span {
        font-size: 4rem;
      }
    }
  }

  @media (max-width: 480px) {
    .logo-container {
      svg {
        width: 80px;
        height: 80px;
      }
      
      span {
        font-size: 2rem;
      }
    }

    .text-container {
      span {
        font-size: 3rem;
      }
    }
  }
`;

export const SecondOverlay = styled.div`
  background: var(--emerald);
  position: fixed;
  height: 100vh;
  width: 100vw;
  z-index: 9990;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;
