declare global {
    interface BigInt {
      toJSON(): string;
    }
  }
  
  // Add toJSON method to BigInt prototype
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
  
  // Prevent "unused export" error
  export {}