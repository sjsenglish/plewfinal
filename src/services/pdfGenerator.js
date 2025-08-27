import jsPDF from 'jspdf';

// Helper function to convert Firebase Storage URLs to direct URLs - EXACT MATCH to PackViewer
const getImageUrl = (url) => {
  if (!url) return '';
  
  // If it's a Firebase Storage gs:// URL, convert it
  if (url.startsWith('gs://')) {
    // Extract bucket and path from gs://bucket/path format
    const gsMatch = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (gsMatch) {
      const bucket = gsMatch[1];
      const path = gsMatch[2];
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    }
  }
  
  return url;
};

// EXACT MATCH to PackViewer image detection
const getQuestionImageUrl = (question) => {
  return question?.image_url || question?.imageFile || question?.image_file || question?.imageUrl;
};

// Colors matching PackViewer exactly
const COLORS = {
  lightPurple: '#ccccff',
  teal: '#00ced1', 
  lightTeal: '#d8f0ed',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151'
};

// Enhanced helper function to load image and embed in PDF
const addImageToPDF = async (pdf, imageUrl, x, y, maxWidth, maxHeight) => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve({ success: false, error: 'No image URL provided' });
      return;
    }

    const convertedUrl = getImageUrl(imageUrl);
    
    // Create image element to load the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Set up timeout to avoid hanging
    const timeoutId = setTimeout(() => {
      if (!img.complete) {
        img.src = ''; // Cancel the load
        resolve({ success: false, error: 'Image load timeout (15s)' });
      }
    }, 15000);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }
        
        // Center the image
        const centerX = x + (maxWidth - width) / 2;
        const centerY = y + (maxHeight - height) / 2;
        
        // Add image to PDF with format detection
        const format = convertedUrl.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
        pdf.addImage(img, format, centerX, centerY, width, height);
        resolve({ success: true, width, height, actualY: centerY + height });
        
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        resolve({ success: false, error: error.message });
      }
    };
    
    img.onerror = (error) => {
      clearTimeout(timeoutId);
      console.error('Error loading image:', convertedUrl, error);
      resolve({ success: false, error: 'Failed to load image' });
    };
    
    // Try to load the image
    try {
      img.src = convertedUrl;
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({ success: false, error: 'Invalid image URL' });
    }
  });
};

