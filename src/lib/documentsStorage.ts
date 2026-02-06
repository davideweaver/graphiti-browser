/**
 * localStorage utility for managing documents navigation state
 *
 * Persists the current folder position and last viewed document
 */

const FOLDER_PATH_KEY = "graphiti-documents-folder-path";
const LAST_DOCUMENT_KEY = "graphiti-documents-last-document";

/**
 * Get the current folder path from localStorage
 * @returns The folder path or "Documents" as default
 */
export function getCurrentFolderPath(): string {
  try {
    const stored = localStorage.getItem(FOLDER_PATH_KEY);
    return stored || "Documents";
  } catch (error) {
    console.error("Failed to read folder path from localStorage:", error);
    return "Documents";
  }
}

/**
 * Set the current folder path in localStorage
 * @param path - The folder path to save
 */
export function setCurrentFolderPath(path: string): void {
  try {
    localStorage.setItem(FOLDER_PATH_KEY, path);
  } catch (error) {
    console.error("Failed to save folder path to localStorage:", error);
  }
}

/**
 * Get the last viewed document path from localStorage
 * @returns The document path or null if not set
 */
export function getLastDocumentPath(): string | null {
  try {
    return localStorage.getItem(LAST_DOCUMENT_KEY);
  } catch (error) {
    console.error("Failed to read last document from localStorage:", error);
    return null;
  }
}

/**
 * Set the last viewed document path in localStorage
 * @param path - The document path to save
 */
export function setLastDocumentPath(path: string): void {
  try {
    localStorage.setItem(LAST_DOCUMENT_KEY, path);
  } catch (error) {
    console.error("Failed to save last document to localStorage:", error);
  }
}

/**
 * Clear the last viewed document from localStorage
 */
export function clearLastDocumentPath(): void {
  try {
    localStorage.removeItem(LAST_DOCUMENT_KEY);
  } catch (error) {
    console.error("Failed to clear last document from localStorage:", error);
  }
}

/**
 * Clear all documents navigation state from localStorage
 */
export function clearDocumentsState(): void {
  clearLastDocumentPath();
  try {
    localStorage.removeItem(FOLDER_PATH_KEY);
  } catch (error) {
    console.error("Failed to clear folder path from localStorage:", error);
  }
}
