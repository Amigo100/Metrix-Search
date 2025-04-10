// /pages/research.tsx

import React, { useState, useEffect } from 'react';

// --- Reusable Research Item Component ---
interface ResearchItemProps {
  title: string;
  description: string;
  imageUrl: string;
  pdfUrl: string;
  onImageClick: (pdfUrl: string) => void;
}

const ResearchItem = ({
  title,
  description,
  imageUrl,
  pdfUrl,
  onImageClick,
}: ResearchItemProps) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '15px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      textAlign: 'center',
      flex: '1 1 30%',
      maxWidth: '390px',
      boxSizing: 'border-box',
    },
    imageContainer: {
      width: '350px',
      height: '460px',
      marginBottom: '15px',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      border: '1px solid #ccc',
    },
    imageHover: {
      transform: 'scale(1.03)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    textContainer: {
      maxWidth: '350px',
      width: '100%',
    },
    title: {
      fontSize: '1.2em',
      fontWeight: 600,
      color: '#1a237e',
      marginBottom: '8px',
    },
    description: {
      fontSize: '0.9em',
      color: '#555',
      lineHeight: '1.5',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.imageContainer}>
        <img
          src={imageUrl}
          alt={`Research: ${title}`}
          style={{
            ...styles.image,
            ...(isHovering ? styles.imageHover : {}),
          }}
          onClick={() => onImageClick(pdfUrl)}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        />
      </div>
      <div style={styles.textContainer}>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.description}>{description}</p>
      </div>
    </div>
  );
};

// --- PDF Viewer Modal Component ---
interface PdfViewerModalProps {
  pdfUrl: string | null;
  onClose: () => void;
}
const PdfViewerModal = ({ pdfUrl, onClose }: PdfViewerModalProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isHoveringClose, setIsHoveringClose] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.4s ease-in-out',
      padding: '20px',
      boxSizing: 'border-box',
    },
    modalContent: {
      position: 'relative',
      backgroundColor: '#fff',
      width: '90%',
      height: '90%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      transform: isVisible ? 'scale(1)' : 'scale(0.8)',
      opacity: isVisible ? 1 : 0,
      transition: 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out',
      display: 'flex',
      flexDirection: 'column',
    },
    iframe: {
      flexGrow: 1,
      border: 'none',
      width: '100%',
      height: '100%',
    },
    closeButton: {
      position: 'absolute',
      top: '10px',
      right: '15px',
      background: 'rgba(0, 0, 0, 0.6)',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '35px',
      height: '35px',
      fontSize: '20px',
      lineHeight: '35px',
      textAlign: 'center',
      cursor: 'pointer',
      zIndex: 1001,
      transition: 'background 0.2s ease',
    },
    closeButtonHover: {
      background: 'rgba(255, 0, 0, 0.8)',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modalContent}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <button
          style={{
            ...styles.closeButton,
            ...(isHoveringClose ? styles.closeButtonHover : {}),
          }}
          onClick={onClose}
          onMouseEnter={() => setIsHoveringClose(true)}
          onMouseLeave={() => setIsHoveringClose(false)}
          aria-label="Close PDF viewer"
        >
          &times;
        </button>
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#view=FitH`}
            title="Research PDF Document"
            style={styles.iframe}
          />
        ) : (
          <p
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#888',
            }}
          >
            Loading PDF...
          </p>
        )}
      </div>
    </div>
  );
};

// --- Main Research Page Component ---
const ResearchPage: React.FC = () => {
  const [activePdf, setActivePdf] = useState<string | null>(null);

  const handleImageClick = (pdfUrl: string) => {
    setActivePdf(pdfUrl);
  };
  const handleClosePdf = () => {
    setActivePdf(null);
  };

  interface ResearchDataItem {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    pdfUrl: string;
  }

  const researchData: ResearchDataItem[] = [
    {
      id: 1,
      title: 'Predicting ED Length of Stay',
      description:
        'Leveraging ML models to accurately forecast patient length of stay in the ED, enabling better resource allocation.',
      imageUrl:
        'https://static.vecteezy.com/system/resources/previews/046/042/243/original/black-and-white-icon-depicting-multiple-stacked-documents-symbolizing-organization-and-paperwork-vector.jpg',
      pdfUrl: '/pdfs/Paper Draft PDF.pdf',
    },
    {
      id: 2,
      title: 'ML for Admission Probability',
      description:
        'Using gradient boosting and neural networks to predict hospital admission probability from initial ED assessment data.',
      imageUrl:
        'https://static.vecteezy.com/system/resources/previews/046/042/243/original/black-and-white-icon-depicting-multiple-stacked-documents-symbolizing-organization-and-paperwork-vector.jpg',
      pdfUrl: '/pdfs/research-admission-prob.pdf',
    },
    {
      id: 3,
      title: 'Predicting Wait Times',
      description:
        'Estimating patient waiting times pre-consultation using queuing theory and ML, considering acuity and resources.',
      imageUrl:
        'https://static.vecteezy.com/system/resources/previews/046/042/243/original/black-and-white-icon-depicting-multiple-stacked-documents-symbolizing-organization-and-paperwork-vector.jpg',
      pdfUrl: '/pdfs/research-wait-times.pdf',
    },
  ];

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      padding: '30px 40px',
      backgroundColor: '#f4f6f8',
      minHeight: 'calc(100vh - 60px)',
      boxSizing: 'border-box',
    },
    pageTitle: {
      fontSize: '2em',
      fontWeight: 'bold',
      color: '#0d1b5a',
      marginBottom: '30px',
      borderBottom: '2px solid #1a237e',
      paddingBottom: '10px',
      textAlign: 'center',
    },
    researchItemsContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'stretch',
      flexWrap: 'wrap',
      gap: '20px',
    },
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.pageTitle}>Metrix AI Research Highlights</h1>

      <div style={styles.researchItemsContainer}>
        {researchData.map((item) => (
          <ResearchItem
            key={item.id}
            title={item.title}
            description={item.description}
            imageUrl={item.imageUrl}
            pdfUrl={item.pdfUrl}
            onImageClick={handleImageClick}
          />
        ))}
      </div>

      {activePdf && (
        <PdfViewerModal pdfUrl={activePdf} onClose={handleClosePdf} />
      )}
    </div>
  );
};

export default ResearchPage;
