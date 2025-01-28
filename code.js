// Show the plugin UI
figma.showUI(__html__, { themeColors: true, width: 400, height: 600 });

// Restore previous size
figma.clientStorage.getAsync('size').then(size => {
  if (size) figma.ui.resize(size.w, size.h);
}).catch(err => {});

// Helper function to format numbers as currency (adds commas and two decimal places)
function formatCurrency(value) {
  const parts = value.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas
  return parts.join(".");
}

// Helper function to generate random data with adjustable parameters
function generateRandomData(isAdvanced, negativeChance, minValue, maxValue, numberChance) {
  const isNumber = Math.random() < (numberChance / 100);
  if (!isNumber) return "-"; // If it's not a number, return "-"

  const isNegative = Math.random() < (negativeChance / 100);
  const value = Math.random() * (maxValue - minValue) + minValue;
  const formattedValue = formatCurrency(value); // Format value with commas

  return isNegative ? `(${formattedValue})` : formattedValue;
}

// Function to recursively find all text layers within a selection
function findAllTextLayers(nodes) {
  let textLayers = [];

  for (const node of nodes) {
    if (node.type === "TEXT") {
      textLayers.push(node);
    } else if ("children" in node) {
      textLayers = textLayers.concat(findAllTextLayers(node.children));
    }
  }

  return textLayers;
}

// Function to load font for a text layer
async function loadFontForText(node) {
  try {
    await figma.loadFontAsync(node.fontName);
  } catch (error) {
    console.error(`Error loading font for node "${node.name}":`, error);
    figma.notify(`Failed to load font for "${node.name}". Skipping.`);
  }
}

// Function to insert random data into selected text layers
async function insertRandomData(isAdvanced, negativeChance, minValue, maxValue, numberChance) {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Please select at least one text layer.");
    return;
  }

  const textLayers = findAllTextLayers(selection);

  if (textLayers.length === 0) {
    figma.notify("No text layers selected.");
    return;
  }

  for (const node of textLayers) {
    await loadFontForText(node);
    const randomData = generateRandomData(isAdvanced, negativeChance, minValue, maxValue, numberChance);
    node.characters = randomData;
  }

  figma.notify("Random data inserted into selected text layers.");
}

// Function to calculate the total value of selected text layers
async function calculateTotal() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Please select at least one text layer.");
    return;
  }

  const textLayers = findAllTextLayers(selection);

  if (textLayers.length === 0) {
    figma.notify("No text layers selected.");
    return;
  }

  let total = 0;

  for (const node of textLayers) {
    const text = node.characters.trim();

    if (text !== "-") {
      const isNegative = text.startsWith("(") && text.endsWith(")");
      const cleanedText = text.replace(/[(),]/g, "");
      const numericValue = parseFloat(cleanedText);

      if (!isNaN(numericValue)) {
        total += isNegative ? -numericValue : numericValue;
      }
    }
  }

  // Format the total with commas and two decimal places
  const formattedTotal = formatCurrency(total);
  figma.ui.postMessage({ type: "updateTotal", total: formattedTotal });
}

// Listen to messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === "resize") {
    figma.ui.resize(msg.size.w, msg.size.h);
    figma.clientStorage.setAsync('size', msg.size).catch(err => {}); // Save size
  }

  if (msg.type === "generateData") {
    const isAdvanced = msg.advanced;
    const negativeChance = msg.negativeChance;
    const minValue = msg.minValue;
    const maxValue = msg.maxValue;
    const numberChance = msg.numberChance;

    // Quietly generate data
    await insertRandomData(isAdvanced, negativeChance, minValue, maxValue, numberChance);

    // Calculate total after generating data
    await calculateTotal();
  }

  if (msg.type === "calculateTotal") {
    await calculateTotal();
  }

  if (msg.type === "copyToClipboard") {
    const total = msg.total;

    try {
      navigator.clipboard.writeText(total)
        .then(() => {
          // Notify the UI about success
          figma.ui.postMessage({ type: "copyToClipboardSuccess", message: `${total} copied to clipboard!` });
        })
        .catch((err) => {
          console.error("Error copying to clipboard:", err);
          figma.ui.postMessage({ type: "copyToClipboardError", message: "Failed to copy to clipboard." });
        });
    } catch (err) {
      console.error("Clipboard operation failed:", err);
      figma.ui.postMessage({ type: "copyToClipboardError", message: "Failed to copy to clipboard." });
    }
  }
};
