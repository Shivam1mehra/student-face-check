import { useState } from 'react';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export const useFaceRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detector, setDetector] = useState<any>(null);

  const initializeFaceDetection = async () => {
    try {
      setIsProcessing(true);
      const faceDetector = await pipeline(
        'object-detection',
        'Xenova/yolov5s',
        { device: 'webgpu' }
      );
      setDetector(faceDetector);
      return faceDetector;
    } catch (error) {
      console.error('Error initializing face detection:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const detectFaces = async (imageElement: HTMLImageElement) => {
    try {
      setIsProcessing(true);
      
      if (!detector) {
        await initializeFaceDetection();
      }

      const result = await detector(imageElement);
      
      // Filter for person/face detections
      const faces = result.filter((detection: any) => 
        detection.label === 'person' && detection.score > 0.5
      );

      return faces;
    } catch (error) {
      console.error('Error detecting faces:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const extractFaceFeatures = async (imageElement: HTMLImageElement, boundingBox?: any) => {
    try {
      setIsProcessing(true);
      
      // Create canvas to crop face region
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      let cropX = 0, cropY = 0, cropWidth = imageElement.width, cropHeight = imageElement.height;

      if (boundingBox) {
        cropX = boundingBox.xmin;
        cropY = boundingBox.ymin;
        cropWidth = boundingBox.xmax - boundingBox.xmin;
        cropHeight = boundingBox.ymax - boundingBox.ymin;
      }

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      ctx.drawImage(imageElement, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      // Convert to features - simplified encoding for demo
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const features = Array.from(imageData.data.slice(0, 128)); // Simple feature vector
      
      return features;
    } catch (error) {
      console.error('Error extracting face features:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const compareFaces = (features1: number[], features2: number[], threshold = 0.8) => {
    if (!features1 || !features2 || features1.length !== features2.length) {
      return false;
    }

    // Simple cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return similarity > threshold;
  };

  return {
    isProcessing,
    initializeFaceDetection,
    detectFaces,
    extractFaceFeatures,
    compareFaces,
  };
};