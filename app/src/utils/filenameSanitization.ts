export const sanitizeFileName = (filename: string) =>  {
  try {
    const parts = filename.split(".");
    if (parts.length < 2) {
      return filename.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }

    const extension = parts.pop(); // get file extension
    const baseName = parts.join("."); // handle filenames with multiple dots
    const sanitizedBase = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    return `${sanitizedBase}.${extension?.toLowerCase()}`;
  } catch (error) {
    console.error("Error sanitizing filename:", error);
    return null;
  }
}