// Helper function to wrap text
const wrapText = (pdf, text, maxWidth) => {
  if (!text || typeof text !== 'string') {
    return [''];
  }
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = pdf.getTextWidth(testLine);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

// Main PDF generation function that replicates PackViewer exactly
export const generateQuestionPackPDF = async (pack, questions) => {
  return new Promise(async (resolve) => {
    try {
      // Input validation
      if (!pack) {
        throw new Error('Pack object is required');
      }
      if (!questions || !Array.isArray(questions)) {
        throw new Error('Questions array is required');
      }
      
      console.log('Starting PDF generation for pack:', pack?.title || pack?.name || 'Unknown Pack');
      console.log('Questions to process:', questions.length);
      
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Title page - matching PackViewer header
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(17, 24, 39); // #111827
      
      // Center the title
      const packTitle = pack?.title || pack?.name || 'Question Pack';
      const titleLines = wrapText(pdf, packTitle, contentWidth);
      let yPos = 40;
      
      titleLines.forEach(line => {
        const textWidth = pdf.getTextWidth(line);
        const xPos = (pageWidth - textWidth) / 2;
        pdf.text(line, xPos, yPos);
        yPos += 10;
      });
      
      // Pack info
      yPos += 20;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(107, 114, 128); // #6b7280
      
      const packInfo = [
        `Subject: ${(pack?.subject || 'Unknown').toUpperCase()}`,
        `Questions: ${questions.length}`,
        `Created: ${new Date().toLocaleDateString()}`
      ];
      
      packInfo.forEach(info => {
        const textWidth = pdf.getTextWidth(info);
        const xPos = (pageWidth - textWidth) / 2;
        pdf.text(info, xPos, yPos);
        yPos += 8;
      });
      
      // Add description if available
      if (pack?.description) {
        yPos += 20;
        pdf.setFontSize(12);
        pdf.setTextColor(75, 85, 99); // #4b5563
        const descLines = wrapText(pdf, pack.description, contentWidth);
        descLines.forEach(line => {
          const textWidth = pdf.getTextWidth(line);
          const xPos = (pageWidth - textWidth) / 2;
          pdf.text(line, xPos, yPos);
          yPos += 6;
        });
      }
      
      // Process each question - matching PackViewer layout exactly
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // Skip if question is null or undefined
        if (!question) {
          console.warn(`Skipping question ${i + 1}: question is null or undefined`);
          continue;
        }
        
        const imageUrl = getQuestionImageUrl(question);
        
        console.log(`Processing question ${i + 1}/${questions.length}`);
        
        // Add new page for each question
        pdf.addPage();
        let currentY = margin;
        
        // Question header - matching PackViewer
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(17, 24, 39); // #111827
        
        let headerText = `Question ${i + 1}`;
        if (imageUrl) headerText += ' 📷';
        
        pdf.text(headerText, margin, currentY);
        currentY += 15;
        
        // Tags section - matching PackViewer exactly
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        let tagY = currentY;
        let tagX = margin;
        
        // TSA Tags
        if (pack?.subject === 'tsa') {
          if (question.question_type) {
            pdf.setFillColor(219, 234, 254); // #dbeafe
            pdf.setTextColor(30, 64, 175); // #1e40af
            const tagWidth = pdf.getTextWidth(question.question_type) + 6;
            pdf.roundedRect(tagX, tagY - 3, tagWidth, 6, 2, 2, 'F');
            pdf.text(question.question_type, tagX + 3, tagY);
            tagX += tagWidth + 5;
          }
          
          if (question.year) {
            pdf.setFillColor(220, 252, 231); // #dcfce7
            pdf.setTextColor(22, 101, 52); // #166534
            const yearText = String(question.year);
            const tagWidth = pdf.getTextWidth(yearText) + 6;
            pdf.roundedRect(tagX, tagY - 3, tagWidth, 6, 2, 2, 'F');
            pdf.text(yearText, tagX + 3, tagY);
            tagX += tagWidth + 5;
          }
        }
        
        // Maths Tags
        if (pack?.subject === 'maths') {
          if (question.spec_topic) {
            pdf.setFillColor(221, 214, 254); // #ddd6fe
            pdf.setTextColor(91, 33, 182); // #5b21b6
            const tagWidth = pdf.getTextWidth(question.spec_topic) + 6;
            pdf.roundedRect(tagX, tagY - 3, tagWidth, 6, 2, 2, 'F');
            pdf.text(question.spec_topic, tagX + 3, tagY);
            tagX += tagWidth + 5;
          }
          
          if (question.question_topic) {
            pdf.setFillColor(254, 243, 199); // #fef3c7
            pdf.setTextColor(146, 64, 14); // #92400e
            const tagWidth = pdf.getTextWidth(question.question_topic) + 6;
            pdf.roundedRect(tagX, tagY - 3, tagWidth, 6, 2, 2, 'F');
            pdf.text(question.question_topic, tagX + 3, tagY);
            tagX += tagWidth + 5;
          }
          
          if (question.marks) {
            pdf.setFillColor(220, 252, 231); // #dcfce7
            pdf.setTextColor(22, 101, 52); // #166534
            const marksText = `${question.marks} marks`;
            const tagWidth = pdf.getTextWidth(marksText) + 6;
            pdf.roundedRect(tagX, tagY - 3, tagWidth, 6, 2, 2, 'F');
            pdf.text(marksText, tagX + 3, tagY);
            tagX += tagWidth + 5;
          }
          
          if (question.id) {
            pdf.setFillColor(224, 231, 255); // #e0e7ff
            pdf.setTextColor(55, 48, 163); // #3730a3
            const idText = question.id.split('_')[0];
            const tagWidth = pdf.getTextWidth(idText) + 6;
            pdf.roundedRect(tagX, tagY - 3, tagWidth, 6, 2, 2, 'F');
            pdf.text(idText, tagX + 3, tagY);
          }
        }
        
        currentY += 15;
        
        // Question content - matching PackViewer format
        pdf.setTextColor(75, 85, 99); // #4b5563
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        
        // TSA Format
        if (pack?.subject === 'tsa' && question.question_content) {
          // Background for question content
          pdf.setFillColor(248, 250, 252); // #f8fafc
          const contentHeight = Math.max(20, wrapText(pdf, question.question_content, contentWidth - 6).length * 6 + 8);
          pdf.roundedRect(margin, currentY - 2, contentWidth, contentHeight, 2, 2, 'F');
          
          // Question content text
          const contentLines = wrapText(pdf, question.question_content, contentWidth - 6);
          let contentY = currentY + 4;
          contentLines.forEach(line => {
            pdf.text(line, margin + 3, contentY);
            contentY += 6;
          });
          
          currentY += contentHeight + 10;
        }
        
        // Maths Format - skip question text, only show images and tags
        
        // Image section - matching PackViewer exactly
        if (imageUrl) {
          console.log(`Loading image for question ${i + 1}:`, imageUrl);
          
          // Background for image area
          const imageAreaHeight = 100;
          pdf.setFillColor(248, 250, 252); // #f8fafc
          pdf.roundedRect(margin, currentY - 2, contentWidth, imageAreaHeight, 2, 2, 'F');
          
          // Add image
          const imageResult = await addImageToPDF(
            pdf, 
            imageUrl, 
            margin + 3, 
            currentY + 5, 
            contentWidth - 6, 
            imageAreaHeight - 10
          );
          
          if (!imageResult.success) {
            console.warn(`Failed to load image for question ${i + 1}:`, imageResult.error);
            // Add "Image not available" text
            pdf.setTextColor(107, 114, 128); // #6b7280
            pdf.setFontSize(10);
            const errorText = 'Image not available';
            const textWidth = pdf.getTextWidth(errorText);
            const textX = margin + (contentWidth - textWidth) / 2;
            const textY = currentY + imageAreaHeight / 2;
            pdf.text(errorText, textX, textY);
          }
          
          currentY += imageAreaHeight + 10;
        }
        
        // TSA Options
        if (pack?.subject === 'tsa' && question.options) {
          pdf.setFontSize(11);
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(75, 85, 99);
          
          const optionLabels = ['A', 'B', 'C', 'D', 'E'];
          question.options.forEach((option, optionIndex) => {
            // Handle option as object with id and text properties
            let optionText = '';
            if (typeof option === 'object' && option !== null) {
              // Option is an object - get the text property
              optionText = String(option.text || option.answer_text || '').trim();
            } else {
              // Option is a string or other primitive
              optionText = String(option || '').trim();
            }
            
            if (optionText) {
              const fullOptionText = `${optionLabels[optionIndex]}. ${optionText}`;
              const optionLines = wrapText(pdf, fullOptionText, contentWidth);
              
              optionLines.forEach(line => {
                pdf.text(line, margin, currentY);
                currentY += 5;
              });
              currentY += 3;
            }
          });
          
          currentY += 5;
        }
        
        // Answer section removed - answers should only be viewable in pack viewer
      }
      
      console.log('PDF generation completed successfully');
      resolve({
        success: true,
        pdf,
        message: `Generated PDF with ${questions.length} questions`
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      resolve({
        success: false,
        error: error.message,
        pdf: null
      });
    }
  });
};

// Helper function to download the PDF
export const downloadPDF = (pdf, filename) => {
  try {
    if (!pdf || typeof pdf.save !== 'function') {
      throw new Error('Invalid PDF object - no save method available');
    }
    pdf.save(filename || 'question-pack.pdf');
    return { success: true };
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export default generateQuestionPackPDF;