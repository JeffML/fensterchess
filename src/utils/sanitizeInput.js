export function sanitizeInput(input) {
    return input
        .replace(/["\r\n]/g, " ")   // Remove quotes and newlines, replace with space
        .replace(/\s+/g, " ")       // Collapse multiple spaces
        .trim();                    // Remove leading/trailing spaces
};

