import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

interface OrderQRCodeProps {
  orderId: number;
  orderNumber: string;
  size?: number;
  showDownload?: boolean;
}

const OrderQRCode: React.FC<OrderQRCodeProps> = ({ orderId, orderNumber, size = 128, showDownload = false }) => {
  const qrValue = `${window.location.origin}/orders/${orderId}`;

  const downloadQRCode = () => {
    const canvas = document.createElement("canvas");
    const qrSize = size * 2; // Double size for better quality
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    // Set canvas size
    canvas.width = qrSize;
    canvas.height = qrSize;

    // Draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, qrSize, qrSize);

    // Create temporary QR code element
    const tempQR = document.createElement("div");
    tempQR.style.display = "none";
    document.body.appendChild(tempQR);
    
    // Render QR code to temp element
    const qr = <QRCodeSVG value={qrValue} size={qrSize} />;
    const svgString = new XMLSerializer().serializeToString(qr as any);
    const img = new Image();
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      
      // Add order number below QR code
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "black";
      ctx.fillText(orderNumber, qrSize / 2, qrSize - 20);
      
      // Create download link
      const link = document.createElement("a");
      link.download = `qr-code-${orderNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      // Cleanup
      document.body.removeChild(tempQR);
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgString);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <QRCodeSVG 
        value={qrValue}
        size={size}
        level="H"
        includeMargin={true}
      />
      <span className="text-sm font-medium text-gray-600">{orderNumber}</span>
      {showDownload && (
        <button
          onClick={downloadQRCode}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
        >
          <Download className="w-4 h-4" />
          <span>Download QR Code</span>
        </button>
      )}
    </div>
  );
};

export default OrderQRCode;