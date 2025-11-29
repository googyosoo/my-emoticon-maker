/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
        img.src = src;
    });
}

/**
 * Creates a single "photo album" page image from a collection of emotion images.
 * @param imageData A record mapping emotion labels to their image data URLs.
 * @returns A promise that resolves to a data URL of the generated album page (JPEG format).
 */
export async function createAlbumPage(imageData: Record<string, string>): Promise<string> {
    const canvas = document.createElement('canvas');
    const canvasWidth = 2480;
    const canvasHeight = 3508;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D canvas context');
    }

    // 1. Background - Dark & Trendy
    ctx.fillStyle = '#09090b'; 
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Add subtle gradient blobs to background
    const gradient = ctx.createRadialGradient(canvasWidth/2, canvasHeight/2, 0, canvasWidth/2, canvasHeight/2, canvasWidth);
    gradient.addColorStop(0, '#18181b');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0, canvasWidth, canvasHeight);

    // 2. Title
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(163, 230, 53, 0.5)'; // Lime shadow
    ctx.shadowBlur = 20;
    
    ctx.font = `bold 120px 'Black Han Sans', sans-serif`; 
    ctx.fillStyle = '#a3e635'; // Lime color
    ctx.fillText('나만의 이모티콘 컬렉션', canvasWidth / 2, 200);

    ctx.shadowBlur = 0;
    ctx.font = `60px 'Do Hyeon', sans-serif`;
    ctx.fillStyle = '#71717a';
    ctx.fillText('Made with Gemini AI', canvasWidth / 2, 290);

    // 3. Load images
    const labels = Object.keys(imageData);
    const loadedImages = await Promise.all(
        Object.values(imageData).map(url => loadImage(url))
    );

    const imagesWithLabels = labels.map((label, index) => ({
        label,
        img: loadedImages[index],
    }));

    // 4. Grid Layout
    const grid = { cols: 2, rows: 3, padding: 120 };
    const contentTopMargin = 400;
    const contentHeight = canvasHeight - contentTopMargin;
    const cellWidth = (canvasWidth - grid.padding * (grid.cols + 1)) / grid.cols;
    const cellHeight = (contentHeight - grid.padding * (grid.rows + 1)) / grid.rows;

    const cardAspectRatio = 3/4; 
    const cardHeight = cellHeight * 0.9;
    const cardWidth = cardHeight * cardAspectRatio;

    // Draw each card
    imagesWithLabels.forEach(({ label, img }, index) => {
        const row = Math.floor(index / grid.cols);
        const col = index % grid.cols;

        const x = grid.padding * (col + 1) + cellWidth * col + (cellWidth - cardWidth) / 2;
        const y = contentTopMargin + grid.padding * (row + 1) + cellHeight * row + (cellHeight - cardHeight) / 2;
        
        ctx.save();
        
        ctx.translate(x + cardWidth / 2, y + cardHeight / 2);
        
        // Less rotation for a cleaner sticker look
        const rotation = (Math.random() - 0.5) * 0.05; 
        ctx.rotate(rotation);
        
        // Card Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 20;
        
        // Card Background (Glass effect simulation)
        ctx.fillStyle = '#27272a'; // Zinc-800
        
        // Rounded rect clipping for card
        const radius = 40;
        ctx.beginPath();
        ctx.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
        ctx.fill();
        ctx.clip();

        // Image
        const imgHeight = cardHeight * 0.85; // Image takes up 85% of height
        const imgWidth = cardWidth;
        
        // Calculate aspect ratio to cover
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = imgWidth / imgHeight;
        let drawW, drawH, offX, offY;

        if (imgRatio > targetRatio) {
            drawH = imgHeight;
            drawW = drawH * imgRatio;
            offX = -(drawW - imgWidth) / 2;
            offY = 0;
        } else {
            drawW = imgWidth;
            drawH = drawW / imgRatio;
            offX = 0;
            offY = -(drawH - imgHeight) / 2;
        }

        // Draw image at top of card
        ctx.drawImage(img, offX - cardWidth/2, offY - cardHeight/2, drawW, drawH);

        // Label Area
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-cardWidth/2, cardHeight/2 - (cardHeight - imgHeight), cardWidth, (cardHeight - imgHeight));
        
        // Label Text
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#a3e635'; // Lime
        ctx.font = `60px 'Do Hyeon', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Center text in the bottom area
        const textY = (cardHeight/2) - ((cardHeight - imgHeight) / 2);
        ctx.fillText("#" + label, 0, textY);
        
        ctx.restore();
    });

    return canvas.toDataURL('image/jpeg', 0.9);
}