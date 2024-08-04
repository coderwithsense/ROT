const fs = require("fs").promises;
const sharp = require("sharp");
const potrace = require("potrace");

async function extractDominantColors(inputBuffer, colorCount = 5) {
  const { data, info } = await sharp(inputBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const colorMap = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    colorMap.set(color, (colorMap.get(color) || 0) + 1);
  }

  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, colorCount)
    .map(([color]) => color.split(",").map(Number));
}

async function convertPngToSvg(inputPath, outputPath) {
  try {
    // Read the input PNG file
    const inputBuffer = await fs.readFile(inputPath);

    // Extract dominant colors
    const dominantColors = await extractDominantColors(inputBuffer);
    console.log("Dominant colors:", dominantColors);
    // Convert image to grayscale
    const grayscaleBuffer = await sharp(inputBuffer).grayscale().toBuffer();

    // Trace the image
    const svg = await new Promise((resolve, reject) => {
      potrace.trace(grayscaleBuffer, (err, svg) => {
        if (err) reject(err);
        else resolve(svg);
      });
    });

    // Replace black fill with dominant colors
    let coloredSvg = svg;
    dominantColors.forEach((color, index) => {
      const [r, g, b] = color;
      const fillColor = `rgb(${r},${g},${b})`;
      const opacity = 1 - index * 0.2; // Decrease opacity for each layer
      coloredSvg = coloredSvg.replace(
        '<g fill="#000000" stroke="none">',
        `<g fill="${fillColor}" stroke="none" opacity="${opacity}">`
      );
    });

    // Write the SVG to file
    await fs.writeFile(outputPath, coloredSvg);
    console.log(`SVG saved to ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
  }
}
// Usage
const inputFile = "files/image.png";
const outputFile = "files/image.svg";

convertPngToSvg(inputFile, outputFile);

// const fs = require('fs').promises;
// const sharp = require('sharp');
// const potrace = require('potrace');

// async function extractDominantColors(inputBuffer, colorCount = 5) {
//     const { data, info } = await sharp(inputBuffer)
//         .raw()
//         .toBuffer({ resolveWithObject: true });

//     const colorMap = new Map();
//     for (let i = 0; i < data.length; i += info.channels) {
//         const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
//         colorMap.set(color, (colorMap.get(color) || 0) + 1);
//     }

//     return Array.from(colorMap.entries())
//         .sort((a, b) => b[1] - a[1])
//         .slice(0, colorCount)
//         .map(([color]) => color.split(',').map(Number));
// }

// async function convertPngToSvg(inputPath, outputPath) {
//     try {
//         // Read the input PNG file
//         const inputBuffer = await fs.readFile(inputPath);

//         // Extract dominant colors
//         const dominantColors = await extractDominantColors(inputBuffer);
//         console.log('Dominant colors:', dominantColors);
//         // Convert image to grayscale
//         const grayscaleBuffer = await sharp(inputBuffer)
//             .grayscale()
//             .toBuffer();

//         // Trace the image
//         const svg = await new Promise((resolve, reject) => {
//             potrace.trace(grayscaleBuffer, (err, svg) => {
//                 if (err) reject(err);
//                 else resolve(svg);
//             });
//         });

//         // Replace black fill with dominant colors
//         let coloredSvg = svg;
//         dominantColors.forEach((color, index) => {
//             const [r, g, b] = color;
//             const fillColor = `rgb(${r},${g},${b})`;
//             const opacity = 1 - (index * 0.2); // Decrease opacity for each layer
//             coloredSvg = coloredSvg.replace('<g fill="#000000" stroke="none">',
//                 `<g fill="${fillColor}" stroke="none" opacity="${opacity}">`);
//         });

//         // Write the SVG to file
//         await fs.writeFile(outputPath, coloredSvg);
//         console.log(`SVG saved to ${outputPath}`);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }
// // Usage
// const inputFile = "files/image.png";
// const outputFile = "files/image.svg";

// convertPngToSvg(inputFile, outputFile);
